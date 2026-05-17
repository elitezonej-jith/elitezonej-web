import "server-only";
import { getDb } from "../db";
import type { Customer } from "../types";

export type CustomerAuthRow = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  password_hash: string | null;
};

export function getCustomerAuthByEmail(email: string): CustomerAuthRow | null {
  return (
    (getDb()
      .prepare(
        "SELECT id, email, first_name, last_name, phone, password_hash FROM customers WHERE email = ?",
      )
      .get(email.toLowerCase()) as CustomerAuthRow | undefined) ?? null
  );
}

/**
 * Creates a customer account, or upgrades an existing guest customer (a row
 * created at checkout with no password) in place. Returns the customer id.
 * Throws if the email already has a password (account exists).
 */
export function createAccount(input: {
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  password_hash: string;
}): number {
  const db = getDb();
  const email = input.email.toLowerCase();
  const existing = db
    .prepare("SELECT id, password_hash FROM customers WHERE email = ?")
    .get(email) as { id: number; password_hash: string | null } | undefined;

  if (existing) {
    if (existing.password_hash) {
      throw new Error("ACCOUNT_EXISTS");
    }
    db.prepare(
      `UPDATE customers SET password_hash = ?, first_name = ?, last_name = ?,
         phone = COALESCE(?, phone) WHERE id = ?`,
    ).run(input.password_hash, input.first_name, input.last_name, input.phone, existing.id);
    return existing.id;
  }

  const r = db
    .prepare(
      `INSERT INTO customers (email, first_name, last_name, phone, password_hash)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(email, input.first_name, input.last_name, input.phone, input.password_hash);
  return Number(r.lastInsertRowid);
}

export function setCustomerPassword(id: number, hash: string): void {
  getDb().prepare("UPDATE customers SET password_hash = ? WHERE id = ?").run(hash, id);
}

export function createCustomerSession(
  customerId: number,
  ip: string | null,
  ua: string | null,
  sessionId: string,
  expiresAtIso: string,
): void {
  getDb()
    .prepare(
      `INSERT INTO customer_sessions (id, customer_id, expires_at, ip, ua) VALUES (?, ?, ?, ?, ?)`,
    )
    .run(sessionId, customerId, expiresAtIso, ip, ua);
}

export type SessionCustomer = Omit<Customer, "total_orders" | "total_spent"> & {
  total_orders: number;
  total_spent: number;
};

export function getCustomerBySession(sessionId: string): SessionCustomer | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT c.id, c.email, c.first_name, c.last_name, c.phone, c.city,
              c.total_orders, c.total_spent, c.created_at, s.expires_at
       FROM customer_sessions s JOIN customers c ON c.id = s.customer_id
       WHERE s.id = ?`,
    )
    .get(sessionId) as
    | (SessionCustomer & { expires_at: string })
    | undefined;
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare("DELETE FROM customer_sessions WHERE id = ?").run(sessionId);
    return null;
  }
  const { expires_at: _omit, ...customer } = row;
  void _omit;
  return customer;
}

export function destroyCustomerSession(sessionId: string): void {
  getDb().prepare("DELETE FROM customer_sessions WHERE id = ?").run(sessionId);
}

export function purgeExpiredCustomerSessions(): void {
  getDb()
    .prepare("DELETE FROM customer_sessions WHERE datetime(expires_at) < datetime('now')")
    .run();
}
