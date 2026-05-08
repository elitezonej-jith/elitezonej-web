import "server-only";
import { getDb } from "../db";
import type { Order, OrderItem, OrderStatus } from "../types";

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
