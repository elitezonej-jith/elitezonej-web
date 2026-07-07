import "server-only";
import { sql } from "../db";

export type ProductFilterTag = {
  filter_id: number;
  option_id: number;
  value: string;
  field_key: string;
};

/** Get all filter tags for a single product */
export async function getTagsForProduct(slug: string): Promise<ProductFilterTag[]> {
  return sql.all<ProductFilterTag>(
    `SELECT pf.filter_id, pf.option_id, fo.value, cf.field_key
     FROM product_filter_values pf
     JOIN filter_options fo ON fo.id = pf.option_id
     JOIN category_filters cf ON cf.id = pf.filter_id
     WHERE pf.product_slug = ?`,
    [slug],
  );
}

/** Get filter tags for multiple products (batch, for storefront listing) */
export async function getTagsForProducts(slugs: string[]): Promise<Map<string, ProductFilterTag[]>> {
  if (!slugs.length) return new Map();
  const placeholders = slugs.map(() => "?").join(",");
  const rows = await sql.all<ProductFilterTag & { product_slug: string }>(
    `SELECT pf.product_slug, pf.filter_id, pf.option_id, fo.value, cf.field_key
     FROM product_filter_values pf
     JOIN filter_options fo ON fo.id = pf.option_id
     JOIN category_filters cf ON cf.id = pf.filter_id
     WHERE pf.product_slug IN (${placeholders})`,
    slugs,
  );
  const map = new Map<string, ProductFilterTag[]>();
  for (const row of rows) {
    const existing = map.get(row.product_slug) || [];
    existing.push({ filter_id: row.filter_id, option_id: row.option_id, value: row.value, field_key: row.field_key });
    map.set(row.product_slug, existing);
  }
  return map;
}

/** Replace all filter tags for a product (delete + insert) */
export async function setTagsForProduct(
  slug: string,
  tags: Array<{ filter_id: number; option_id: number }>,
): Promise<void> {
  await sql.tx(async (t) => {
    await t.run("DELETE FROM product_filter_values WHERE product_slug = ?", [slug]);
    for (const tag of tags) {
      await t.run(
        "INSERT INTO product_filter_values (product_slug, filter_id, option_id) VALUES (?, ?, ?) ON CONFLICT (product_slug, option_id) DO NOTHING",
        [slug, tag.filter_id, tag.option_id],
      );
    }
  });
}
