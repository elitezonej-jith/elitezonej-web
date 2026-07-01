"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { requireUser } from "../../../lib/admin/session";
import { sql } from "../../../lib/admin/db";
import { logAudit } from "../../../lib/admin/repos/audit";
import { bustInventory, bustProducts } from "../../../lib/storefront/cache";

const ItemSchema = z.object({
  product_slug: z.string().min(1),
  product_name: z.string().min(1),
  size: z.string().nullable(),
  colour: z.string().nullable(),
  qty: z.number().positive(),
  unit_price: z.number().min(0),
  is_fabric: z.boolean(),
});

const WalkInSchema = z.object({
  customer_name: z.string().min(1, "Customer name is required"),
  customer_phone: z.string().min(5, "Phone number is required"),
  customer_email: z.string().email().optional().or(z.literal("")),
  items: z.array(ItemSchema).min(1, "Add at least one item"),
  subtotal: z.number().min(0),
  discount: z.number().min(0),
  tax: z.number().min(0),
  total: z.number().min(0),
  payment_method: z.enum(["cash", "card", "upi", "pending"]),
  notes: z.string().optional(),
});

export type WalkInState = { error?: string };

export async function createWalkInOrderAction(_prev: WalkInState, fd: FormData): Promise<WalkInState> {
  const me = await requireUser("/studio/login");

  // Parse the JSON payload from hidden input
  let data: unknown;
  try {
    data = JSON.parse(String(fd.get("payload") ?? "{}"));
  } catch {
    return { error: "Invalid form data." };
  }

  const parsed = WalkInSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please review the form." };
  }

  const v = parsed.data;

  // Generate email placeholder for walk-in customers without email
  const email = v.customer_email || `walkin-${v.customer_phone.replace(/\D/g, "")}@placeholder.local`;

  // Upsert customer by phone (for walk-in, phone is the primary identifier)
  const nameParts = v.customer_name.trim().split(/\s+/);
  const firstName = nameParts[0] || "Walk-in";
  const lastName = nameParts.slice(1).join(" ") || "";

  const customerId = await sql.tx(async (t) => {
    // Try to find existing customer by phone
    const existing = await t.get<{ id: number }>(
      "SELECT id FROM customers WHERE phone = ?",
      [v.customer_phone],
    );
    if (existing) {
      // Update name if changed
      await t.run(
        "UPDATE customers SET first_name = ?, last_name = ? WHERE id = ?",
        [firstName, lastName, existing.id],
      );
      return existing.id;
    }
    // Try by email (if real email provided)
    if (v.customer_email) {
      const byEmail = await t.get<{ id: number }>(
        "SELECT id FROM customers WHERE email = ?",
        [v.customer_email],
      );
      if (byEmail) {
        await t.run(
          "UPDATE customers SET first_name = ?, last_name = ?, phone = ? WHERE id = ?",
          [firstName, lastName, v.customer_phone, byEmail.id],
        );
        return byEmail.id;
      }
    }
    // Create new
    const result = await t.get<{ id: number }>(
      "INSERT INTO customers (email, first_name, last_name, phone) VALUES (?, ?, ?, ?) RETURNING id",
      [email, firstName, lastName, v.customer_phone],
    );
    return result?.id ?? 0;
  });

  if (!customerId) return { error: "Failed to create customer record." };

  // Generate order ID
  const orderId = `EZJ-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
  const paymentStatus = v.payment_method === "pending" ? "pending" : "paid";
  const orderStatus = paymentStatus === "paid" ? "confirmed" : "new";
  const noteText = [
    `Walk-in · ${v.payment_method.toUpperCase()}`,
    v.notes ? v.notes : null,
  ].filter(Boolean).join(" · ");

  // Create order
  await sql.run(
    `INSERT INTO orders (
       id, customer_id, status, payment_status, subtotal, discount, shipping,
       tax, total, currency, promo_code, email, phone, ship_name, ship_line1,
       ship_line2, ship_city, ship_state, ship_pincode, ship_country, notes
     ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, 'INR', NULL, ?, ?, ?, '', '', '', '', '', 'India', ?)`,
    [
      orderId, customerId, orderStatus, paymentStatus,
      v.subtotal, v.discount, v.tax, v.total,
      email, v.customer_phone, v.customer_name, noteText,
    ],
  );

  // Insert order items
  for (const item of v.items) {
    await sql.run(
      `INSERT INTO order_items (order_id, product_slug, qty, unit_price, size, colour, is_fabric)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [orderId, item.product_slug, item.qty, item.unit_price, item.size, item.colour, item.is_fabric ? 1 : 0],
    );
  }

  // Deduct stock (best-effort for walk-in — don't block the sale)
  try {
    await sql.tx(async (t) => {
      for (const item of v.items) {
        if (item.is_fabric) {
          if (item.colour) {
            await t.run(
              "UPDATE fabric_colours SET stock_meters = MAX(0, stock_meters - ?) WHERE product_slug = ? AND name = ?",
              [item.qty, item.product_slug, item.colour],
            );
            await t.run(
              "UPDATE fabric_meta SET stock_meters_total = MAX(0, stock_meters_total - ?) WHERE product_slug = ?",
              [item.qty, item.product_slug],
            );
          }
        } else if (item.size) {
          await t.run(
            "UPDATE inventory SET stock = MAX(0, stock - ?), oos_flag = CASE WHEN stock - ? <= 0 THEN 1 ELSE 0 END WHERE product_slug = ? AND size = ?",
            [item.qty, item.qty, item.product_slug, item.size],
          );
        }
      }
    });
  } catch {
    // Stock deduction failed — log but don't block the order
    console.warn(`[walk-in] Stock deduction failed for order ${orderId} — manual adjustment needed`);
  }

  // Update customer totals
  await sql.run(
    "UPDATE customers SET total_orders = total_orders + 1, total_spent = total_spent + ? WHERE id = ?",
    [v.total, customerId],
  );

  // Audit
  await logAudit({
    user_id: me.id,
    action: "create_walkin_order",
    entity: "order",
    entity_id: orderId,
    payload: { payment_method: v.payment_method, items: v.items.length, total: v.total },
  });

  bustInventory();
  bustProducts();
  revalidatePath("/studio/orders");
  revalidatePath("/studio/inventory");

  // Redirect to invoice with auto-print flag
  redirect(`/studio/orders/${orderId}/invoice?print=1`);
}
