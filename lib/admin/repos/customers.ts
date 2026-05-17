import "server-only";
import { getDb } from "../db";
import type { Customer } from "../types";

export function listCustomers(filter?: { q?: string; limit?: number; offset?: number }): Customer[] {
  const db = getDb();
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter?.q) {
    where.push("(email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)");
    const q = `%${filter.q}%`;
    params.push(q, q, q);
  }
  const sql = `SELECT * FROM customers ${where.length ? "WHERE " + where.join(" AND ") : ""}
               ORDER BY total_spent DESC, created_at DESC LIMIT ? OFFSET ?`;
  params.push(filter?.limit ?? 50, filter?.offset ?? 0);
  return db.prepare(sql).all(...params) as Customer[];
}

export function countCustomers(filter?: { q?: string }): number {
  const db = getDb();
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter?.q) {
    where.push("(email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)");
    const q = `%${filter.q}%`;
    params.push(q, q, q);
  }
  const sql = `SELECT COUNT(*) as n FROM customers ${where.length ? "WHERE " + where.join(" AND ") : ""}`;
  return (db.prepare(sql).get(...params) as { n: number }).n;
}

export function getCustomer(id: number): Customer | null {
  return (getDb().prepare("SELECT * FROM customers WHERE id = ?").get(id) as Customer | undefined) ?? null;
}

export function getCustomerOrders(id: number) {
  return getDb()
    .prepare(
      "SELECT id, status, total, created_at FROM orders WHERE customer_id = ? ORDER BY datetime(created_at) DESC",
    )
    .all(id) as Array<{ id: string; status: string; total: number; created_at: string }>;
}

/**
 * Orders for the authenticated customer, resolved by their verified session
 * email rather than a single customers.id. Signup lowercases the email
 * (customer-auth.ts) but checkout's upsertCustomer historically did not, and
 * SQLite string equality is case-sensitive — so a person could own more than
 * one customers row differing only by email case. Matching on LOWER(email)
 * collapses those rows so every order the customer placed is returned.
 *
 * The email MUST come from the server-side session — never from client input.
 */
export function getCustomerOrdersByEmail(email: string) {
  const normalised = email.trim().toLowerCase();
  return getDb()
    .prepare(
      `SELECT o.id, o.status, o.total, o.created_at
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
       WHERE LOWER(c.email) = ?
       ORDER BY datetime(o.created_at) DESC`,
    )
    .all(normalised) as Array<{ id: string; status: string; total: number; created_at: string }>;
}

export function upsertCustomer(input: Omit<Customer, "id" | "total_orders" | "total_spent" | "created_at">): number {
  const db = getDb();
  // Normalise to match the lowercasing done at signup (customer-auth.ts), so
  // a case-variant checkout email reuses the existing row instead of creating
  // a duplicate that would orphan the customer's order history.
  const email = input.email.trim().toLowerCase();
  const existing = db
    .prepare("SELECT id FROM customers WHERE LOWER(email) = ?")
    .get(email) as { id: number } | undefined;
  if (existing) return existing.id;
  const r = db
    .prepare(
      `INSERT INTO customers (email, first_name, last_name, phone, city) VALUES (?, ?, ?, ?, ?)`,
    )
    .run(email, input.first_name, input.last_name, input.phone, input.city);
  return Number(r.lastInsertRowid);
}
