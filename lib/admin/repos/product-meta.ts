import "server-only";
import { sql } from "../db";

export type ProductMeta = {
  product_slug: string;
  is_featured: number;
  is_trending: number;
  is_new_arrival: number;
  short_description: string;
  long_description: string;
  meta_title: string;
  meta_description: string;
  og_image_path: string;
};

export async function getMeta(slug: string): Promise<ProductMeta> {
  const r = await sql.get<ProductMeta>(
    "SELECT * FROM product_meta WHERE product_slug = ?",
    [slug],
  );
  return (
    r ?? {
      product_slug: slug,
      is_featured: 0,
      is_trending: 0,
      is_new_arrival: 0,
      short_description: "",
      long_description: "",
      meta_title: "",
      meta_description: "",
      og_image_path: "",
    }
  );
}

export async function upsertMeta(meta: ProductMeta): Promise<void> {
  await sql.run(
    `INSERT INTO product_meta
         (product_slug, is_featured, is_trending, is_new_arrival,
          short_description, long_description, meta_title, meta_description, og_image_path)
       VALUES
         (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(product_slug) DO UPDATE SET
         is_featured       = excluded.is_featured,
         is_trending       = excluded.is_trending,
         is_new_arrival    = excluded.is_new_arrival,
         short_description = excluded.short_description,
         long_description  = excluded.long_description,
         meta_title        = excluded.meta_title,
         meta_description  = excluded.meta_description,
         og_image_path     = excluded.og_image_path`,
    [
      meta.product_slug,
      meta.is_featured,
      meta.is_trending,
      meta.is_new_arrival,
      meta.short_description,
      meta.long_description,
      meta.meta_title,
      meta.meta_description,
      meta.og_image_path,
    ],
  );
}

export async function listFeatured(limit = 12): Promise<Array<{ slug: string }>> {
  return sql.all<{ slug: string }>(
    `SELECT pm.product_slug as slug FROM product_meta pm
       JOIN products p ON p.slug = pm.product_slug
       WHERE pm.is_featured = 1 AND p.status = 'active'
       ORDER BY p.updated_at DESC LIMIT ?`,
    [limit],
  );
}

export async function listTrending(limit = 12): Promise<Array<{ slug: string }>> {
  return sql.all<{ slug: string }>(
    `SELECT pm.product_slug as slug FROM product_meta pm
       JOIN products p ON p.slug = pm.product_slug
       WHERE pm.is_trending = 1 AND p.status = 'active'
       ORDER BY p.updated_at DESC LIMIT ?`,
    [limit],
  );
}

export async function listNewArrivals(limit = 12): Promise<Array<{ slug: string }>> {
  return sql.all<{ slug: string }>(
    `SELECT pm.product_slug as slug FROM product_meta pm
       JOIN products p ON p.slug = pm.product_slug
       WHERE pm.is_new_arrival = 1 AND p.status = 'active'
       ORDER BY p.updated_at DESC LIMIT ?`,
    [limit],
  );
}
