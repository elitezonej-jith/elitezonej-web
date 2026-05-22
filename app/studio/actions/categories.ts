"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "../../../lib/admin/session";
import { sql } from "../../../lib/admin/db";
import { createCategory, updateCategory, deleteCategory } from "../../../lib/admin/repos/categories";
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
  const data = {
    parent_id: v.parent_id === "" || v.parent_id === undefined ? null : Number(v.parent_id),
    name: v.name, slug: v.slug,
    gender: v.gender || null, kind: v.kind || null,
    sort_order: v.sort_order ?? 0,
  };
  const enabled = v.enabled === "on" ? 1 : 0;
  let savedId = id;
  if (id) {
    await updateCategory(id, data);
    await sql.run("UPDATE categories SET image_path = ?, enabled = ? WHERE id = ?", [v.image_path, enabled, id]);
    await logAudit({ user_id: me.id, action: "update_category", entity: "category", entity_id: String(id) });
  } else {
    savedId = await createCategory(data);
    await sql.run("UPDATE categories SET image_path = ?, enabled = ? WHERE id = ?", [v.image_path, enabled, savedId]);
    await logAudit({ user_id: me.id, action: "create_category", entity: "category", entity_id: String(savedId) });
  }
  revalidatePath("/studio/categories");
  revalidatePath("/");
  redirect(`/studio/categories?flash=${encodeURIComponent(id ? "Category saved" : "Category created")}`);
}

export async function deleteCategoryAction(fd: FormData): Promise<void> {
  const me = await requireUser("/studio/login");
  const id = Number(fd.get("id") ?? 0);
  if (!id) return;
  await deleteCategory(id);
  await logAudit({ user_id: me.id, action: "delete_category", entity: "category", entity_id: String(id) });
  revalidatePath("/studio/categories");
  redirect("/studio/categories?flash=Category%20removed");
}
