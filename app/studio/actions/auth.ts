"use server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { rateLimit, resetRateLimit } from "../../../lib/admin/rate-limit";
import {
  SESSION_COOKIE, SESSION_COOKIE_OPTIONS, createSession, destroySession,
  hashPassword, safeNextPath, verifyPassword,
} from "../../../lib/admin/auth";
import { countUsers, createUser, getUserByEmail, touchLogin } from "../../../lib/admin/repos/users";
import { logAudit } from "../../../lib/admin/repos/audit";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  next: z.string().optional(),
});

const SetupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "At least 8 characters"),
  name: z.string().min(2, "Tell us your name"),
});

export type AuthState = { error?: string; ok?: boolean };

export async function signInStudioAction(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const parsed = LoginSchema.safeParse({
    email: fd.get("email"),
    password: fd.get("password"),
    next: fd.get("next") || "/studio",
  });
  if (!parsed.success) return { error: "Enter a valid email and password." };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const rlKey = `studio-signin:${ip}:${parsed.data.email.toLowerCase()}`;
  const rl = rateLimit(rlKey, 10, 15 * 60 * 1000);
  if (!rl.ok) {
    return { error: `Too many attempts. Try again in ${Math.ceil(rl.retryAfterSec / 60)} min.` };
  }

  // Constant-time: always run bcrypt to avoid email-enumeration via timing.
  const u = await getUserByEmail(parsed.data.email);
  const hashForCompare = u?.password_hash ?? "$2a$12$invalidinvalidinvalidinvaliduO0000000000000000000000000000";
  const ok = await verifyPassword(parsed.data.password, hashForCompare);
  if (!u || !ok) return { error: "We couldn't sign you in with those details." };

  resetRateLimit(rlKey);

  const sess = await createSession(u.id);
  const c = await cookies();
  c.set(SESSION_COOKIE, sess.id, {
    ...SESSION_COOKIE_OPTIONS,
    expires: new Date(sess.expires_at),
  });
  touchLogin(u.id);
  await logAudit({ user_id: u.id, action: "studio_sign_in", entity: "user", entity_id: String(u.id) });
  redirect(safeNextPath(parsed.data.next, "/studio"));
}

export async function signOutStudioAction(): Promise<void> {
  const c = await cookies();
  const sid = c.get(SESSION_COOKIE)?.value;
  if (sid) await destroySession(sid);
  c.delete(SESSION_COOKIE);
  redirect("/studio/login");
}

export async function bootstrapStudioOwnerAction(_prev: AuthState, fd: FormData): Promise<AuthState> {
  if ((await countUsers()) > 0) return { error: "Setup is already complete." };
  const parsed = SetupSchema.safeParse({
    email: fd.get("email"),
    password: fd.get("password"),
    name: fd.get("name"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const hash = await hashPassword(parsed.data.password);
  const id = await createUser({ email: parsed.data.email, password_hash: hash, name: parsed.data.name, role: "owner" });
  const sess = await createSession(id);
  const c = await cookies();
  c.set(SESSION_COOKIE, sess.id, {
    ...SESSION_COOKIE_OPTIONS,
    expires: new Date(sess.expires_at),
  });
  await logAudit({ user_id: id, action: "bootstrap_owner", entity: "user", entity_id: String(id) });
  redirect("/studio");
}
