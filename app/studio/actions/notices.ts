"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "../../../lib/admin/session";
import { createNotice, updateNotice, deleteNotice } from "../../../lib/admin/repos/notices";
import { logAudit } from "../../../lib/admin/repos/audit";

const Schema = z.object({
  type: z.enum(["scroll", "popup", "festive"]),
  body: z.string().min(2).max(2000),
  link_href: z.string().max(400).default(""),
  link_text: z.string().max(60).default(""),
  color_bg: z.string().max(20).default(""),
  color_fg: z.string().max(20).default(""),
  priority: z.coerce.number().int().min(0).max(999).default(0),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
  dismissable: z.union([z.literal("on"), z.literal("")]).optional(),
  enabled: z.union([z.literal("on"), z.literal("")]).optional(),
  target_paths: z.string().max(400).default("*"),
});

export type NoticeSaveState = { error?: string };

export async function saveNoticeAction(_prev: NoticeSaveState, fd: FormData): Promise<NoticeSaveState> {
  const me = await requireUser("/studio/login");
  const id = Number(fd.get("id") ?? 0);
  const parsed = Schema.safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please review the form." };
  const v = parsed.data;
  const data = {
    type: v.type, body: v.body,
    link_href: v.link_href, link_text: v.link_text,
    color_bg: v.color_bg, color_fg: v.color_fg,
    priority: v.priority,
    starts_at: v.starts_at || null, ends_at: v.ends_at || null,
    dismissable: v.dismissable === "on" ? 1 : 0,
    enabled: v.enabled === "on" ? 1 : 0,
    target_paths: v.target_paths || "*",
  };
  let savedId = id;
  if (id) {
    await updateNotice(id, data);
    await logAudit({ user_id: me.id, action: "update_notice", entity: "notice", entity_id: String(id) });
  } else {
    savedId = await createNotice(data);
    await logAudit({ user_id: me.id, action: "create_notice", entity: "notice", entity_id: String(savedId) });
  }
  revalidatePath("/studio/notices");
  revalidatePath("/");
  redirect(`/studio/notices/${savedId}?saved=1`);
}

export async function deleteNoticeAction(fd: FormData): Promise<void> {
  const me = await requireUser("/studio/login");
  const id = Number(fd.get("id") ?? 0);
  if (!id) return;
  await deleteNotice(id);
  await logAudit({ user_id: me.id, action: "delete_notice", entity: "notice", entity_id: String(id) });
  revalidatePath("/studio/notices");
  revalidatePath("/");
  redirect("/studio/notices?flash=Notice%20removed");
}

export async function toggleNoticeAction(fd: FormData): Promise<void> {
  const me = await requireUser("/studio/login");
  const id = Number(fd.get("id") ?? 0);
  const enabled = String(fd.get("enabled") ?? "0") === "1" ? 1 : 0;
  if (!id) return;
  await updateNotice(id, { enabled });
  await logAudit({ user_id: me.id, action: "toggle_notice", entity: "notice", entity_id: String(id), payload: { enabled } });
  revalidatePath("/studio/notices");
  revalidatePath("/");
}
