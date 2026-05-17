import "server-only";
import { randomUUID } from "node:crypto";
import { getDb } from "../db";
import { upsertCustomer } from "./customers";
import type { Order, OrderItem, OrderStatus } from "../types";
import type { PricedLine, Pricing } from "../../storefront/checkout";

export type OrderListRow = Order & { customer: string; email: string };

export function listOrders(filter?: { status?: OrderStatus; q?: string; limit?: number; offset?: number }): OrderListRow[] {
  const db = getDb();
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter?.status) { where.push("o.status = ?"); params.push(filter.status); }
  if (filter?.q) {
    where.push("(o.id LIKE ? OR c.email LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ?)");
    const q = `%${filter.q}%`;
    params.push(q, q, q, q);
  }
  const sql = `SELECT o.*, c.first_name || ' ' || c.last_name as customer, c.email
               FROM orders o JOIN customers c ON c.id = o.customer_id
               ${where.length ? "WHERE " + where.join(" AND ") : ""}
               ORDER BY datetime(o.created_at) DESC
               LIMIT ? OFFSET ?`;
  params.push(filter?.limit ?? 50, filter?.offset ?? 0);
  return db.prepare(sql).all(...params) as OrderListRow[];
}

export function countOrders(filter?: { status?: OrderStatus; q?: string }): number {
  const db = getDb();
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter?.status) { where.push("o.status = ?"); params.push(filter.status); }
  if (filter?.q) {
    where.push("(o.id LIKE ? OR c.email LIKE ?)");
    const q = `%${filter.q}%`;
    params.push(q, q);
  }
  const sql = `SELECT COUNT(*) as n FROM orders o JOIN customers c ON c.id = o.customer_id
               ${where.length ? "WHERE " + where.join(" AND ") : ""}`;
  return (db.prepare(sql).get(...params) as { n: number }).n;
}

export function getOrder(id: string): (Order & { customer: string; email: string; phone: string | null; city: string | null }) | null {
  return (getDb()
    .prepare(
      `SELECT o.*, c.first_name || ' ' || c.last_name as customer,
              c.email, c.phone, c.city
       FROM orders o JOIN customers c ON c.id = o.customer_id
       WHERE o.id = ?`,
    )
    .get(id) as
      | (Order & { customer: string; email: string; phone: string | null; city: string | null })
      | undefined) ?? null;
}

export function getOrderItems(id: string): Array<OrderItem & { product_name: string }> {
  return getDb()
    .prepare(
      `SELECT oi.*, p.name as product_name
       FROM order_items oi LEFT JOIN products p ON p.slug = oi.product_slug
       WHERE oi.order_id = ?`,
    )
    .all(id) as Array<OrderItem & { product_name: string }>;
}

export function setOrderStatus(id: string, status: OrderStatus): void {
  getDb()
    .prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?")
    .run(status, id);
}

export function setOrderNotes(id: string, notes: string): void {
  getDb()
    .prepare("UPDATE orders SET notes = ?, updated_at = datetime('now') WHERE id = ?")
    .run(notes, id);
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
export function createPendingOrder(args: {
  contact: ContactSnapshot;
  lines: PricedLine[];
  pricing: Pricing;
}): string {
  const { contact, lines, pricing } = args;
  const db = getDb();
  const customerId = upsertCustomer({
    email: contact.email,
    first_name: contact.first_name,
    last_name: contact.last_name,
    phone: contact.phone || null,
    city: contact.ship_city || null,
  });
  const id = newOrderId();
  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO orders (
         id, customer_id, status, payment_status, subtotal, discount, shipping,
         tax, total, currency, promo_code, email, phone, ship_name, ship_line1,
         ship_line2, ship_city, ship_state, ship_pincode, ship_country
       ) VALUES (?, ?, 'new', 'pending', ?, ?, ?, ?, ?, 'INR', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
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
    );
    const ins = db.prepare(
      `INSERT INTO order_items (order_id, product_slug, qty, unit_price, size, colour, is_fabric)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const l of lines) {
      ins.run(id, l.slug, l.qty, l.unit_price, l.size, l.colour, l.is_fabric ? 1 : 0);
    }
  });
  tx();
  return id;
}

export type FulfilResult =
  | { ok: true; alreadyPaid: boolean }
  | { ok: false; error: string };

/**
 * Marks a pending order as paid in a single transaction: re-validates and
 * decrements stock, bumps promo usage and customer lifetime totals, and
 * settles the payment row. Idempotent — a second call (e.g. webhook after the
 * client callback) is a safe no-op.
 */
export function fulfilOrderPaid(
  orderId: string,
  meta: { providerPaymentId: string | null },
): FulfilResult {
  const db = getDb();
  const tx = db.transaction((): FulfilResult => {
    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId) as
      | (Order & Record<string, unknown>)
      | undefined;
    if (!order) return { ok: false, error: "Order not found." };
    if (order.payment_status === "paid") return { ok: true, alreadyPaid: true };

    const items = db
      .prepare("SELECT * FROM order_items WHERE order_id = ?")
      .all(orderId) as OrderItem[];

    const decInv = db.prepare(
      "UPDATE inventory SET stock = stock - ? WHERE product_slug = ? AND size = ? AND stock >= ?",
    );
    const decColour = db.prepare(
      "UPDATE fabric_colours SET stock_meters = stock_meters - ? WHERE product_slug = ? AND name = ? AND stock_meters >= ?",
    );
    const decFabricTotal = db.prepare(
      "UPDATE fabric_meta SET stock_meters_total = MAX(0, stock_meters_total - ?) WHERE product_slug = ?",
    );

    for (const it of items) {
      if (it.is_fabric) {
        const r = decColour.run(it.qty, it.product_slug, it.colour ?? "", it.qty);
        if (r.changes === 0) {
          throw new Error(`Insufficient stock for ${it.product_slug} (${it.colour ?? "—"}).`);
        }
        decFabricTotal.run(it.qty, it.product_slug);
      } else {
        const r = decInv.run(it.qty, it.product_slug, it.size ?? "", it.qty);
        if (r.changes === 0) {
          throw new Error(`Insufficient stock for ${it.product_slug} (size ${it.size ?? "—"}).`);
        }
      }
    }

    db.prepare(
      "UPDATE orders SET status = 'confirmed', payment_status = 'paid', updated_at = datetime('now') WHERE id = ?",
    ).run(orderId);

    if (order.promo_code) {
      db.prepare("UPDATE promotions SET usage_count = usage_count + 1 WHERE code = ?").run(
        order.promo_code,
      );
    }

    db.prepare(
      "UPDATE customers SET total_orders = total_orders + 1, total_spent = total_spent + ? WHERE id = ?",
    ).run(order.total, order.customer_id);

    db.prepare(
      `UPDATE payments SET status = 'paid',
         provider_payment_id = COALESCE(?, provider_payment_id),
         updated_at = datetime('now')
       WHERE order_id = ?`,
    ).run(meta.providerPaymentId, orderId);

    return { ok: true, alreadyPaid: false };
  });

  try {
    return tx();
  } catch (err) {
    return { ok: false, error: (err as Error).message || "Could not fulfil order." };
  }
}

/**
 * Marks a still-pending order's payment as failed (gateway reported
 * payment.failed). Never touches a paid order and never decrements stock.
 */
export function markOrderPaymentFailed(orderId: string): void {
  const db = getDb();
  const tx = db.transaction(() => {
    db.prepare(
      "UPDATE orders SET payment_status = 'failed', updated_at = datetime('now') WHERE id = ? AND payment_status = 'pending'",
    ).run(orderId);
    db.prepare(
      "UPDATE payments SET status = 'failed', updated_at = datetime('now') WHERE order_id = ? AND status = 'created'",
    ).run(orderId);
  });
  tx();
}
