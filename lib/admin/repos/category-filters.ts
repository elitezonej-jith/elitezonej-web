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

/**
 * Bubble-down aggregation: collects filters from the given category AND all its
 * descendants (children, grandchildren, etc). Filters are merged by field_key —
 * if "Suits" and "Pants" both define a "fit" filter, their options are unioned
 * into a single "Fit" group. This is the storefront-facing read: a parent
 * collection page shows ALL filters that any product within its subtree might
 * use. Deduplication is case-insensitive on option value.
 */
export async function getAggregatedFilters(categoryId: number): Promise<CategoryFilter[]> {
  // 1. Collect all category IDs in the subtree (self + descendants)
  const allIds = [categoryId];
  const queue = [categoryId];
  while (queue.length) {
    const pid = queue.shift()!;
    const children = await sql.all<{ id: number }>(
      "SELECT id FROM categories WHERE parent_id = ?",
      [pid],
    );
    for (const c of children) {
      allIds.push(c.id);
      queue.push(c.id);
    }
  }

  // 2. Fetch all filters for the entire subtree in one query
  if (!allIds.length) return [];
  const placeholders = allIds.map(() => "?").join(",");
  const rawFilters = await sql.all<Omit<CategoryFilter, "options">>(
    `SELECT * FROM category_filters WHERE category_id IN (${placeholders}) ORDER BY sort_order ASC, id ASC`,
    allIds,
  );
  if (!rawFilters.length) return [];

  // 3. Fetch all options for these filters
  const filterIds = rawFilters.map((f) => f.id);
  const rawOptions = await sql.all<FilterOption>(
    `SELECT * FROM filter_options WHERE filter_id IN (${filterIds.map(() => "?").join(",")}) ORDER BY sort_order ASC, id ASC`,
    filterIds,
  );

  // 4. Merge by field_key — same field_key from different categories becomes one filter
  const merged = new Map<string, {
    name: string;
    field_key: string;
    filter_type: string;
    sort_order: number;
    options: Map<string, { value: string; label: string | null; color_hex: string | null; sort_order: number }>;
  }>();

  for (const f of rawFilters) {
    const key = f.field_key;
    const fOptions = rawOptions.filter((o) => o.filter_id === f.id);

    if (!merged.has(key)) {
      merged.set(key, {
        name: f.name,
        field_key: f.field_key,
        filter_type: f.filter_type,
        sort_order: f.sort_order,
        options: new Map(),
      });
    }

    const group = merged.get(key)!;
    // Use the lowest sort_order among filters sharing the same field_key
    if (f.sort_order < group.sort_order) {
      group.sort_order = f.sort_order;
      group.name = f.name; // prefer the name from the topmost (lowest sort_order) filter
    }

    // Union options, dedup by lowercase value
    for (const opt of fOptions) {
      const optKey = opt.value.toLowerCase();
      if (!group.options.has(optKey)) {
        group.options.set(optKey, {
          value: opt.value,
          label: opt.label,
          color_hex: opt.color_hex,
          sort_order: opt.sort_order,
        });
      }
    }
  }

  // 5. Convert map back to array shape, sorted by sort_order
  const result: CategoryFilter[] = [];
  const sortedGroups = [...merged.values()].sort((a, b) => a.sort_order - b.sort_order);
  let syntheticId = -1; // synthetic IDs since we're merging across categories

  for (const group of sortedGroups) {
    const sortedOptions = [...group.options.values()].sort((a, b) => a.sort_order - b.sort_order);
    result.push({
      id: syntheticId--,
      category_id: categoryId,
      name: group.name,
      field_key: group.field_key,
      filter_type: group.filter_type,
      sort_order: group.sort_order,
      options: sortedOptions.map((o, i) => ({
        id: -(i + 1), // synthetic
        filter_id: 0,
        value: o.value,
        label: o.label,
        color_hex: o.color_hex,
        sort_order: o.sort_order,
      })),
    });
  }

  return result;
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
