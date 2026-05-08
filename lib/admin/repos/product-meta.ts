import "server-only";
import { getDb } from "../db";

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

export function getMeta(slug: string): ProductMeta {
  const r = getDb().prepare("SELECT * FROM product_meta WHERE product_slug = ?").get(slug) as
    | ProductMeta
    | undefined;
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

export function upsertMeta(meta: ProductMeta): void {
  getDb()
    .prepare(
      `INSERT INTO product_meta
         (product_slug, is_featured, is_trending, is_new_arrival,
          short_description, long_description, meta_title, meta_description, og_image_path)
       VALUES
         (@product_slug, @is_featured, @is_trending, @is_new_arrival,
          @short_description, @long_description, @meta_title, @meta_description, @og_image_path)
       ON CONFLICT(product_slug) DO UPDATE SET
         is_featured       = excluded.is_featured,
         is_trending       = excluded.is_trending,
         is_new_arrival    = excluded.is_new_arrival,
         short_description = excluded.short_description,
         long_description  = excluded.long_description,
         meta_title        = excluded.meta_title,
         meta_description  = excluded.meta_description,
         og_image_path     = excluded.og_image_path`,
    )
    .run(meta);
}

export function listFeatured(limit = 12): Array<{ slug: string }> {
  return getDb()
    .prepare(
      `SELECT pm.product_slug as slug FROM product_meta pm
       JOIN products p ON p.slug = pm.product_slug
       WHERE pm.is_featured = 1 AND p.status = 'active'
       ORDER BY p.updated_at DESC LIMIT ?`,
    )
    .all(limit) as Array<{ slug: string }>;
}

export function listTrending(limit = 12): Array<{ slug: string }> {
  return getDb()
    .prepare(
      `SELECT pm.product_slug as slug FROM product_meta pm
       JOIN products p ON p.slug = pm.product_slug
       WHERE pm.is_trending = 1 AND p.status = 'active'
       ORDER BY p.updated_at DESC LIMIT ?`,
    )
    .all(limit) as Array<{ slug: string }>;
}

export function listNewArrivals(limit = 12): Array<{ slug: string }> {
  return getDb()
    .prepare(
      `SELECT pm.product_slug as slug FROM product_meta pm
       JOIN products p ON p.slug = pm.product_slug
       WHERE pm.is_new_arrival = 1 AND p.status = 'active'
       ORDER BY p.updated_at DESC LIMIT ?`,
    )
    .all(limit) as Array<{ slug: string }>;
}
