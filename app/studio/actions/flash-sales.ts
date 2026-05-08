"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "../../../lib/admin/session";
import { createFlashSale, deleteFlashSale, updateFlashSale } from "../../../lib/admin/repos/flash-sales";
import { logAudit } from "../../../lib/admin/repos/audit";

const Schema = z.object({
  title: z.string().min(2).max(160),
  subtitle: z.string().max(300).default(""),
  promo_code: z.string().max(40).optional(),
  banner_image: z.string().max(400).default(""),
  starts_at: z.string().optional(),
  ends_at: z.string().min(1, "Pick an end time"),
  enabled: z.union([z.literal("on"), z.literal("")]).optional(),
});

export type FlashState = { error?: string };

export async function saveFlashSaleAction(_prev: FlashState, fd: FormData): Promise<FlashState> {
  const me = await requireUser();
  const id = Number(fd.get("id") ?? 0);
  const parsed = Schema.safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please review the form." };
  const v = parsed.data;
  const data = {
    title: v.title, subtitle: v.subtitle,
    promo_code: v.promo_code || null, banner_image: v.banner_image,
    starts_at: v.starts_at || null, ends_at: v.ends_at,
    enabled: v.enabled === "on" ? 1 : 0,
  };
  let savedId = id;
  if (id) {
    updateFlashSale(id, data);
    logAudit({ user_id: me.id, action: "update_flash_sale", entity: "flash_sale", entity_id: String(id) });
  } else {
    savedId = createFlashSale(data);
    logAudit({ user_id: me.id, action: "create_flash_sale", entity: "flash_sale", entity_id: String(savedId) });
  }
  revalidatePath("/studio/flash-sales");
  revalidatePath("/");
  redirect(`/studio/flash-sales/${savedId}?saved=1`);
}

export async function deleteFlashSaleAction(fd: FormData): Promise<void> {
  const me = await requireUser();
  const id = Number(fd.get("id") ?? 0);
  if (!id) return;
  deleteFlashSale(id);
  logAudit({ user_id: me.id, action: "delete_flash_sale", entity: "flash_sale", entity_id: String(id) });
  revalidatePath("/studio/flash-sales");
  redirect("/studio/flash-sales?flash=Flash%20sale%20removed");
}
