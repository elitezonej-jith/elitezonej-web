"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "../../../lib/admin/session";
import { setOrderStatus, getOrderItems, shipOrder, markDelivered, setOrderNotes } from "../../../lib/admin/repos/orders";
import { logAudit } from "../../../lib/admin/repos/audit";
import { sql } from "../../../lib/admin/db";
import { bustInventory } from "../../../lib/storefront/cache";

const StatusSchema = z.enum(["new", "confirmed", "in_atelier", "cancelled"]);

const STATUS_LABEL: Record<z.infer<typeof StatusSchema>, string> = {
  new: "New", confirmed: "Confirmed", in_atelier: "In atelier",
  cancelled: "Cancelled",
};

async function deductStock(orderId: string): Promise<string | null> {
  const items = await getOrderItems(orderId);
  // Aggregate qty per (slug, size) — skip fabric items (they use fabric_colours/fabric_meta)
  const agg: Record<string, number> = {};
  for (const it of items) {
    if ((it as Record<string, unknown>).is_fabric) continue;
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
    // All checks passed — deduct (with WHERE guard for safety)
    for (const [key, qty] of Object.entries(agg)) {
      const [slug, size] = key.split("::");
      if (!size || size === "_") continue;
      const r = await t.run(
        "UPDATE inventory SET stock = stock - ?, oos_flag = CASE WHEN stock - ? <= 0 THEN 1 ELSE 0 END WHERE product_slug = ? AND size = ? AND stock >= ?",
        [qty, qty, slug, size, qty],
      );
      if (r.count === 0) {
        return `Insufficient stock for "${slug}" size ${size} (concurrent depletion)`;
      }
    }
    return null;
  });
}

async function restoreStock(orderId: string): Promise<void> {
  const items = await getOrderItems(orderId);
  await sql.tx(async (t) => {
    for (const it of items) {
      if ((it as Record<string, unknown>).is_fabric) {
        // Restore fabric stock
        if (it.colour) {
          await t.run(
            "UPDATE fabric_colours SET stock_meters = stock_meters + ? WHERE product_slug = ? AND name = ?",
            [it.qty, it.product_slug, it.colour],
          );
        }
        await t.run(
          "UPDATE fabric_meta SET stock_meters_total = stock_meters_total + ? WHERE product_slug = ?",
          [it.qty, it.product_slug],
        );
      } else {
        if (!it.size) continue;
        await t.run(
          "UPDATE inventory SET stock = stock + ?, oos_flag = 0 WHERE product_slug = ? AND size = ?",
          [it.qty, it.product_slug, it.size],
        );
      }
    }
  });
  bustInventory();
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

  // Block invalid transitions — shipped/fulfilled orders are terminal for these buttons
  if (oldStatus === "shipped" || oldStatus === "fulfilled") {
    redirect(`/studio/orders/${id}?flash=${encodeURIComponent("Cannot change status of a shipped/delivered order from here")}`);
  }
  // Block regression to "new" once stock has been deducted (confirmed or later)
  if (newStatus === "new" && oldStatus !== "new") {
    redirect(`/studio/orders/${id}?flash=${encodeURIComponent("Cannot revert to New — stock has already been deducted")}`);
  }

  // Deduct stock when transitioning out of "new" (regardless of target)
  if (oldStatus === "new" && newStatus !== "new" && newStatus !== "cancelled") {
    const err = await deductStock(id);
    if (err) {
      redirect(`/studio/orders/${id}?flash=${encodeURIComponent(err)}`);
    }
  }

  // Restore on cancel (only if stock was previously deducted = was confirmed or later)
  if (newStatus === "cancelled" && oldStatus !== "new" && oldStatus !== "cancelled") {
    await restoreStock(id);
  }

  await setOrderStatus(id, newStatus);
  await logAudit({ user_id: me.id, action: "set_order_status", entity: "order", entity_id: id, payload: { status: newStatus } });
  revalidatePath("/studio/orders");
  revalidatePath(`/studio/orders/${id}`);
  revalidatePath("/studio/inventory");
  redirect(`/studio/orders/${id}?flash=${encodeURIComponent(`Order → ${STATUS_LABEL[newStatus]}`)}`);
}

export async function shipOrderStudioAction(fd: FormData): Promise<void> {
  const me = await requireUser("/studio/login");
  const id = String(fd.get("id") ?? "");
  const courier_code = String(fd.get("courier_code") ?? "");
  const tracking_number = String(fd.get("tracking_number") ?? "");
  const tracking_url_override = String(fd.get("tracking_url") ?? "");
  if (!id || !courier_code || !tracking_number.trim()) {
    redirect(`/studio/orders/${id}?flash=${encodeURIComponent("Courier and tracking number are required")}`);
  }
  const result = await shipOrder({ id, courier_code, tracking_number, tracking_url_override });
  if (!result.ok) {
    redirect(`/studio/orders/${id}?flash=${encodeURIComponent(result.error)}`);
  }
  await logAudit({ user_id: me.id, action: "ship_order", entity: "order", entity_id: id, payload: { courier_code, tracking_number } });
  revalidatePath("/studio/orders");
  revalidatePath(`/studio/orders/${id}`);
  revalidatePath(`/account/orders/${id}`);
  redirect(`/studio/orders/${id}?flash=${encodeURIComponent("Order shipped — tracking info saved")}`);
}

export async function markDeliveredStudioAction(fd: FormData): Promise<void> {
  const me = await requireUser("/studio/login");
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  const result = await markDelivered(id);
  if (!result.ok) {
    redirect(`/studio/orders/${id}?flash=${encodeURIComponent(result.error)}`);
  }
  await logAudit({ user_id: me.id, action: "mark_delivered", entity: "order", entity_id: id });
  revalidatePath("/studio/orders");
  revalidatePath(`/studio/orders/${id}`);
  revalidatePath(`/account/orders/${id}`);
  redirect(`/studio/orders/${id}?flash=${encodeURIComponent("Order marked as delivered")}`);
}

export async function saveOrderNotesStudioAction(fd: FormData): Promise<void> {
  const me = await requireUser("/studio/login");
  const id = String(fd.get("id") ?? "");
  const notes = String(fd.get("notes") ?? "");
  if (!id) return;
  await setOrderNotes(id, notes);
  await logAudit({ user_id: me.id, action: "save_order_notes", entity: "order", entity_id: id });
  revalidatePath(`/studio/orders/${id}`);
  redirect(`/studio/orders/${id}?flash=${encodeURIComponent("Notes saved")}`);
}