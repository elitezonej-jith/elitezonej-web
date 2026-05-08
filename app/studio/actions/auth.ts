"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  SESSION_COOKIE, createSession, destroySession, hashPassword, verifyPassword,
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

  const u = getUserByEmail(parsed.data.email);
  if (!u) return { error: "We couldn't find that account." };

  const ok = await verifyPassword(parsed.data.password, u.password_hash);
  if (!ok) return { error: "Wrong password — try again." };

  const sess = createSession(u.id);
  const c = await cookies();
  c.set(SESSION_COOKIE, sess.id, {
    httpOnly: true, sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(sess.expires_at), path: "/",
  });
  touchLogin(u.id);
  logAudit({ user_id: u.id, action: "studio_sign_in", entity: "user", entity_id: String(u.id) });
  redirect(parsed.data.next?.startsWith("/studio") ? parsed.data.next : "/studio");
}

export async function signOutStudioAction(): Promise<void> {
  const c = await cookies();
  const sid = c.get(SESSION_COOKIE)?.value;
  if (sid) destroySession(sid);
  c.delete(SESSION_COOKIE);
  redirect("/studio/login");
}

export async function bootstrapStudioOwnerAction(_prev: AuthState, fd: FormData): Promise<AuthState> {
  if (countUsers() > 0) return { error: "Setup is already complete." };
  const parsed = SetupSchema.safeParse({
    email: fd.get("email"),
    password: fd.get("password"),
    name: fd.get("name"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const hash = await hashPassword(parsed.data.password);
  const id = createUser({ email: parsed.data.email, password_hash: hash, name: parsed.data.name, role: "owner" });
  const sess = createSession(id);
  const c = await cookies();
  c.set(SESSION_COOKIE, sess.id, {
    httpOnly: true, sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(sess.expires_at), path: "/",
  });
  logAudit({ user_id: id, action: "bootstrap_owner", entity: "user", entity_id: String(id) });
  redirect("/studio");
}
