"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "../../../lib/admin/session";
import { createCategory, updateCategory, deleteCategory } from "../../../lib/admin/repos/categories";
import { logAudit } from "../../../lib/admin/repos/audit";

const UpdateCategorySchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().min(1).max(80),
  slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/),
  sort_order: z.coerce.number().int().min(0).max(999).default(0),
});

const CategorySchema = z.object({
  parent_id: z.union([z.literal(""), z.coerce.number().int()]).optional(),
  name: z.string().min(1).max(80),
  slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/),
  gender: z.string().max(20).optional(),
  kind: z.string().max(20).optional(),
  sort_order: z.coerce.number().int().min(0).max(999).optional().default(0),
});

export async function createCategoryAction(fd: FormData): Promise<void> {
  const me = await requireUser();
  const parsed = CategorySchema.safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return;
  const v = parsed.data;
  const id = createCategory({
    parent_id: v.parent_id === "" || v.parent_id === undefined ? null : Number(v.parent_id),
    name: v.name,
    slug: v.slug,
    gender: v.gender || null,
    kind: v.kind || null,
    sort_order: v.sort_order ?? 0,
  });
  logAudit({ user_id: me.id, action: "create_category", entity: "category", entity_id: String(id) });
  revalidatePath("/admin/categories");
}

export async function updateCategoryAction(fd: FormData): Promise<void> {
  const me = await requireUser();
  const parsed = UpdateCategorySchema.safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return;
  const { id, name, slug, sort_order } = parsed.data;
  updateCategory(id, { name, slug, sort_order });
  logAudit({ user_id: me.id, action: "update_category", entity: "category", entity_id: String(id) });
  revalidatePath("/admin/categories");
}

export async function deleteCategoryAction(fd: FormData): Promise<void> {
  const me = await requireUser();
  const id = Number(fd.get("id") ?? 0);
  if (!id) return;
  deleteCategory(id);
  logAudit({ user_id: me.id, action: "delete_category", entity: "category", entity_id: String(id) });
  revalidatePath("/admin/categories");
}
