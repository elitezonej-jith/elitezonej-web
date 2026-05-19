"use server";
import { revalidatePath } from "next/cache";
import { requireRole } from "../../../lib/admin/session";
import { setSettings } from "../../../lib/admin/repos/settings";
import { logAudit } from "../../../lib/admin/repos/audit";

const ALLOWED_SETTING_KEYS = new Set([
  "brand_name",
  "brand_tagline",
  "currency",
  "currency_symbol",
  "lead_time_days",
  "contact_email",
  "contact_phone",
  "atelier_address",
  "instagram",
  "low_stock_threshold",
]);

export async function saveSettingsAction(fd: FormData): Promise<void> {
  const me = await requireRole("owner");
  const map: Record<string, string> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string" && ALLOWED_SETTING_KEYS.has(k)) map[k] = v;
  }
  await setSettings(map);
  await logAudit({ user_id: me.id, action: "save_settings", entity: "settings", entity_id: null, payload: { keys: Object.keys(map) } });
  revalidatePath("/admin/settings");
}
