import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, getSessionUser } from "./auth";
import type { Role, User } from "./types";

export async function getCurrentUser(): Promise<User | null> {
  const c = await cookies();
  const sid = c.get(SESSION_COOKIE)?.value;
  return getSessionUser(sid);
}

export async function requireUser(redirectTo = "/admin/login"): Promise<User> {
  const u = await getCurrentUser();
  if (!u) redirect(redirectTo);
  return u;
}

export async function requireRole(role: Role): Promise<User> {
  const u = await requireUser();
  if (role === "owner" && u.role !== "owner") {
    redirect("/admin?denied=1");
  }
  return u;
}
