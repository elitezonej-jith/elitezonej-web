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

// ── Deep delete with full cleanup ────────────────────────────────────────

export type BlastRadius = {
  descendantCount: number;
  descendantNames: string[];
  productCount: number;
  filterCount: number;
  offerTargetCount: number;
  hasChildren: boolean;
  parentId: number | null;
  parentName: string | null;
};

/**
 * Compute what would be affected if a category (and its subtree) were deleted.
 * Used to populate the confirmation dialog before the operator commits.
 */
export async function getCategoryBlastRadius(id: number): Promise<BlastRadius> {
  // The category itself
  const cat = await sql.get<{ parent_id: number | null }>(
    "SELECT parent_id FROM categories WHERE id = ?", [id],
  );
  if (!cat) {
    return { descendantCount: 0, descendantNames: [], productCount: 0, filterCount: 0, offerTargetCount: 0, hasChildren: false, parentId: null, parentName: null };
  }

  // Parent info (for reparent option label)
  let parentName: string | null = null;
  if (cat.parent_id) {
    const p = await sql.get<{ name: string }>("SELECT name FROM categories WHERE id = ?", [cat.parent_id]);
    parentName = p?.name ?? null;
  }

  // All descendants
  const descendantIds = await getDescendantIds(id);
  const allIds = [id, ...descendantIds];

  // Descendant names (for display — cap at 10)
  let descendantNames: string[] = [];
  if (descendantIds.length > 0) {
    const placeholders = descendantIds.map(() => "?").join(",");
    const nameRows = await sql.all<{ name: string }>(
      `SELECT name FROM categories WHERE id IN (${placeholders}) ORDER BY name ASC`,
      descendantIds,
    );
    descendantNames = nameRows.map((r) => r.name);
  }

  // Slugs for product/offer matching
  const allPlaceholders = allIds.map(() => "?").join(",");
  const slugRows = await sql.all<{ slug: string }>(
    `SELECT slug FROM categories WHERE id IN (${allPlaceholders})`,
    allIds,
  );
  const slugs = slugRows.map((r) => r.slug);

  // Product count (products matching any of these slugs in category or sub)
  let productCount = 0;
  if (slugs.length > 0) {
    const slugPlaceholders = slugs.map(() => "?").join(",");
    const pc = await sql.get<{ n: number }>(
      `SELECT COUNT(*) as n FROM products WHERE category IN (${slugPlaceholders}) OR sub IN (${slugPlaceholders})`,
      [...slugs, ...slugs],
    );
    productCount = Number(pc?.n ?? 0);
  }

  // Filter count
  const fc = await sql.get<{ n: number }>(
    `SELECT COUNT(*) as n FROM category_filters WHERE category_id IN (${allPlaceholders})`,
    allIds,
  );
  const filterCount = Number(fc?.n ?? 0);

  // Offer target count
  let offerTargetCount = 0;
  if (slugs.length > 0) {
    const slugPlaceholders = slugs.map(() => "?").join(",");
    const oc = await sql.get<{ n: number }>(
      `SELECT COUNT(*) as n FROM offer_targets WHERE target_type = 'category' AND target_id IN (${slugPlaceholders})`,
      slugs,
    );
    offerTargetCount = Number(oc?.n ?? 0);
  }

  // Direct children check
  const hasChildren = descendantIds.length > 0;

  return {
    descendantCount: descendantIds.length,
    descendantNames,
    productCount,
    filterCount,
    offerTargetCount,
    hasChildren,
    parentId: cat.parent_id,
    parentName,
  };
}

export type DeleteMode = "delete_all" | "reparent_children";

export type DeleteResult = {
  removedCategories: number;
  affectedProducts: number;
  removedOfferTargets: number;
};

/**
 * Delete a category with full cleanup:
 * - "delete_all": remove the entire subtree, unlink products, remove offer targets
 * - "reparent_children": move direct children to this category's parent, then delete only this node
 */
export async function deleteCategoryDeep(
  id: number,
  mode: DeleteMode,
): Promise<DeleteResult> {
  return sql.tx(async (t) => {
    // 1. Get the category being deleted
    const cat = await t.get<{ id: number; parent_id: number | null; slug: string }>(
      "SELECT id, parent_id, slug FROM categories WHERE id = ?", [id],
    );
    if (!cat) return { removedCategories: 0, affectedProducts: 0, removedOfferTargets: 0 };

    // 2. Determine which IDs/slugs will be removed
    let removedIds: number[];
    let removedSlugs: string[];

    if (mode === "reparent_children") {
      // Move direct children to this category's parent before deleting
      await t.run(
        "UPDATE categories SET parent_id = ? WHERE parent_id = ?",
        [cat.parent_id, id],
      );
      // Only this single node is being removed
      removedIds = [id];
      removedSlugs = [cat.slug];
    } else {
      // delete_all: get the full subtree
      // BFS within the transaction to ensure consistency
      const queue = [id];
      removedIds = [];
      while (queue.length) {
        const pid = queue.shift()!;
        removedIds.push(pid);
        const children = await t.all<{ id: number }>(
          "SELECT id FROM categories WHERE parent_id = ?", [pid],
        );
        for (const c of children) queue.push(c.id);
      }
      // Get all slugs
      const placeholders = removedIds.map(() => "?").join(",");
      const slugRows = await t.all<{ slug: string }>(
        `SELECT slug FROM categories WHERE id IN (${placeholders})`, removedIds,
      );
      removedSlugs = slugRows.map((r) => r.slug);
    }

    // 3. Unlink products (clear category/sub/cat for matching slugs)
    let affectedProducts = 0;
    if (removedSlugs.length > 0) {
      const slugPlaceholders = removedSlugs.map(() => "?").join(",");
      const r = await t.run(
        `UPDATE products SET category = '', sub = '', cat = '' WHERE category IN (${slugPlaceholders}) OR sub IN (${slugPlaceholders})`,
        [...removedSlugs, ...removedSlugs],
      );
      affectedProducts = r.count;
    }

    // 4. Remove dead offer targets
    let removedOfferTargets = 0;
    if (removedSlugs.length > 0) {
      const slugPlaceholders = removedSlugs.map(() => "?").join(",");
      const r = await t.run(
        `DELETE FROM offer_targets WHERE target_type = 'category' AND target_id IN (${slugPlaceholders})`,
        removedSlugs,
      );
      removedOfferTargets = r.count;
    }

    // 5. Delete the category (CASCADE handles children + filters + filter_options)
    await t.run("DELETE FROM categories WHERE id = ?", [id]);

    return {
      removedCategories: removedIds.length,
      affectedProducts,
      removedOfferTargets,
    };
  });
}
