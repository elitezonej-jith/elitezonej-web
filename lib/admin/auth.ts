import "server-only";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { getDb } from "./db";
import type { Role, User } from "./types";

const SESSION_COST = 12;
const SESSION_TTL_DAYS = 30;
export const SESSION_COOKIE = "ezj_admin_session";

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SESSION_COST);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function newSessionId(): string {
  return randomBytes(32).toString("hex");
}

export function createSession(userId: number, ip?: string | null, ua?: string | null): { id: string; expires_at: string } {
  const id = newSessionId();
  const expires = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  getDb()
    .prepare(
      `INSERT INTO sessions (id, user_id, expires_at, ip, ua) VALUES (?, ?, ?, ?, ?)`,
    )
    .run(id, userId, expires.toISOString(), ip ?? null, ua ?? null);
  return { id, expires_at: expires.toISOString() };
}

export function getSessionUser(sessionId: string | undefined | null): User | null {
  if (!sessionId) return null;
  const db = getDb();
  const row = db
    .prepare(
      `SELECT u.id, u.email, u.name, u.role, u.created_at, u.last_login_at, s.expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.id = ?`,
    )
    .get(sessionId) as
      | { id: number; email: string; name: string; role: Role; created_at: string; last_login_at: string | null; expires_at: string }
      | undefined;
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
    return null;
  }
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    created_at: row.created_at,
    last_login_at: row.last_login_at,
  };
}

export function destroySession(sessionId: string): void {
  getDb().prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
}

export function destroyAllSessionsForUser(userId: number): void {
  getDb().prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
}

export function purgeExpiredSessions(): void {
  getDb()
    .prepare("DELETE FROM sessions WHERE datetime(expires_at) < datetime('now')")
    .run();
}
