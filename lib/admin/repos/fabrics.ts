import "server-only";
import { getDb } from "../db";
import type { FabricMetaRow, FabricColourRow } from "../types";

export function getFabricMeta(slug: string): FabricMetaRow | null {
  return (getDb()
    .prepare("SELECT * FROM fabric_meta WHERE product_slug = ?")
    .get(slug) as FabricMetaRow | undefined) ?? null;
}

export function upsertFabricMeta(slug: string, meta: Omit<FabricMetaRow, "product_slug">): void {
  getDb()
    .prepare(
      `INSERT INTO fabric_meta (product_slug, width_inches, gsm, composition, care, origin, stock_meters_total)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(product_slug) DO UPDATE SET
         width_inches = excluded.width_inches,
         gsm = excluded.gsm,
         composition = excluded.composition,
         care = excluded.care,
         origin = excluded.origin,
         stock_meters_total = excluded.stock_meters_total`,
    )
    .run(slug, meta.width_inches, meta.gsm, meta.composition, meta.care, meta.origin, meta.stock_meters_total);
}

export function listFabricColours(slug: string): FabricColourRow[] {
  return getDb()
    .prepare(
      "SELECT * FROM fabric_colours WHERE product_slug = ? ORDER BY sort_order ASC, name ASC",
    )
    .all(slug) as FabricColourRow[];
}

export type FabricColourInput = {
  name: string;
  hex: string;
  stock_meters: number;
  image_dir?: string | null;
};

export function setFabricColours(slug: string, colours: FabricColourInput[]): void {
  const db = getDb();
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM fabric_colours WHERE product_slug = ?").run(slug);
    const ins = db.prepare(
      `INSERT INTO fabric_colours (product_slug, name, hex, stock_meters, image_dir, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );
    colours.forEach((c, i) =>
      ins.run(slug, c.name, c.hex, c.stock_meters, c.image_dir ?? null, i),
    );
  });
  tx();
}
