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

export async function getAncestorChain(categoryId: number): Promise<number[]> {
  const ancestors: number[] = [];
  let currentId: number | null = categoryId;
  while (currentId !== null) {
    const row: { parent_id: number | null } | null = await sql.get<{ parent_id: number | null }>(
      "SELECT parent_id FROM categories WHERE id = ?",
      [currentId],
    );
    if (!row || row.parent_id === null) break;
    ancestors.push(row.parent_id);
    currentId = row.parent_id;
  }
  return ancestors;
}

export async function getDescendantIds(categoryId: number): Promise<number[]> {
  const ids: number[] = [];
  const queue = [categoryId];
  while (queue.length) {
    const pid = queue.shift()!;
    const children = await sql.all<{ id: number }>(
      "SELECT id FROM categories WHERE parent_id = ?",
      [pid],
    );
    for (const c of children) {
      ids.push(c.id);
      queue.push(c.id);
    }
  }
  return ids;
}

export async function getMaxDepth(categoryId: number): Promise<number> {
  let max = 0;
  const queue: Array<{ id: number; depth: number }> = [{ id: categoryId, depth: 0 }];
  while (queue.length > 0) {
    const item = queue.shift()!;
    if (item.depth > max) max = item.depth;
    const children = await sql.all<{ id: number }>(
      "SELECT id FROM categories WHERE parent_id = ?",
      [item.id],
    );
    for (const c of children) queue.push({ id: c.id, depth: item.depth + 1 });
  }
  return max;
}

export async function renameCategory(
  id: number, oldName: string, newName: string, gender: string | null,
): Promise<void> {
  await sql.tx(async (t) => {
    await t.run("UPDATE categories SET name = ? WHERE id = ?", [newName, id]);
    if (gender) {
      await t.run(
        "UPDATE products SET category = ? WHERE LOWER(TRIM(category)) = LOWER(TRIM(?)) AND LOWER(TRIM(gender)) = LOWER(TRIM(?))",
        [newName, oldName, gender],
      );
    } else {
      await t.run(
        "UPDATE products SET category = ? WHERE LOWER(TRIM(category)) = LOWER(TRIM(?))",
        [newName, oldName],
      );
    }
  });
}
