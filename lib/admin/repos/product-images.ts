import "server-only";
import { getDb } from "../db";

export type ProductImage = {
  id: number;
  product_slug: string;
  image_path: string;
  alt: string;
  sort_order: number;
  is_thumbnail: number;
  is_hover: number;
};

export function listImages(slug: string): ProductImage[] {
  return getDb()
    .prepare("SELECT * FROM product_images WHERE product_slug = ? ORDER BY sort_order ASC, id ASC")
    .all(slug) as ProductImage[];
}

export function getThumbnail(slug: string): string | null {
  const r = getDb()
    .prepare(
      `SELECT image_path FROM product_images
       WHERE product_slug = ? AND is_thumbnail = 1
       ORDER BY sort_order ASC LIMIT 1`,
    )
    .get(slug) as { image_path: string } | undefined;
  if (r) return r.image_path;
  // fall back to first image
  const f = getDb()
    .prepare("SELECT image_path FROM product_images WHERE product_slug = ? ORDER BY sort_order ASC LIMIT 1")
    .get(slug) as { image_path: string } | undefined;
  return f?.image_path ?? null;
}

export function addImage(slug: string, image_path: string, alt = ""): number {
  const db = getDb();
  const max = (db
    .prepare("SELECT COALESCE(MAX(sort_order),0) as m FROM product_images WHERE product_slug = ?")
    .get(slug) as { m: number }).m;
  const r = db.prepare(`
    INSERT INTO product_images (product_slug, image_path, alt, sort_order, is_thumbnail, is_hover)
    VALUES (?, ?, ?, ?, 0, 0)
  `).run(slug, image_path, alt, max + 10);
  return Number(r.lastInsertRowid);
}

export function deleteImage(id: number, slug: string): void {
  getDb()
    .prepare("DELETE FROM product_images WHERE id = ? AND product_slug = ?")
    .run(id, slug);
}

export function setThumbnail(slug: string, id: number): void {
  const db = getDb();
  const tx = db.transaction(() => {
    db.prepare("UPDATE product_images SET is_thumbnail = 0 WHERE product_slug = ?").run(slug);
    db.prepare("UPDATE product_images SET is_thumbnail = 1 WHERE id = ?").run(id);
  });
  tx();
}

export function setHover(slug: string, id: number): void {
  const db = getDb();
  const tx = db.transaction(() => {
    db.prepare("UPDATE product_images SET is_hover = 0 WHERE product_slug = ?").run(slug);
    db.prepare("UPDATE product_images SET is_hover = 1 WHERE id = ?").run(id);
  });
  tx();
}

export function reorderImages(slug: string, orderedIds: number[]): void {
  const db = getDb();
  const stmt = db.prepare("UPDATE product_images SET sort_order = ? WHERE id = ? AND product_slug = ?");
  const tx = db.transaction(() => {
    orderedIds.forEach((id, i) => stmt.run((i + 1) * 10, id, slug));
  });
  tx();
}

export function updateAlt(id: number, alt: string, slug: string): void {
  getDb()
    .prepare("UPDATE product_images SET alt = ? WHERE id = ? AND product_slug = ?")
    .run(alt, id, slug);
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
