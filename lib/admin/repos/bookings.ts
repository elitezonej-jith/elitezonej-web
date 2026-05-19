import "server-only";
import { sql } from "../db";
import type { Booking, BookingStatus } from "../types";

export async function listBookings(filter?: { status?: BookingStatus; q?: string; limit?: number; offset?: number }): Promise<Booking[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter?.status) { where.push("status = ?"); params.push(filter.status); }
  if (filter?.q) {
    where.push("(first_name LIKE ? OR last_name LIKE ? OR phone LIKE ? OR email LIKE ?)");
    const q = `%${filter.q}%`;
    params.push(q, q, q, q);
  }
  const query = `SELECT * FROM bookings ${where.length ? "WHERE " + where.join(" AND ") : ""}
               ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(filter?.limit ?? 50, filter?.offset ?? 0);
  return sql.all<Booking>(query, params);
}

export async function countBookings(filter?: { status?: BookingStatus }): Promise<number> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter?.status) { where.push("status = ?"); params.push(filter.status); }
  const query = `SELECT COUNT(*) as n FROM bookings ${where.length ? "WHERE " + where.join(" AND ") : ""}`;
  const row = await sql.get<{ n: number | string }>(query, params);
  return Number(row?.n ?? 0);
}

export async function getBooking(id: number): Promise<Booking | null> {
  return sql.get<Booking>("SELECT * FROM bookings WHERE id = ?", [id]);
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

export async function createBooking(input: BookingInput): Promise<number> {
  const r = await sql.run(
    `INSERT INTO bookings (first_name, last_name, phone, email, city, service, message, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    [
      input.first_name,
      input.last_name,
      input.phone,
      input.email ?? null,
      input.city,
      input.service,
      input.message ?? null,
      input.source ?? "web",
    ],
  );
  return Number(r.rows[0].id);
}

export async function setBookingStatus(id: number, status: BookingStatus): Promise<void> {
  await sql.run("UPDATE bookings SET status = ? WHERE id = ?", [status, id]);
}

export async function deleteBooking(id: number): Promise<void> {
  await sql.run("DELETE FROM bookings WHERE id = ?", [id]);
}
