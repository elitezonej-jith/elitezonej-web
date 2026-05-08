"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "../../../lib/admin/session";
import { upsertPromotion, deletePromotion, setPromotionStatus } from "../../../lib/admin/repos/promotions";
import { logAudit } from "../../../lib/admin/repos/audit";

const PromoSchema = z.object({
  code: z.string().min(2).max(40).regex(/^[A-Z0-9_-]+$/i, "letters, digits, dash/underscore only"),
  type: z.enum(["percent","flat","free_ship"]),
  value: z.coerce.number().int().min(0).max(99999),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
  min_total: z.coerce.number().int().min(0).default(0),
  usage_limit: z.union([z.literal(""), z.coerce.number().int().min(0)]).optional(),
  status: z.enum(["active","scheduled","expired","disabled"]),
  description: z.string().max(240).optional(),
});

export type PromoState = { error?: string };

export async function savePromoAction(_prev: PromoState, fd: FormData): Promise<PromoState> {
  const me = await requireUser();
  const parsed = PromoSchema.safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const v = parsed.data;
  upsertPromotion({
    code: v.code.toUpperCase(),
    type: v.type,
    value: v.value,
    starts_at: v.starts_at || null,
    ends_at: v.ends_at || null,
    min_total: v.min_total,
    usage_limit: v.usage_limit === "" || v.usage_limit === undefined ? null : Number(v.usage_limit),
    status: v.status,
    description: v.description ?? null,
  });
  logAudit({ user_id: me.id, action: "save_promo", entity: "promotion", entity_id: v.code });
  revalidatePath("/admin/promotions");
  redirect(`/admin/promotions/${v.code.toUpperCase()}?saved=1`);
}

export async function setPromoStatusAction(fd: FormData): Promise<void> {
  const me = await requireUser();
  const code = String(fd.get("code") ?? "").toUpperCase();
  const status = String(fd.get("status") ?? "active") as "active" | "scheduled" | "expired" | "disabled";
  if (!code) return;
  setPromotionStatus(code, status);
  logAudit({ user_id: me.id, action: "set_promo_status", entity: "promotion", entity_id: code, payload: { status } });
  revalidatePath("/admin/promotions");
  revalidatePath(`/admin/promotions/${code}`);
}

export async function deletePromoAction(fd: FormData): Promise<void> {
  const me = await requireUser();
  const code = String(fd.get("code") ?? "").toUpperCase();
  if (!code) return;
  deletePromotion(code);
  logAudit({ user_id: me.id, action: "delete_promo", entity: "promotion", entity_id: code });
  revalidatePath("/admin/promotions");
  redirect("/admin/promotions");
}
