import "server-only";
import { sql } from "../db";
import type { Role, User } from "../types";

export async function countUsers(): Promise<number> {
  const row = await sql.get<{ n: number | string }>("SELECT COUNT(*) as n FROM users");
  return Number(row?.n ?? 0);
}

export async function listUsers(): Promise<User[]> {
  return sql.all<User>(
    "SELECT id, email, name, role, created_at, last_login_at FROM users ORDER BY created_at ASC",
  );
}

export async function getUserByEmail(
  email: string,
): Promise<(User & { password_hash: string }) | null> {
  return sql.get<User & { password_hash: string }>(
    "SELECT id, email, name, role, created_at, last_login_at, password_hash FROM users WHERE email = ?",
    [email.toLowerCase()],
  );
}

/** Auth-only: fetch the password hash by user id (tighter than email lookup
 *  for self-scoped flows like password change). */
export async function getUserAuthById(
  id: number,
): Promise<{ id: number; password_hash: string } | null> {
  return sql.get<{ id: number; password_hash: string }>(
    "SELECT id, password_hash FROM users WHERE id = ?",
    [id],
  );
}

export async function getUserById(id: number): Promise<User | null> {
  return sql.get<User>(
    "SELECT id, email, name, role, created_at, last_login_at FROM users WHERE id = ?",
    [id],
  );
}

export async function createUser(input: {
  email: string;
  password_hash: string;
  name: string;
  role: Role;
}): Promise<number> {
  const r = await sql.run(
    `INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)
     RETURNING id`,
    [input.email.toLowerCase(), input.password_hash, input.name, input.role],
  );
  return Number(r.rows[0].id);
}

export async function setUserPassword(id: number, password_hash: string): Promise<void> {
  await sql.run("UPDATE users SET password_hash = ? WHERE id = ?", [password_hash, id]);
}

export async function deleteUser(id: number): Promise<void> {
  await sql.run("DELETE FROM users WHERE id = ?", [id]);
}

export async function touchLogin(id: number): Promise<void> {
  await sql.run(
    "UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?",
    [id],
  );
}
