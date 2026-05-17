"use server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { rateLimit, resetRateLimit } from "../../lib/admin/rate-limit";
import {
  CUSTOMER_SESSION_COOKIE,
  CUSTOMER_COOKIE_OPTIONS,
  hashPassword,
  verifyPassword,
  startSession,
  safeNextPath,
} from "../../lib/storefront/auth";
import { getCurrentCustomer } from "../../lib/storefront/session";
import {
  createAccount,
  getCustomerAuthByEmail,
  destroyCustomerSession,
} from "../../lib/admin/repos/customer-auth";
import { logAudit } from "../../lib/admin/repos/audit";
import { getDb } from "../../lib/admin/db";

export type AuthState = {
  error?: string;
  ok?: boolean;
  /** Submitted values echoed back so the form survives a validation error.
   *  Never includes the password. */
  values?: { first_name?: string; last_name?: string; email?: string; phone?: string };
};

/** Join every zod issue into one human message so the form reports all
 *  problems at once instead of one-at-a-time across resubmits. */
function zodMessage(err: import("zod").ZodError): string {
  const msgs = [...new Set(err.issues.map(i => i.message))];
  return msgs.join(" · ") || "Please complete the form.";
}

// A fixed invalid bcrypt hash so a missing/guest account still costs one
// bcrypt compare — defeats email-enumeration via response timing.
const DUMMY_HASH = "$2a$12$invalidinvalidinvalidinvaliduO0000000000000000000000000000";

const SignUpSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(60),
  last_name: z.string().min(1, "Last name is required").max(60),
  email: z.string().email("Enter a valid email").max(160),
  phone: z.string().max(40).optional().default(""),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  next: z.string().optional(),
});

const SignInSchema = z.object({
  email: z.string().email("Enter a valid email").max(160),
  password: z.string().min(1, "Password is required").max(200),
  next: z.string().optional(),
});

async function reqMeta() {
  const h = await headers();
  return {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local",
    ua: h.get("user-agent") || null,
  };
}

async function setSessionCookie(customerId: number, ip: string, ua: string | null) {
  const sess = startSession(customerId, ip, ua);
  const c = await cookies();
  c.set(CUSTOMER_SESSION_COOKIE, sess.id, {
    ...CUSTOMER_COOKIE_OPTIONS,
    expires: new Date(sess.expires_at),
  });
}

export async function signUpAction(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const { ip, ua } = await reqMeta();
  // Echo back everything except the password so a rejected form keeps its state.
  const submitted = {
    first_name: String(fd.get("first_name") ?? ""),
    last_name: String(fd.get("last_name") ?? ""),
    email: String(fd.get("email") ?? ""),
    phone: String(fd.get("phone") ?? ""),
  };
  if (!rateLimit(`cust-signup:${ip}`, 6, 60 * 60 * 1000).ok) {
    return { error: "Too many attempts. Please try again later.", values: submitted };
  }
  const parsed = SignUpSchema.safeParse({
    ...submitted,
    password: fd.get("password") ?? "",
    next: fd.get("next") ?? undefined,
  });
  if (!parsed.success) {
    return { error: zodMessage(parsed.error), values: submitted };
  }

  let customerId: number;
  try {
    customerId = createAccount({
      email: parsed.data.email,
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      phone: parsed.data.phone || null,
      password_hash: await hashPassword(parsed.data.password),
    });
  } catch (err) {
    if ((err as Error).message === "ACCOUNT_EXISTS") {
      return { error: "An account with this email already exists. Please sign in.", values: submitted };
    }
    throw err;
  }

  await setSessionCookie(customerId, ip, ua);
  logAudit({
    user_id: null,
    action: "customer_signup",
    entity: "customer",
    entity_id: String(customerId),
  });
  redirect(safeNextPath(parsed.data.next));
}

export async function signInAction(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const { ip, ua } = await reqMeta();
  const email = String(fd.get("email") ?? "");
  const parsed = SignInSchema.safeParse({
    email,
    password: fd.get("password") ?? "",
    next: fd.get("next") ?? undefined,
  });
  if (!parsed.success) return { error: "Enter a valid email and password.", values: { email } };

  const rlKey = `cust-signin:${ip}:${parsed.data.email.toLowerCase()}`;
  const rl = rateLimit(rlKey, 10, 15 * 60 * 1000);
  if (!rl.ok) {
    return { error: `Too many attempts. Try again in ${Math.ceil(rl.retryAfterSec / 60)} min.`, values: { email } };
  }

  const account = getCustomerAuthByEmail(parsed.data.email);
  const hashForCompare = account?.password_hash ?? DUMMY_HASH;
  const ok = await verifyPassword(parsed.data.password, hashForCompare);
  if (!account || !account.password_hash || !ok) {
    return { error: "No account matches those credentials.", values: { email } };
  }

  resetRateLimit(rlKey);
  await setSessionCookie(account.id, ip, ua);
  logAudit({
    user_id: null,
    action: "customer_signin",
    entity: "customer",
    entity_id: String(account.id),
  });
  redirect(safeNextPath(parsed.data.next));
}

export async function signOutAction(): Promise<void> {
  const c = await cookies();
  const sid = c.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (sid) destroyCustomerSession(sid);
  c.delete(CUSTOMER_SESSION_COOKIE);
  redirect("/");
}

const ProfileSchema = z.object({
  first_name: z.string().min(1).max(60),
  last_name: z.string().min(1).max(60),
  phone: z.string().max(40).optional().default(""),
  city: z.string().max(80).optional().default(""),
});

export async function updateProfileAction(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const me = await getCurrentCustomer();
  if (!me) return { error: "Please sign in." };
  const parsed = ProfileSchema.safeParse({
    first_name: fd.get("first_name") ?? "",
    last_name: fd.get("last_name") ?? "",
    phone: fd.get("phone") ?? "",
    city: fd.get("city") ?? "",
  });
  if (!parsed.success) return { error: "Please check the form." };
  getDb()
    .prepare("UPDATE customers SET first_name = ?, last_name = ?, phone = ?, city = ? WHERE id = ?")
    .run(parsed.data.first_name, parsed.data.last_name, parsed.data.phone || null, parsed.data.city || null, me.id);
  logAudit({
    user_id: null,
    action: "customer_profile_update",
    entity: "customer",
    entity_id: String(me.id),
  });
  return { ok: true };
}
