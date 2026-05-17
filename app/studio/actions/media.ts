"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "../../../lib/admin/session";
import { deleteAsset, setAlt } from "../../../lib/admin/repos/media-assets";
import { logAudit } from "../../../lib/admin/repos/audit";

export async function deleteAssetAction(fd: FormData): Promise<void> {
  const me = await requireUser("/studio/login");
  const id = Number(fd.get("id") ?? 0);
  if (!id) return;
  deleteAsset(id);
  logAudit({ user_id: me.id, action: "delete_asset", entity: "media", entity_id: String(id) });
  revalidatePath("/studio/media");
}

export async function setAssetAltAction(fd: FormData): Promise<void> {
  const me = await requireUser("/studio/login");
  const id = Number(fd.get("id") ?? 0);
  const alt = String(fd.get("alt") ?? "").slice(0, 300);
  if (!id) return;
  setAlt(id, alt);
  logAudit({ user_id: me.id, action: "set_asset_alt", entity: "media", entity_id: String(id) });
  revalidatePath("/studio/media");
}
