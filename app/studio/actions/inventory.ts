"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "../../../lib/admin/session";
import { sql } from "../../../lib/admin/db";
import { bustInventory } from "../../../lib/storefront/cache";

export async function updateStockAction(fd: FormData): Promise<void> {
  await requireUser("/studio/login");
  const slug = String(fd.get("slug") ?? "");
  const size = String(fd.get("size") ?? "");
  const stock = Math.max(0, Number(fd.get("stock") ?? 0));
  if (!slug || !size) return;

  await sql.run(
    `INSERT INTO inventory (product_slug, size, stock, oos_flag)
     VALUES (?, ?, ?, ?)
     ON CONFLICT (product_slug, size) DO UPDATE SET stock = ?, oos_flag = ?`,
    [slug, size, stock, stock === 0 ? 1 : 0, stock, stock === 0 ? 1 : 0],
  );
  bustInventory();
  revalidatePath("/studio/inventory");
}

export async function startTrackingAction(fd: FormData): Promise<void> {
  await requireUser("/studio/login");
  const slug = String(fd.get("slug") ?? "");
  const sizesRaw = String(fd.get("sizes") ?? "");
  const initialStock = Math.max(0, Number(fd.get("initial_stock") ?? 0));
  if (!slug || !sizesRaw) return;

  const sizes = sizesRaw.split(",").map(s => s.trim()).filter(Boolean);
  if (!sizes.length) return;

  await sql.tx(async (t) => {
    for (const size of sizes) {
      await t.run(
        `INSERT INTO inventory (product_slug, size, stock, oos_flag)
         VALUES (?, ?, ?, ?)
         ON CONFLICT (product_slug, size) DO NOTHING`,
        [slug, size, initialStock, initialStock === 0 ? 1 : 0],
      );
    }
  });

  bustInventory();
  revalidatePath("/studio/inventory");
  redirect("/studio/inventory?flash=Stock+tracking+started");
}

export async function updateFabricStockAction(fd: FormData): Promise<void> {
  await requireUser("/studio/login");
  const slug = String(fd.get("slug") ?? "");
  const colourId = Number(fd.get("colour_id") ?? 0);
  const stockMeters = Math.max(0, Math.round(Number(fd.get("stock_meters") ?? 0)));
  if (!slug || !colourId) return;

  await sql.run(
    "UPDATE fabric_colours SET stock_meters = ? WHERE id = ? AND product_slug = ?",
    [stockMeters, colourId, slug],
  );

  // Sync the aggregate total in fabric_meta
  const sum = await sql.get<{ total: number }>(
    "SELECT COALESCE(SUM(stock_meters), 0) as total FROM fabric_colours WHERE product_slug = ?",
    [slug],
  );
  await sql.run(
    "UPDATE fabric_meta SET stock_meters_total = ? WHERE product_slug = ?",
    [sum?.total ?? 0, slug],
  );

  bustInventory();
  revalidatePath("/studio/inventory");
}

/**
 * Ensures every non-archived tailored product has inventory tracking rows.
 * Products get a row per size (from sizes_json) with stock=0.
 * Idempotent — uses ON CONFLICT DO NOTHING.
 */
export async function ensureAllProductsTracked(): Promise<number> {
  const untracked = await sql.all<{ slug: string; sizes_json: string; kind: string }>(
    `SELECT slug, sizes_json, kind FROM products
     WHERE status != 'archived' AND kind = 'tailored'
       AND slug NOT IN (SELECT DISTINCT product_slug FROM inventory)`
  );
  if (untracked.length === 0) return 0;

  await sql.tx(async (t) => {
    for (const product of untracked) {
      let sizes: string[] = [];
      try { sizes = JSON.parse(product.sizes_json); } catch { /* skip */ }
      if (!Array.isArray(sizes) || sizes.length === 0) {
        sizes = ["Free"]; // default for products with no sizes defined
      }
      for (const size of sizes) {
        const cleanSize = size.replace(/-oos$/, "").trim();
        if (!cleanSize) continue;
        await t.run(
          `INSERT INTO inventory (product_slug, size, stock, oos_flag)
           VALUES (?, ?, 0, 1)
           ON CONFLICT (product_slug, size) DO NOTHING`,
          [product.slug, cleanSize],
        );
      }
    }
  });

  return untracked.length;
}
