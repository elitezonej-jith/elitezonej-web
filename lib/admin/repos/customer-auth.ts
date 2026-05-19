import "server-only";
import { sql } from "../db";
import type { Customer } from "../types";

export type CustomerAuthRow = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  password_hash: string | null;
};

export async function getCustomerAuthByEmail(email: string): Promise<CustomerAuthRow | null> {
  return sql.get<CustomerAuthRow>(
    "SELECT id, email, first_name, last_name, phone, password_hash FROM customers WHERE email = ?",
    [email.toLowerCase()],
  );
}

/**
 * Creates a customer account, or upgrades an existing guest customer (a row
 * created at checkout with no password) in place. Returns the customer id.
 * Throws if the email already has a password (account exists).
 */
export async function createAccount(input: {
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  password_hash: string;
}): Promise<number> {
  const email = input.email.toLowerCase();
  const existing = await sql.get<{ id: number | string; password_hash: string | null }>(
    "SELECT id, password_hash FROM customers WHERE email = ?",
    [email],
  );

  if (existing) {
    if (existing.password_hash) {
      throw new Error("ACCOUNT_EXISTS");
    }
    await sql.run(
      `UPDATE customers SET password_hash = ?, first_name = ?, last_name = ?,
         phone = COALESCE(?, phone) WHERE id = ?`,
      [input.password_hash, input.first_name, input.last_name, input.phone, existing.id],
    );
    return Number(existing.id);
  }

  const r = await sql.run(
    `INSERT INTO customers (email, first_name, last_name, phone, password_hash)
     VALUES (?, ?, ?, ?, ?)
     RETURNING id`,
    [email, input.first_name, input.last_name, input.phone, input.password_hash],
  );
  return Number(r.rows[0].id);
}

export async function setCustomerPassword(id: number, hash: string): Promise<void> {
  await sql.run("UPDATE customers SET password_hash = ? WHERE id = ?", [hash, id]);
}

export async function createCustomerSession(
  customerId: number,
  ip: string | null,
  ua: string | null,
  sessionId: string,
  expiresAtIso: string,
): Promise<void> {
  await sql.run(
    `INSERT INTO customer_sessions (id, customer_id, expires_at, ip, ua) VALUES (?, ?, ?, ?, ?)`,
    [sessionId, customerId, expiresAtIso, ip, ua],
  );
}

export type SessionCustomer = Omit<Customer, "total_orders" | "total_spent"> & {
  total_orders: number;
  total_spent: number;
};

export async function getCustomerBySession(
  sessionId: string,
): Promise<SessionCustomer | null> {
  const row = await sql.get<SessionCustomer & { expires_at: string }>(
    `SELECT c.id, c.email, c.first_name, c.last_name, c.phone, c.city,
            c.total_orders, c.total_spent, c.created_at, s.expires_at
     FROM customer_sessions s JOIN customers c ON c.id = s.customer_id
     WHERE s.id = ?`,
    [sessionId],
  );
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await sql.run("DELETE FROM customer_sessions WHERE id = ?", [sessionId]);
    return null;
  }
  const { expires_at: _omit, ...customer } = row;
  void _omit;
  // total_orders/total_spent are integer columns; Postgres returns them as
  // strings — coerce so the typed number contract holds on both drivers.
  return {
    ...customer,
    total_orders: Number(customer.total_orders),
    total_spent: Number(customer.total_spent),
  };
}

export async function destroyCustomerSession(sessionId: string): Promise<void> {
  await sql.run("DELETE FROM customer_sessions WHERE id = ?", [sessionId]);
}

export async function purgeExpiredCustomerSessions(): Promise<void> {
  await sql.run("DELETE FROM customer_sessions WHERE expires_at < CURRENT_TIMESTAMP");
}
