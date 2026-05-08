"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "../../../lib/admin/session";
import { setSettings } from "../../../lib/admin/repos/settings";
import { logAudit } from "../../../lib/admin/repos/audit";

export async function saveSettingsAction(fd: FormData): Promise<void> {
  const me = await requireUser();
  const map: Record<string, string> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string" && k !== "_action") map[k] = v;
  }
  setSettings(map);
  logAudit({ user_id: me.id, action: "save_settings", entity: "settings", entity_id: null, payload: { keys: Object.keys(map) } });
  revalidatePath("/admin/settings");
}
