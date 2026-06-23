"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "../../../lib/admin/session";
import { setOrderStatus, setOrderNotes, getOrderItems, shipOrder, markDelivered } from "../../../lib/admin/repos/orders";
import { logAudit } from "../../../lib/admin/repos/audit";
import { sql } from "../../../lib/admin/db";
import { bustInventory } from "../../../lib/storefront/cache";

const StatusSchema = z.enum(["new","confirmed","in_atelier","cancelled"]);

const STATUS_LABEL: Record<z.infer<typeof StatusSchema>, string> = {
  new: "New", confirmed: "Confirmed", in_atelier: "In atelier",
  cancelled: "Cancelled",
};

async function deductStock(orderId: string): Promise<string | null> {
  const items = await getOrderItems(orderId);
  const agg: Record<string, number> = {};
  for (const it of items) {
    if ((it as Record<string, unknown>).is_fabric) continue; // fabric handled separately
    const key = `${it.product_slug}::${it.size || "_"}`;
    agg[key] = (agg[key] || 0) + it.qty;
  }
  return sql.tx(async (t) => {
    for (const [key, qty] of Object.entries(agg)) {
      const [slug, size] = key.split("::");
      if (!size || size === "_") continue;
      const row = await t.get<{ stock: number }>(
        "SELECT stock FROM inventory WHERE product_slug = ? AND size = ?",
        [slug, size],
      );
      if (!row) continue;
      if (row.stock < qty) {
        return `Insufficient stock for "${slug}" size ${size} (need ${qty}, have ${row.stock})`;
      }
    }
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

export async function setOrderStatusAction(fd: FormData): Promise<void> {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  const status = StatusSchema.parse(String(fd.get("status") ?? "new"));
  if (!id) return;

  const order = await sql.get<{ status: string }>("SELECT status FROM orders WHERE id = ?", [id]);
  if (!order) return;

  // Block invalid transitions — shipped/fulfilled orders are terminal for these buttons
  if (order.status === "shipped" || order.status === "fulfilled") {
    redirect(`/admin/orders/${id}?flash=${encodeURIComponent("Cannot change status of a shipped/delivered order from here")}`);
  }
  // Block regression to "new" once stock has been deducted (confirmed or later)
  if (status === "new" && order.status !== "new") {
    redirect(`/admin/orders/${id}?flash=${encodeURIComponent("Cannot revert to New — stock has already been deducted")}`);
  }

  // Deduct stock when transitioning out of "new" (regardless of target)
  if (order.status === "new" && status !== "new" && status !== "cancelled") {
    const err = await deductStock(id);
    if (err) {
      redirect(`/admin/orders/${id}?flash=${encodeURIComponent(err)}`);
    }
    bustInventory();
  }

  // Restore stock on cancel if order was confirmed (stock already deducted)
  if (status === "cancelled" && order.status !== "new" && order.status !== "cancelled") {
    await restoreStock(id);
  }

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

export async function shipOrderAction(fd: FormData): Promise<void> {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  const courier_code = String(fd.get("courier_code") ?? "");
  const tracking_number = String(fd.get("tracking_number") ?? "");
  const tracking_url_override = String(fd.get("tracking_url") ?? "");
  if (!id || !courier_code || !tracking_number.trim()) {
    redirect(`/admin/orders/${id}?flash=${encodeURIComponent("Courier and tracking number are required")}`);
  }
  const result = await shipOrder({ id, courier_code, tracking_number, tracking_url_override });
  if (!result.ok) {
    redirect(`/admin/orders/${id}?flash=${encodeURIComponent(result.error)}`);
  }
  await logAudit({ user_id: me.id, action: "ship_order", entity: "order", entity_id: id, payload: { courier_code, tracking_number } });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath(`/account/orders/${id}`);
  redirect(`/admin/orders/${id}?flash=${encodeURIComponent("Order shipped — tracking info saved")}`);
}

export async function markDeliveredAction(fd: FormData): Promise<void> {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  const result = await markDelivered(id);
  if (!result.ok) {
    redirect(`/admin/orders/${id}?flash=${encodeURIComponent(result.error)}`);
  }
  await logAudit({ user_id: me.id, action: "mark_delivered", entity: "order", entity_id: id });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath(`/account/orders/${id}`);
  redirect(`/admin/orders/${id}?flash=${encodeURIComponent("Order marked as delivered")}`);
}
