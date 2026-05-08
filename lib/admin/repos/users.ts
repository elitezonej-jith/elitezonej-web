import "server-only";
import { getDb } from "../db";
import type { Role, User } from "../types";

export function countUsers(): number {
  return (getDb().prepare("SELECT COUNT(*) as n FROM users").get() as { n: number }).n;
}

export function listUsers(): User[] {
  return getDb()
    .prepare("SELECT id, email, name, role, created_at, last_login_at FROM users ORDER BY created_at ASC")
    .all() as User[];
}

export function getUserByEmail(email: string): (User & { password_hash: string }) | null {
  return (getDb()
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.toLowerCase()) as (User & { password_hash: string }) | undefined) ?? null;
}

export function getUserById(id: number): User | null {
  return (getDb()
    .prepare("SELECT id, email, name, role, created_at, last_login_at FROM users WHERE id = ?")
    .get(id) as User | undefined) ?? null;
}

export function createUser(input: { email: string; password_hash: string; name: string; role: Role }): number {
  const r = getDb()
    .prepare(
      `INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)`,
    )
    .run(input.email.toLowerCase(), input.password_hash, input.name, input.role);
  return Number(r.lastInsertRowid);
}

export function setUserPassword(id: number, password_hash: string): void {
  getDb().prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(password_hash, id);
}

export function deleteUser(id: number): void {
  getDb().prepare("DELETE FROM users WHERE id = ?").run(id);
}

export function touchLogin(id: number): void {
  getDb()
    .prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?")
    .run(id);
}
