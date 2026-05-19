import "server-only";
import { sql } from "../db";
import type { Category } from "../types";

export async function listCategories(): Promise<Category[]> {
  return sql.all<Category>(
    "SELECT * FROM categories ORDER BY parent_id IS NULL DESC, parent_id ASC, sort_order ASC, name ASC",
  );
}

export async function createCategory(input: Omit<Category, "id">): Promise<number> {
  const r = await sql.run(
    `INSERT INTO categories (parent_id, name, slug, gender, kind, sort_order) VALUES (?, ?, ?, ?, ?, ?) RETURNING id`,
    [input.parent_id, input.name, input.slug, input.gender, input.kind, input.sort_order],
  );
  return Number(r.rows[0].id);
}

export async function updateCategory(id: number, patch: Partial<Category>): Promise<void> {
  const cols = ["parent_id","name","slug","gender","kind","sort_order"] as const;
  const present = cols.filter((c) => c in patch);
  if (!present.length) return;
  const set = present.map((c) => `${c} = ?`);
  const params = present.map((c) => (patch as Record<string, unknown>)[c]);
  params.push(id);
  await sql.run(`UPDATE categories SET ${set.join(", ")} WHERE id = ?`, params);
}

export async function deleteCategory(id: number): Promise<void> {
  await sql.run("DELETE FROM categories WHERE id = ?", [id]);
}
