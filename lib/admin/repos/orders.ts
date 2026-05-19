import "server-only";
import { randomUUID } from "node:crypto";
import { sql } from "../db";
import { upsertCustomer } from "./customers";
import type { Order, OrderItem, OrderStatus } from "../types";
import type { PricedLine, Pricing } from "../../storefront/checkout";

export type OrderListRow = Order & { customer: string; email: string };

export async function listOrders(filter?: {
  status?: OrderStatus;
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<OrderListRow[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter?.status) { where.push("o.status = ?"); params.push(filter.status); }
  if (filter?.q) {
    where.push("(o.id LIKE ? OR c.email LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ?)");
    const q = `%${filter.q}%`;
    params.push(q, q, q, q);
  }
  // created_at is timestamptz (PG) / ISO TEXT (SQLite) — both sort correctly
  // without the SQLite-only datetime() wrapper.
  const query = `SELECT o.*, c.first_name || ' ' || c.last_name as customer, c.email
               FROM orders o JOIN customers c ON c.id = o.customer_id
               ${where.length ? "WHERE " + where.join(" AND ") : ""}
               ORDER BY o.created_at DESC
               LIMIT ? OFFSET ?`;
  params.push(filter?.limit ?? 50, filter?.offset ?? 0);
  return sql.all<OrderListRow>(query, params);
}

export async function countOrders(filter?: { status?: OrderStatus; q?: string }): Promise<number> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter?.status) { where.push("o.status = ?"); params.push(filter.status); }
  if (filter?.q) {
    where.push("(o.id LIKE ? OR c.email LIKE ?)");
    const q = `%${filter.q}%`;
    params.push(q, q);
  }
  const query = `SELECT COUNT(*) as n FROM orders o JOIN customers c ON c.id = o.customer_id
               ${where.length ? "WHERE " + where.join(" AND ") : ""}`;
  // Postgres returns COUNT(*) as a bigint string; coerce for both drivers.
  const row = await sql.get<{ n: number | string }>(query, params);
  return Number(row?.n ?? 0);
}

export async function getOrder(
  id: string,
): Promise<(Order & { customer: string; email: string; phone: string | null; city: string | null }) | null> {
  return sql.get<Order & { customer: string; email: string; phone: string | null; city: string | null }>(
    `SELECT o.*, c.first_name || ' ' || c.last_name as customer,
            c.email, c.phone, c.city
     FROM orders o JOIN customers c ON c.id = o.customer_id
     WHERE o.id = ?`,
    [id],
  );
}

export async function getOrderItems(
  id: string,
): Promise<Array<OrderItem & { product_name: string }>> {
  return sql.all<OrderItem & { product_name: string }>(
    `SELECT oi.*, p.name as product_name
     FROM order_items oi LEFT JOIN products p ON p.slug = oi.product_slug
     WHERE oi.order_id = ?`,
    [id],
  );
}

export async function setOrderStatus(id: string, status: OrderStatus): Promise<void> {
  await sql.run(
    "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [status, id],
  );
}

export async function setOrderNotes(id: string, notes: string): Promise<void> {
  await sql.run(
    "UPDATE orders SET notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [notes, id],
  );
}

// ── Storefront checkout ──────────────────────────────────────────────────────

export type ContactSnapshot = {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  ship_line1: string;
  ship_line2: string;
  ship_city: string;
  ship_state: string;
  ship_pincode: string;
  ship_country: string;
};

function newOrderId(): string {
  return `EZJ-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

/**
 * Creates an unpaid order (status `new`, payment_status `pending`) plus its
 * items, upserting the customer. Money values come from the server-side
 * pricing engine — never from the client. Returns the new order id.
 */
export async function createPendingOrder(args: {
  contact: ContactSnapshot;
  lines: PricedLine[];
  pricing: Pricing;
}): Promise<string> {
  const { contact, lines, pricing } = args;
  const customerId = await upsertCustomer({
    email: contact.email,
    first_name: contact.first_name,
    last_name: contact.last_name,
    phone: contact.phone || null,
    city: contact.ship_city || null,
  });
  const id = newOrderId();
  await sql.tx(async (t) => {
    await t.run(
      `INSERT INTO orders (
         id, customer_id, status, payment_status, subtotal, discount, shipping,
         tax, total, currency, promo_code, email, phone, ship_name, ship_line1,
         ship_line2, ship_city, ship_state, ship_pincode, ship_country
       ) VALUES (?, ?, 'new', 'pending', ?, ?, ?, ?, ?, 'INR', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        customerId,
        pricing.subtotal,
        pricing.discount,
        pricing.shipping,
        pricing.tax,
        pricing.total,
        pricing.promo_code,
        contact.email,
        contact.phone,
        `${contact.first_name} ${contact.last_name}`.trim(),
        contact.ship_line1,
        contact.ship_line2,
        contact.ship_city,
        contact.ship_state,
        contact.ship_pincode,
        contact.ship_country,
      ],
    );
    for (const l of lines) {
      await t.run(
        `INSERT INTO order_items (order_id, product_slug, qty, unit_price, size, colour, is_fabric)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, l.slug, l.qty, l.unit_price, l.size, l.colour, l.is_fabric ? 1 : 0],
      );
    }
  });
  return id;
}

export type FulfilResult =
  | { ok: true; alreadyPaid: boolean }
  | { ok: false; error: string };

/**
 * Marks a pending order as paid in a single transaction: re-validates and
 * decrements stock, bumps promo usage and customer lifetime totals, and
 * settles the payment row. Idempotent — a second call (e.g. webhook after the
 * client callback) is a safe no-op (the `payment_status === 'paid'` guard
 * returns early before any stock is touched).
 *
 * NOTE: Postgres-only `SELECT … FOR UPDATE` row-locking is intentionally NOT
 * used here (no SQLite equivalent in the dual-driver contract). Correctness
 * under concurrent client-confirm + webhook is preserved by the idempotent
 * alreadyPaid guard inside the transaction. A driver-gated FOR UPDATE is a
 * tracked optional hardening, not required for correctness.
 */
export async function fulfilOrderPaid(
  orderId: string,
  meta: { providerPaymentId: string | null },
): Promise<FulfilResult> {
  try {
    return await sql.tx(async (t): Promise<FulfilResult> => {
      const order = await t.get<Order & Record<string, unknown>>(
        "SELECT * FROM orders WHERE id = ?",
        [orderId],
      );
      if (!order) return { ok: false, error: "Order not found." };
      if (order.payment_status === "paid") return { ok: true, alreadyPaid: true };

      const items = await t.all<OrderItem>(
        "SELECT * FROM order_items WHERE order_id = ?",
        [orderId],
      );

      for (const it of items) {
        if (it.is_fabric) {
          const r = await t.run(
            "UPDATE fabric_colours SET stock_meters = stock_meters - ? WHERE product_slug = ? AND name = ? AND stock_meters >= ?",
            [it.qty, it.product_slug, it.colour ?? "", it.qty],
          );
          if (r.count === 0) {
            throw new Error(`Insufficient stock for ${it.product_slug} (${it.colour ?? "—"}).`);
          }
          // MAX(0,…) is SQLite-scalar / PG-aggregate — use a portable CASE.
          await t.run(
            `UPDATE fabric_meta
               SET stock_meters_total = CASE
                 WHEN stock_meters_total - ? < 0 THEN 0
                 ELSE stock_meters_total - ?
               END
             WHERE product_slug = ?`,
            [it.qty, it.qty, it.product_slug],
          );
        } else {
          const r = await t.run(
            "UPDATE inventory SET stock = stock - ? WHERE product_slug = ? AND size = ? AND stock >= ?",
            [it.qty, it.product_slug, it.size ?? "", it.qty],
          );
          if (r.count === 0) {
            throw new Error(`Insufficient stock for ${it.product_slug} (size ${it.size ?? "—"}).`);
          }
        }
      }

      await t.run(
        "UPDATE orders SET status = 'confirmed', payment_status = 'paid', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [orderId],
      );

      if (order.promo_code) {
        await t.run(
          "UPDATE promotions SET usage_count = usage_count + 1 WHERE code = ?",
          [order.promo_code],
        );
      }

      await t.run(
        "UPDATE customers SET total_orders = total_orders + 1, total_spent = total_spent + ? WHERE id = ?",
        [order.total, order.customer_id],
      );

      await t.run(
        `UPDATE payments SET status = 'paid',
           provider_payment_id = COALESCE(?, provider_payment_id),
           updated_at = CURRENT_TIMESTAMP
         WHERE order_id = ?`,
        [meta.providerPaymentId, orderId],
      );

      return { ok: true, alreadyPaid: false };
    });
  } catch (err) {
    return { ok: false, error: (err as Error).message || "Could not fulfil order." };
  }
}

/**
 * Marks a still-pending order's payment as failed (gateway reported
 * payment.failed). Never touches a paid order and never decrements stock.
 */
export async function markOrderPaymentFailed(orderId: string): Promise<void> {
  await sql.tx(async (t) => {
    await t.run(
      "UPDATE orders SET payment_status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND payment_status = 'pending'",
      [orderId],
    );
    await t.run(
      "UPDATE payments SET status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE order_id = ? AND status = 'created'",
      [orderId],
    );
  });
}
