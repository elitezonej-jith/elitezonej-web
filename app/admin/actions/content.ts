"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "../../../lib/admin/session";
import { updateHomeSection } from "../../../lib/admin/repos/content";
import { logAudit } from "../../../lib/admin/repos/audit";

export async function saveHomeSectionAction(fd: FormData): Promise<void> {
  const me = await requireUser();
  const key = String(fd.get("key") ?? "");
  if (!key) return;
  const patch = {
    title: String(fd.get("title") ?? ""),
    kicker: String(fd.get("kicker") ?? ""),
    body: String(fd.get("body") ?? ""),
    image_path: String(fd.get("image_path") ?? ""),
    link_text: String(fd.get("link_text") ?? ""),
    link_href: String(fd.get("link_href") ?? ""),
    enabled: fd.get("enabled") ? 1 : 0,
  };
  updateHomeSection(key, patch);
  logAudit({ user_id: me.id, action: "update_home_section", entity: "home_section", entity_id: key });
  revalidatePath("/admin/content");
}
