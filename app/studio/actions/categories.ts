"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { bustCategories } from "../../../lib/storefront/cache";
import { z } from "zod";
import { requireUser } from "../../../lib/admin/session";
import { sql } from "../../../lib/admin/db";
import { createCategory, updateCategory, getAncestorChain, getMaxDepth, renameCategory } from "../../../lib/admin/repos/categories";
import { upsertFilter, deleteFilter, upsertOption, deleteOption } from "../../../lib/admin/repos/category-filters";
import { logAudit } from "../../../lib/admin/repos/audit";

const Schema = z.object({
  parent_id: z.union([z.literal(""), z.coerce.number().int()]).optional(),
  name: z.string().min(1).max(80),
  slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/),
  gender: z.string().max(20).optional(),
  kind: z.string().max(20).optional(),
  sort_order: z.coerce.number().int().min(0).max(999).default(0),
  image_path: z.string().max(400).default(""),
  enabled: z.union([z.literal("on"), z.literal("")]).optional(),
});

export type CatSaveState = { error?: string };

export async function saveCategoryAction(_prev: CatSaveState, fd: FormData): Promise<CatSaveState> {
  const me = await requireUser("/studio/login");
  const id = Number(fd.get("id") ?? 0);
  const parsed = Schema.safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please review the form." };
  const v = parsed.data;
  const parentId = v.parent_id === "" || v.parent_id === undefined ? null : Number(v.parent_id);

  // Circular parent check
  if (id && parentId !== null) {
    const ancestors = await getAncestorChain(parentId);
    if (parentId === id || ancestors.includes(id)) {
      return { error: "Cannot set a descendant or self as parent (circular reference)." };
    }
  }

  // Depth check (max 3 levels)
  if (parentId !== null) {
    const parentAncestors = await getAncestorChain(parentId);
    const parentDepth = parentAncestors.length + 1;
    if (id) {
      const maxChild = await getMaxDepth(id);
      if (parentDepth + maxChild > 3) {
        return { error: "Maximum nesting depth is 3 levels." };
      }
    } else {
      if (parentDepth + 1 > 3) {
        return { error: "Maximum nesting depth is 3 levels." };
      }
    }
  }

  // Slug uniqueness among siblings
  const slugConflict = await sql.get<{ id: number }>(
    "SELECT id FROM categories WHERE slug = ? AND parent_id IS NOT DISTINCT FROM ? AND id != ?",
    [v.slug, parentId, id || 0],
  );
  if (slugConflict) return { error: "A category with this URL handle already exists at this level." };

  const data = {
    parent_id: parentId,
    name: v.name, slug: v.slug,
    gender: v.gender || null, kind: v.kind || null,
    sort_order: v.sort_order ?? 0,
  };
  const enabled = v.enabled === "on" ? 1 : 0;

  if (id) {
    // Check if name changed for cascade rename
    const old = await sql.get<{ name: string; gender: string | null }>("SELECT name, gender FROM categories WHERE id = ?", [id]);
    if (old && old.name !== v.name) {
      await renameCategory(id, old.name, v.name, data.gender ?? old.gender);
    } else {
      await updateCategory(id, data);
    }
    // Update fields that renameCategory doesn't touch
    await sql.run(
      "UPDATE categories SET slug = ?, parent_id = ?, gender = ?, kind = ?, sort_order = ?, image_path = ?, enabled = ? WHERE id = ?",
      [v.slug, parentId, data.gender, data.kind, data.sort_order, v.image_path, enabled, id],
    );
    await logAudit({ user_id: me.id, action: "update_category", entity: "category", entity_id: String(id) });
  } else {
    const savedId = await createCategory(data);
    await sql.run("UPDATE categories SET image_path = ?, enabled = ? WHERE id = ?", [v.image_path, enabled, savedId]);
    await logAudit({ user_id: me.id, action: "create_category", entity: "category", entity_id: String(savedId) });
  }
  revalidatePath("/studio/categories");
  revalidatePath("/");
  bustCategories();
  redirect(`/studio/categories?flash=${encodeURIComponent(id ? "Category saved" : "Category created")}`);
}

// --- Filter actions ---

const FilterSchema = z.object({
  category_id: z.coerce.number().int(),
  name: z.string().min(1).max(60),
  field_key: z.string().min(1).max(60),
  filter_type: z.enum(["checkbox", "color", "size", "range"]),
  sort_order: z.coerce.number().int().min(0).default(0),
});

export type FilterSaveState = { error?: string; success?: boolean };

export async function saveFilterAction(_prev: FilterSaveState, fd: FormData): Promise<FilterSaveState> {
  await requireUser("/studio/login");
  const parsed = FilterSchema.safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid filter data." };
  const v = parsed.data;
  await upsertFilter(v.category_id, v.name, v.field_key, v.filter_type, v.sort_order);
  revalidatePath(`/studio/categories`);
  return { success: true };
}

export async function removeFilterAction(fd: FormData): Promise<void> {
  await requireUser("/studio/login");
  const filterId = Number(fd.get("filter_id") ?? 0);
  if (filterId) await deleteFilter(filterId);
  revalidatePath("/studio/categories");
}

const OptionSchema = z.object({
  filter_id: z.coerce.number().int(),
  value: z.string().min(1).max(50),
  label: z.string().max(50).optional(),
  color_hex: z.string().max(9).optional(),
  sort_order: z.coerce.number().int().min(0).default(0),
});

export type OptionSaveState = { error?: string; success?: boolean };

export async function saveOptionAction(_prev: OptionSaveState, fd: FormData): Promise<OptionSaveState> {
  await requireUser("/studio/login");
  const parsed = OptionSchema.safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid option data." };
  const v = parsed.data;
  await upsertOption(v.filter_id, v.value, v.label || null, v.color_hex || null, v.sort_order);
  revalidatePath("/studio/categories");
  return { success: true };
}

export async function removeOptionAction(fd: FormData): Promise<void> {
  await requireUser("/studio/login");
  const optionId = Number(fd.get("option_id") ?? 0);
  if (optionId) await deleteOption(optionId);
  revalidatePath("/studio/categories");
}

export async function deleteCategoryAction(fd: FormData): Promise<void> {
  // Kept but disabled — no delete allowed
  void fd;
}
