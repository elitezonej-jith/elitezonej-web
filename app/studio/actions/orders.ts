"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "../../../lib/admin/session";
import { setOrderStatus, getOrderItems } from "../../../lib/admin/repos/orders";
import { logAudit } from "../../../lib/admin/repos/audit";
import { sql } from "../../../lib/admin/db";

const StatusSchema = z.enum(["new", "confirmed", "in_atelier", "shipped", "fulfilled", "cancelled"]);

const STATUS_LABEL: Record<z.infer<typeof StatusSchema>, string> = {
  new: "New", confirmed: "Confirmed", in_atelier: "In atelier",
  shipped: "Shipped", fulfilled: "Fulfilled", cancelled: "Cancelled",
};

async function deductStock(orderId: string): Promise<string | null> {
  const items = await getOrderItems(orderId);
  // Aggregate qty per (slug, size)
  const agg: Record<string, number> = {};
  for (const it of items) {
    const key = `${it.product_slug}::${it.size || "_"}`;
    agg[key] = (agg[key] || 0) + it.qty;
  }
  // Check + deduct in transaction
  return sql.tx(async (t) => {
    for (const [key, qty] of Object.entries(agg)) {
      const [slug, size] = key.split("::");
      if (!size || size === "_") continue;
      const row = await t.get<{ stock: number }>(
        "SELECT stock FROM inventory WHERE product_slug = ? AND size = ?",
        [slug, size],
      );
      if (!row) continue; // Not tracked — skip
      if (row.stock < qty) {
        return `Insufficient stock for "${slug}" size ${size} (need ${qty}, have ${row.stock})`;
      }
    }
    // All checks passed — deduct
    for (const [key, qty] of Object.entries(agg)) {
      const [slug, size] = key.split("::");
      if (!size || size === "_") continue;
      await t.run(
        "UPDATE inventory SET stock = stock - ?, oos_flag = CASE WHEN stock - ? <= 0 THEN 1 ELSE 0 END WHERE product_slug = ? AND size = ?",
        [qty, qty, slug, size],
      );
    }
    return null;
  });
}

async function restoreStock(orderId: string): Promise<void> {
  const items = await getOrderItems(orderId);
  await sql.tx(async (t) => {
    for (const it of items) {
      if (!it.size) continue;
      await t.run(
        "UPDATE inventory SET stock = stock + ?, oos_flag = 0 WHERE product_slug = ? AND size = ?",
        [it.qty, it.product_slug, it.size],
      );
    }
  });
}

export async function setOrderStatusStudioAction(fd: FormData): Promise<void> {
  const me = await requireUser("/studio/login");
  const id = String(fd.get("id") ?? "");
  const newStatus = StatusSchema.parse(String(fd.get("status") ?? "new"));
  if (!id) return;

  // Get current status
  const order = await sql.get<{ status: string }>("SELECT status FROM orders WHERE id = ?", [id]);
  if (!order) return;
  const oldStatus = order.status;

  // Auto-deduct on confirm
  if (newStatus === "confirmed" && oldStatus === "new") {
    const err = await deductStock(id);
    if (err) {
      // Can't confirm — redirect with error
      redirect(`/studio/orders/${id}?flash=${encodeURIComponent(err)}`);
    }
  }

  // Restore on cancel (only if stock was previously deducted = was confirmed or later)
  if (newStatus === "cancelled" && oldStatus !== "new") {
    await restoreStock(id);
  }

  await setOrderStatus(id, newStatus);
  await logAudit({ user_id: me.id, action: "set_order_status", entity: "order", entity_id: id, payload: { status: newStatus } });
  revalidatePath("/studio/orders");
  revalidatePath(`/studio/orders/${id}`);
  revalidatePath("/studio/inventory");
  redirect(`/studio/orders/${id}?flash=${encodeURIComponent(`Order → ${STATUS_LABEL[newStatus]}`)}`);
}
