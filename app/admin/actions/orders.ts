"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "../../../lib/admin/session";
import { setOrderStatus, setOrderNotes } from "../../../lib/admin/repos/orders";
import { logAudit } from "../../../lib/admin/repos/audit";

const StatusSchema = z.enum(["new","confirmed","in_atelier","shipped","fulfilled","cancelled"]);

const STATUS_LABEL: Record<z.infer<typeof StatusSchema>, string> = {
  new: "New", confirmed: "Confirmed", in_atelier: "In atelier",
  shipped: "Shipped", fulfilled: "Fulfilled", cancelled: "Cancelled",
};

export async function setOrderStatusAction(fd: FormData): Promise<void> {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  const status = StatusSchema.parse(String(fd.get("status") ?? "new"));
  if (!id) return;
  await setOrderStatus(id, status);
  await logAudit({ user_id: me.id, action: "set_order_status", entity: "order", entity_id: id, payload: { status } });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  redirect(`/admin/orders/${id}?flash=${encodeURIComponent(`Order ${id} → ${STATUS_LABEL[status]}`)}`);
}

export async function saveOrderNotesAction(fd: FormData): Promise<void> {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  const notes = String(fd.get("notes") ?? "");
  if (!id) return;
  await setOrderNotes(id, notes);
  await logAudit({ user_id: me.id, action: "save_order_notes", entity: "order", entity_id: id });
  revalidatePath(`/admin/orders/${id}`);
  redirect(`/admin/orders/${id}?flash=${encodeURIComponent("Notes saved")}`);
}
