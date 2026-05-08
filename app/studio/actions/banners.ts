"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "../../../lib/admin/session";
import {
  createBanner, deleteBanner, reorderBanners, updateBanner,
} from "../../../lib/admin/repos/banners";
import { logAudit } from "../../../lib/admin/repos/audit";

const BannerSchema = z.object({
  title: z.string().max(200).default(""),
  subtitle: z.string().max(400).default(""),
  button_text: z.string().max(40).default(""),
  button_href: z.string().max(400).default(""),
  image_path: z.string().max(400).default(""),
  mobile_image_path: z.string().max(400).default(""),
  text_align: z.enum(["left", "center", "right"]),
  text_color: z.enum(["light", "dark"]),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
  status: z.enum(["draft", "scheduled", "published"]),
  enabled: z.union([z.literal("on"), z.literal("")]).optional(),
});

export type BannerSaveState = { error?: string };

export async function saveBannerAction(_prev: BannerSaveState, fd: FormData): Promise<BannerSaveState> {
  const me = await requireUser();
  const id = Number(fd.get("id") ?? 0);
  const parsed = BannerSchema.safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please review the form." };
  const v = parsed.data;
  const enabled = v.enabled === "on" ? 1 : 0;
  const data = {
    title: v.title, subtitle: v.subtitle,
    button_text: v.button_text, button_href: v.button_href,
    image_path: v.image_path, mobile_image_path: v.mobile_image_path || v.image_path,
    text_align: v.text_align, text_color: v.text_color,
    starts_at: v.starts_at || null, ends_at: v.ends_at || null,
    status: v.status, enabled,
  };
  let savedId = id;
  if (id) {
    updateBanner(id, data);
    logAudit({ user_id: me.id, action: "update_banner", entity: "banner", entity_id: String(id) });
  } else {
    savedId = createBanner(data);
    logAudit({ user_id: me.id, action: "create_banner", entity: "banner", entity_id: String(savedId) });
  }
  revalidatePath("/studio/banners");
  revalidatePath("/");
  redirect(`/studio/banners/${savedId}?saved=1`);
}

export async function deleteBannerAction(fd: FormData): Promise<void> {
  const me = await requireUser();
  const id = Number(fd.get("id") ?? 0);
  if (!id) return;
  deleteBanner(id);
  logAudit({ user_id: me.id, action: "delete_banner", entity: "banner", entity_id: String(id) });
  revalidatePath("/studio/banners");
  revalidatePath("/");
  redirect("/studio/banners?flash=Banner%20removed");
}

export async function reorderBannersAction(fd: FormData): Promise<void> {
  await requireUser();
  const ordered = String(fd.get("ordered") ?? "").split(",").map((n) => Number(n)).filter(Boolean);
  if (!ordered.length) return;
  reorderBanners(ordered);
  revalidatePath("/studio/banners");
  revalidatePath("/");
}

export async function setBannerEnabledAction(fd: FormData): Promise<void> {
  await requireUser();
  const id = Number(fd.get("id") ?? 0);
  const enabled = String(fd.get("enabled") ?? "0") === "1" ? 1 : 0;
  if (!id) return;
  updateBanner(id, { enabled });
  revalidatePath("/studio/banners");
  revalidatePath("/");
}
