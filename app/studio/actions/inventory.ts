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
