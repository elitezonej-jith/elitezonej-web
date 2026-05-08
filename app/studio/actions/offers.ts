"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "../../../lib/admin/session";
import { upsertPromotion, deletePromotion } from "../../../lib/admin/repos/promotions";
import { setTargets } from "../../../lib/admin/repos/offer-targets";
import { getDb } from "../../../lib/admin/db";
import { logAudit } from "../../../lib/admin/repos/audit";

const Schema = z.object({
  code: z.string().min(2).max(40).regex(/^[A-Z0-9_-]+$/i),
  type: z.enum(["percent","flat","free_ship"]),
  value: z.coerce.number().int().min(0),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
  min_total: z.coerce.number().int().min(0).default(0),
  usage_limit: z.union([z.literal(""), z.coerce.number().int().min(0)]).optional(),
  status: z.enum(["active","scheduled","expired","disabled"]),
  description: z.string().max(240).optional(),
  is_featured: z.union([z.literal("on"), z.literal("")]).optional(),
});

export type OfferSaveState = { error?: string };

export async function saveOfferAction(_prev: OfferSaveState, fd: FormData): Promise<OfferSaveState> {
  const me = await requireUser();
  const parsed = Schema.safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please review the form." };
  const v = parsed.data;
  const code = v.code.toUpperCase();
  upsertPromotion({
    code,
    type: v.type, value: v.value,
    starts_at: v.starts_at || null, ends_at: v.ends_at || null,
    min_total: v.min_total,
    usage_limit: v.usage_limit === "" || v.usage_limit === undefined ? null : Number(v.usage_limit),
    status: v.status,
    description: v.description ?? null,
  });
  // is_featured column on promotions is added in schema-v2
  getDb().prepare("UPDATE promotions SET is_featured = ? WHERE code = ?")
    .run(v.is_featured === "on" ? 1 : 0, code);

  // Targets — collected from form arrays
  const types = fd.getAll("target_type").map(String);
  const ids = fd.getAll("target_id").map(String);
  const targets = types.map((t, i) => ({
    target_type: t as "all" | "category" | "product",
    target_id: ids[i] ?? "",
  })).filter((t) => t.target_type === "all" || t.target_id);
  setTargets(code, targets);

  logAudit({ user_id: me.id, action: "save_offer", entity: "promotion", entity_id: code });
  revalidatePath("/studio/offers");
  revalidatePath("/");
  redirect(`/studio/offers/${code}?saved=1`);
}

export async function deleteOfferAction(fd: FormData): Promise<void> {
  const me = await requireUser();
  const code = String(fd.get("code") ?? "").toUpperCase();
  if (!code) return;
  deletePromotion(code);
  logAudit({ user_id: me.id, action: "delete_offer", entity: "promotion", entity_id: code });
  revalidatePath("/studio/offers");
  redirect("/studio/offers?flash=Offer%20removed");
}
