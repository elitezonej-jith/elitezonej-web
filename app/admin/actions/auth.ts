"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  SESSION_COOKIE,
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
} from "../../../lib/admin/auth";
import { countUsers, createUser, getUserByEmail, getUserById, setUserPassword, touchLogin } from "../../../lib/admin/repos/users";
import { logAudit } from "../../../lib/admin/repos/audit";
import { requireRole, requireUser } from "../../../lib/admin/session";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  next: z.string().optional(),
});

const BootstrapSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "At least 8 characters"),
  name: z.string().min(2, "Tell us your name"),
});

export type ActionState = { error?: string; ok?: boolean };

export async function signInAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || "/admin",
  });
  if (!parsed.success) return { error: "Enter a valid email and password." };

  const u = getUserByEmail(parsed.data.email);
  if (!u) return { error: "No account matches those credentials." };

  const ok = await verifyPassword(parsed.data.password, u.password_hash);
  if (!ok) return { error: "No account matches those credentials." };

  const sess = createSession(u.id);
  const c = await cookies();
  c.set(SESSION_COOKIE, sess.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(sess.expires_at),
    path: "/",
  });
  touchLogin(u.id);
  logAudit({ user_id: u.id, action: "sign_in", entity: "user", entity_id: String(u.id) });

  redirect(parsed.data.next?.startsWith("/admin") ? parsed.data.next : "/admin");
}

export async function signOutAction(): Promise<void> {
  const c = await cookies();
  const sid = c.get(SESSION_COOKIE)?.value;
  if (sid) destroySession(sid);
  c.delete(SESSION_COOKIE);
  redirect("/admin/login");
}

export async function bootstrapOwnerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (countUsers() > 0) return { error: "Setup already complete." };
  const parsed = BootstrapSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const hash = await hashPassword(parsed.data.password);
  const id = createUser({ email: parsed.data.email, password_hash: hash, name: parsed.data.name, role: "owner" });
  const sess = createSession(id);
  const c = await cookies();
  c.set(SESSION_COOKIE, sess.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(sess.expires_at),
    path: "/",
  });
  logAudit({ user_id: id, action: "bootstrap_owner", entity: "user", entity_id: String(id) });
  redirect("/admin");
}

const InviteSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(["owner", "staff"]),
});

export async function inviteUserAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireRole("owner");
  const parsed = InviteSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: "Invalid input — email, name, password ≥ 8 chars." };
  if (getUserByEmail(parsed.data.email)) return { error: "Email already exists." };
  const hash = await hashPassword(parsed.data.password);
  const id = createUser({ ...parsed.data, password_hash: hash });
  logAudit({ user_id: me.id, action: "invite_user", entity: "user", entity_id: String(id), payload: { email: parsed.data.email, role: parsed.data.role } });
  return { ok: true };
}

export async function changePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireUser();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  if (next.length < 8) return { error: "New password must be at least 8 characters." };
  const u = getUserByEmail(me.email);
  if (!u) return { error: "Account not found." };
  const ok = await verifyPassword(current, u.password_hash);
  if (!ok) return { error: "Current password incorrect." };
  const hash = await hashPassword(next);
  setUserPassword(me.id, hash);
  logAudit({ user_id: me.id, action: "change_password", entity: "user", entity_id: String(me.id) });
  return { ok: true };
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  const me = await requireRole("owner");
  const id = Number(formData.get("id"));
  if (!id) return;
  const target = getUserById(id);
  if (!target) return;
  if (target.id === me.id) return;
  // Prevent deleting the only owner.
  if (target.role === "owner") {
    const owners = (await import("../../../lib/admin/repos/users")).listUsers().filter((u) => u.role === "owner");
    if (owners.length <= 1) return;
  }
  (await import("../../../lib/admin/repos/users")).deleteUser(id);
  logAudit({ user_id: me.id, action: "delete_user", entity: "user", entity_id: String(id) });
}
