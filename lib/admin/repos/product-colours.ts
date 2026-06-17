import "server-only";
import { sql } from "../db";

export type ProductColour = {
  id: number;
  product_slug: string;
  name: string;
  hex: string;
  sort_order: number;
  is_default: number;
};

export async function listColours(slug: string): Promise<ProductColour[]> {
  return sql.all<ProductColour>(
    "SELECT * FROM product_colours WHERE product_slug = ? ORDER BY sort_order, id",
    [slug],
  );
}

export async function getColour(id: number): Promise<ProductColour | null> {
  return sql.get<ProductColour>("SELECT * FROM product_colours WHERE id = ?", [id]);
}

export async function createColour(data: {
  product_slug: string;
  name: string;
  hex: string;
  sort_order?: number;
  is_default?: number;
}): Promise<number> {
  // If marking as default, clear existing default first
  if (data.is_default) {
    await sql.run(
      "UPDATE product_colours SET is_default = 0 WHERE product_slug = ?",
      [data.product_slug],
    );
  }
  const res = await sql.run(
    `INSERT INTO product_colours (product_slug, name, hex, sort_order, is_default)
     VALUES (?, ?, ?, ?, ?) RETURNING id`,
    [data.product_slug, data.name, data.hex, data.sort_order ?? 0, data.is_default ?? 0],
  );
  return (res.rows[0]?.id as number) ?? 0;
}

export async function updateColour(
  id: number,
  data: { name?: string; hex?: string; sort_order?: number; is_default?: number },
): Promise<void> {
  const current = await getColour(id);
  if (!current) return;
  if (data.is_default) {
    await sql.run(
      "UPDATE product_colours SET is_default = 0 WHERE product_slug = ?",
      [current.product_slug],
    );
  }
  const sets: string[] = [];
  const params: unknown[] = [];
  if (data.name !== undefined) { sets.push("name = ?"); params.push(data.name); }
  if (data.hex !== undefined) { sets.push("hex = ?"); params.push(data.hex); }
  if (data.sort_order !== undefined) { sets.push("sort_order = ?"); params.push(data.sort_order); }
  if (data.is_default !== undefined) { sets.push("is_default = ?"); params.push(data.is_default); }
  if (sets.length === 0) return;
  params.push(id);
  await sql.run(`UPDATE product_colours SET ${sets.join(", ")} WHERE id = ?`, params);
}

export async function deleteColour(id: number): Promise<void> {
  // colour_id on product_images has ON DELETE SET NULL, so images become unassigned
  await sql.run("DELETE FROM product_colours WHERE id = ?", [id]);
}

export async function reorderColours(slug: string, orderedIds: number[]): Promise<void> {
  for (let i = 0; i < orderedIds.length; i++) {
    await sql.run(
      "UPDATE product_colours SET sort_order = ? WHERE id = ? AND product_slug = ?",
      [i, orderedIds[i], slug],
    );
  }
}
