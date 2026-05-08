"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "../../../lib/admin/session";
import { setOrderStatus, setOrderNotes } from "../../../lib/admin/repos/orders";
import { logAudit } from "../../../lib/admin/repos/audit";

const StatusSchema = z.enum(["new","confirmed","in_atelier","shipped","fulfilled","cancelled"]);

export async function setOrderStatusAction(fd: FormData): Promise<void> {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  const status = StatusSchema.parse(String(fd.get("status") ?? "new"));
  if (!id) return;
  setOrderStatus(id, status);
  logAudit({ user_id: me.id, action: "set_order_status", entity: "order", entity_id: id, payload: { status } });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

export async function saveOrderNotesAction(fd: FormData): Promise<void> {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  const notes = String(fd.get("notes") ?? "");
  if (!id) return;
  setOrderNotes(id, notes);
  logAudit({ user_id: me.id, action: "save_order_notes", entity: "order", entity_id: id });
  revalidatePath(`/admin/orders/${id}`);
}
