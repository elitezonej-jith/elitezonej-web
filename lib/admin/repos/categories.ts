import "server-only";
import { getDb } from "../db";
import type { Category } from "../types";

export function listCategories(): Category[] {
  return getDb()
    .prepare("SELECT * FROM categories ORDER BY parent_id IS NULL DESC, parent_id ASC, sort_order ASC, name ASC")
    .all() as Category[];
}

export function createCategory(input: Omit<Category, "id">): number {
  const r = getDb()
    .prepare(
      `INSERT INTO categories (parent_id, name, slug, gender, kind, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(input.parent_id, input.name, input.slug, input.gender, input.kind, input.sort_order);
  return Number(r.lastInsertRowid);
}

export function updateCategory(id: number, patch: Partial<Category>): void {
  const cols = ["parent_id","name","slug","gender","kind","sort_order"];
  const set = cols.filter((c) => c in patch).map((c) => `${c} = @${c}`);
  if (!set.length) return;
  getDb()
    .prepare(`UPDATE categories SET ${set.join(", ")} WHERE id = @id`)
    .run({ id, ...patch });
}

export function deleteCategory(id: number): void {
  getDb().prepare("DELETE FROM categories WHERE id = ?").run(id);
}
