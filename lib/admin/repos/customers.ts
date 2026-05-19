import "server-only";
import { sql } from "../db";
import type { Customer } from "../types";

export async function listCustomers(filter?: {
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<Customer[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter?.q) {
    where.push("(email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)");
    const q = `%${filter.q}%`;
    params.push(q, q, q);
  }
  const query = `SELECT * FROM customers ${where.length ? "WHERE " + where.join(" AND ") : ""}
               ORDER BY total_spent DESC, created_at DESC LIMIT ? OFFSET ?`;
  params.push(filter?.limit ?? 50, filter?.offset ?? 0);
  return sql.all<Customer>(query, params);
}

export async function countCustomers(filter?: { q?: string }): Promise<number> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter?.q) {
    where.push("(email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)");
    const q = `%${filter.q}%`;
    params.push(q, q, q);
  }
  const query = `SELECT COUNT(*) as n FROM customers ${where.length ? "WHERE " + where.join(" AND ") : ""}`;
  const row = await sql.get<{ n: number | string }>(query, params);
  return Number(row?.n ?? 0);
}

export async function getCustomer(id: number): Promise<Customer | null> {
  return sql.get<Customer>("SELECT * FROM customers WHERE id = ?", [id]);
}

export async function getCustomerOrders(
  id: number,
): Promise<Array<{ id: string; status: string; total: number; created_at: string }>> {
  return sql.all<{ id: string; status: string; total: number; created_at: string }>(
    "SELECT id, status, total, created_at FROM orders WHERE customer_id = ? ORDER BY created_at DESC",
    [id],
  );
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
export async function getCustomerOrdersByEmail(
  email: string,
): Promise<Array<{ id: string; status: string; total: number; created_at: string }>> {
  const normalised = email.trim().toLowerCase();
  return sql.all<{ id: string; status: string; total: number; created_at: string }>(
    `SELECT o.id, o.status, o.total, o.created_at
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
       WHERE LOWER(c.email) = ?
       ORDER BY o.created_at DESC`,
    [normalised],
  );
}

export async function upsertCustomer(
  input: Omit<Customer, "id" | "total_orders" | "total_spent" | "created_at">,
): Promise<number> {
  // Normalise to match the lowercasing done at signup (customer-auth.ts), so
  // a case-variant checkout email reuses the existing row instead of creating
  // a duplicate that would orphan the customer's order history.
  const email = input.email.trim().toLowerCase();
  const existing = await sql.get<{ id: number | string }>(
    "SELECT id FROM customers WHERE LOWER(email) = ?",
    [email],
  );
  if (existing) return Number(existing.id);
  const r = await sql.run(
    `INSERT INTO customers (email, first_name, last_name, phone, city) VALUES (?, ?, ?, ?, ?)
     RETURNING id`,
    [email, input.first_name, input.last_name, input.phone, input.city],
  );
  return Number(r.rows[0].id);
}
