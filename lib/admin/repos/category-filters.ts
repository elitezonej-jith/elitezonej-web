import "server-only";
import { sql } from "../db";

export type CategoryFilter = {
  id: number;
  category_id: number;
  name: string;
  field_key: string;
  filter_type: string;
  sort_order: number;
  options: FilterOption[];
};

export type FilterOption = {
  id: number;
  filter_id: number;
  value: string;
  label: string | null;
  color_hex: string | null;
  sort_order: number;
};

export async function listFiltersForCategory(categoryId: number): Promise<CategoryFilter[]> {
  const filters = await sql.all<Omit<CategoryFilter, "options">>(
    "SELECT * FROM category_filters WHERE category_id = ? ORDER BY sort_order ASC, id ASC",
    [categoryId],
  );
  if (!filters.length) return [];
  const ids = filters.map((f) => f.id);
  const options = await sql.all<FilterOption>(
    `SELECT * FROM filter_options WHERE filter_id IN (${ids.map(() => "?").join(",")}) ORDER BY sort_order ASC, id ASC`,
    ids,
  );
  return filters.map((f) => ({
    ...f,
    options: options.filter((o) => o.filter_id === f.id),
  }));
}

export async function getInheritedFilters(categoryId: number): Promise<CategoryFilter[]> {
  let currentId: number | null = categoryId;
  while (currentId !== null) {
    const filters = await listFiltersForCategory(currentId);
    if (filters.length > 0) return filters;
    const parent: { parent_id: number | null } | null = await sql.get<{ parent_id: number | null }>(
      "SELECT parent_id FROM categories WHERE id = ?",
      [currentId],
    );
    currentId = parent?.parent_id ?? null;
  }
  return [];
}

export async function upsertFilter(
  categoryId: number, name: string, fieldKey: string, filterType: string, sortOrder: number,
): Promise<number> {
  const existing = await sql.get<{ id: number }>(
    "SELECT id FROM category_filters WHERE category_id = ? AND name = ?",
    [categoryId, name],
  );
  if (existing) {
    await sql.run(
      "UPDATE category_filters SET field_key = ?, filter_type = ?, sort_order = ? WHERE id = ?",
      [fieldKey, filterType, sortOrder, existing.id],
    );
    return existing.id;
  }
  const r = await sql.run(
    "INSERT INTO category_filters (category_id, name, field_key, filter_type, sort_order) VALUES (?, ?, ?, ?, ?) RETURNING id",
    [categoryId, name, fieldKey, filterType, sortOrder],
  );
  return Number(r.rows[0].id);
}

export async function deleteFilter(filterId: number): Promise<void> {
  await sql.run("DELETE FROM category_filters WHERE id = ?", [filterId]);
}

export async function upsertOption(
  filterId: number, value: string, label: string | null, colorHex: string | null, sortOrder: number,
): Promise<number> {
  const existing = await sql.get<{ id: number }>(
    "SELECT id FROM filter_options WHERE filter_id = ? AND value = ?",
    [filterId, value],
  );
  if (existing) {
    await sql.run(
      "UPDATE filter_options SET label = ?, color_hex = ?, sort_order = ? WHERE id = ?",
      [label, colorHex, sortOrder, existing.id],
    );
    return existing.id;
  }
  const r = await sql.run(
    "INSERT INTO filter_options (filter_id, value, label, color_hex, sort_order) VALUES (?, ?, ?, ?, ?) RETURNING id",
    [filterId, value, label, colorHex, sortOrder],
  );
  return Number(r.rows[0].id);
}

export async function deleteOption(optionId: number): Promise<void> {
  await sql.run("DELETE FROM filter_options WHERE id = ?", [optionId]);
}
