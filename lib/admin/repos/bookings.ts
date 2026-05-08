import "server-only";
import { getDb } from "../db";
import type { Booking, BookingStatus } from "../types";

export function listBookings(filter?: { status?: BookingStatus; q?: string; limit?: number; offset?: number }): Booking[] {
  const db = getDb();
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter?.status) { where.push("status = ?"); params.push(filter.status); }
  if (filter?.q) {
    where.push("(first_name LIKE ? OR last_name LIKE ? OR phone LIKE ? OR email LIKE ?)");
    const q = `%${filter.q}%`;
    params.push(q, q, q, q);
  }
  const sql = `SELECT * FROM bookings ${where.length ? "WHERE " + where.join(" AND ") : ""}
               ORDER BY datetime(created_at) DESC LIMIT ? OFFSET ?`;
  params.push(filter?.limit ?? 50, filter?.offset ?? 0);
  return db.prepare(sql).all(...params) as Booking[];
}

export function countBookings(filter?: { status?: BookingStatus }): number {
  const db = getDb();
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter?.status) { where.push("status = ?"); params.push(filter.status); }
  const sql = `SELECT COUNT(*) as n FROM bookings ${where.length ? "WHERE " + where.join(" AND ") : ""}`;
  return (db.prepare(sql).get(...params) as { n: number }).n;
}

export function getBooking(id: number): Booking | null {
  return (getDb().prepare("SELECT * FROM bookings WHERE id = ?").get(id) as Booking | undefined) ?? null;
}

export type BookingInput = {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string | null;
  city: string;
  service: string;
  message?: string | null;
  source?: string;
};

export function createBooking(input: BookingInput): number {
  const r = getDb()
    .prepare(
      `INSERT INTO bookings (first_name, last_name, phone, email, city, service, message, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.first_name,
      input.last_name,
      input.phone,
      input.email ?? null,
      input.city,
      input.service,
      input.message ?? null,
      input.source ?? "web",
    );
  return Number(r.lastInsertRowid);
}

export function setBookingStatus(id: number, status: BookingStatus): void {
  getDb().prepare("UPDATE bookings SET status = ? WHERE id = ?").run(status, id);
}

export function deleteBooking(id: number): void {
  getDb().prepare("DELETE FROM bookings WHERE id = ?").run(id);
}
