import "server-only";
import { sql } from "../db";
import type { FabricMetaRow, FabricColourRow } from "../types";

export async function getFabricMeta(slug: string): Promise<FabricMetaRow | null> {
  return sql.get<FabricMetaRow>(
    "SELECT * FROM fabric_meta WHERE product_slug = ?",
    [slug],
  );
}

export async function upsertFabricMeta(slug: string, meta: Omit<FabricMetaRow, "product_slug">): Promise<void> {
  await sql.run(
    `INSERT INTO fabric_meta (product_slug, width_inches, gsm, composition, care, origin, stock_meters_total)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(product_slug) DO UPDATE SET
       width_inches = excluded.width_inches,
       gsm = excluded.gsm,
       composition = excluded.composition,
       care = excluded.care,
       origin = excluded.origin,
       stock_meters_total = excluded.stock_meters_total`,
    [slug, meta.width_inches, meta.gsm, meta.composition, meta.care, meta.origin, meta.stock_meters_total],
  );
}

export async function listFabricColours(slug: string): Promise<FabricColourRow[]> {
  return sql.all<FabricColourRow>(
    "SELECT * FROM fabric_colours WHERE product_slug = ? ORDER BY sort_order ASC, name ASC",
    [slug],
  );
}

export type FabricColourInput = {
  name: string;
  hex: string;
  stock_meters: number;
  image_dir?: string | null;
};

export async function setFabricColours(slug: string, colours: FabricColourInput[]): Promise<void> {
  await sql.tx(async (t) => {
    await t.run("DELETE FROM fabric_colours WHERE product_slug = ?", [slug]);
    for (let i = 0; i < colours.length; i++) {
      const c = colours[i];
      await t.run(
        `INSERT INTO fabric_colours (product_slug, name, hex, stock_meters, image_dir, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [slug, c.name, c.hex, c.stock_meters, c.image_dir ?? null, i],
      );
    }
  });
}
