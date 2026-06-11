import "server-only";
import { sql } from "../db";

export type ProductImage = {
  id: number;
  product_slug: string;
  image_path: string;
  alt: string;
  sort_order: number;
  is_thumbnail: number;
  is_hover: number;
};

export async function listImages(slug: string): Promise<ProductImage[]> {
  return sql.all<ProductImage>(
    "SELECT * FROM product_images WHERE product_slug = ? ORDER BY sort_order ASC, id ASC",
    [slug],
  );
}

// Batched read for the storefront list path — one query for many slugs instead
// of one `listImages` + one/two `getThumbnail` queries per product (kills the
// N+1). Rows arrive pre-sorted; grouped by slug preserving `sort_order ASC, id
// ASC`. Slugs with no rows are simply absent from the Map (callers fall back to
// `fallbackImages(slug)`, exactly as the per-product path does).
export async function listImagesForSlugs(slugs: string[]): Promise<Map<string, ProductImage[]>> {
  const map = new Map<string, ProductImage[]>();
  if (slugs.length === 0) return map; // never emit `IN ()`
  const placeholders = slugs.map(() => "?").join(",");
  const rows = await sql.all<ProductImage>(
    `SELECT * FROM product_images WHERE product_slug IN (${placeholders})
     ORDER BY sort_order ASC, id ASC`,
    slugs,
  );
  for (const r of rows) {
    let arr = map.get(r.product_slug);
    if (!arr) {
      arr = [];
      map.set(r.product_slug, arr);
    }
    arr.push(r);
  }
  return map;
}

// Derive the thumbnail from an already-fetched, sort-ordered image list without
// another query. Mirrors `getThumbnail`'s rule precisely: an explicit
// `is_thumbnail = 1` row wins, else the first image by sort order. Returns null
// for an empty list (caller then falls back to the first fallback image).
export function thumbnailFromImages(images: ProductImage[]): string | null {
  if (images.length === 0) return null;
  const flagged = images.find((i) => i.is_thumbnail === 1);
  return (flagged ?? images[0]).image_path;
}

export async function getThumbnail(slug: string): Promise<string | null> {
  const r = await sql.get<{ image_path: string }>(
    `SELECT image_path FROM product_images
     WHERE product_slug = ? AND is_thumbnail = 1
     ORDER BY sort_order ASC LIMIT 1`,
    [slug],
  );
  if (r) return r.image_path;
  // fall back to first image
  const f = await sql.get<{ image_path: string }>(
    "SELECT image_path FROM product_images WHERE product_slug = ? ORDER BY sort_order ASC LIMIT 1",
    [slug],
  );
  return f?.image_path ?? null;
}

export async function addImage(slug: string, image_path: string, alt = ""): Promise<number> {
  const maxRow = await sql.get<{ m: number | string }>(
    "SELECT COALESCE(MAX(sort_order),0) as m FROM product_images WHERE product_slug = ?",
    [slug],
  );
  const max = Number(maxRow?.m ?? 0);
  const r = await sql.run(
    `INSERT INTO product_images (product_slug, image_path, alt, sort_order, is_thumbnail, is_hover)
    VALUES (?, ?, ?, ?, 0, 0) RETURNING id`,
    [slug, image_path, alt, max + 10],
  );
  return Number(r.rows[0].id);
}

export async function deleteImage(id: number, slug: string): Promise<void> {
  await sql.run(
    "DELETE FROM product_images WHERE id = ? AND product_slug = ?",
    [id, slug],
  );
}

export async function setThumbnail(slug: string, id: number): Promise<void> {
  await sql.tx(async (t) => {
    await t.run("UPDATE product_images SET is_thumbnail = 0 WHERE product_slug = ?", [slug]);
    await t.run("UPDATE product_images SET is_thumbnail = 1 WHERE id = ?", [id]);
  });
}

export async function setHover(slug: string, id: number): Promise<void> {
  await sql.tx(async (t) => {
    await t.run("UPDATE product_images SET is_hover = 0 WHERE product_slug = ?", [slug]);
    await t.run("UPDATE product_images SET is_hover = 1 WHERE id = ?", [id]);
  });
}

export async function reorderImages(slug: string, orderedIds: number[]): Promise<void> {
  await sql.tx(async (t) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await t.run("UPDATE product_images SET sort_order = ? WHERE id = ? AND product_slug = ?", [
        (i + 1) * 10,
        orderedIds[i],
        slug,
      ]);
    }
  });
}

export async function updateAlt(id: number, alt: string, slug: string): Promise<void> {
  await sql.run(
    "UPDATE product_images SET alt = ? WHERE id = ? AND product_slug = ?",
    [alt, id, slug],
  );
}

// On products that don't yet have any rows in product_images, derive a fallback
// list of file paths from the existing /public/generated/{slug}/ directory.
import fs from "node:fs";
import path from "node:path";

export function fallbackImages(slug: string): string[] {
  const dir = path.resolve(process.cwd(), "public", "generated", slug);
  try {
    const files = fs
      .readdirSync(dir)
      .filter((f) => /\.(webp|png|jpg|jpeg)$/i.test(f))
      .sort();
    return files.map((f) => `/generated/${slug}/${f}`);
  } catch {
    return [];
  }
}
