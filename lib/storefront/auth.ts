import "server-only";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import {
  createCustomerSession,
  getCustomerBySession,
  type SessionCustomer,
} from "../admin/repos/customer-auth";

const HASH_COST = 12;
const SESSION_TTL_DAYS = 30;
export const CUSTOMER_SESSION_COOKIE = "ezj_customer_session";

export const CUSTOMER_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
} as const;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, HASH_COST);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function startSession(
  customerId: number,
  ip?: string | null,
  ua?: string | null,
): { id: string; expires_at: string } {
  const id = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  createCustomerSession(customerId, ip ?? null, ua ?? null, id, expires.toISOString());
  return { id, expires_at: expires.toISOString() };
}

export function resolveCustomer(sessionId: string | undefined | null): SessionCustomer | null {
  if (!sessionId) return null;
  return getCustomerBySession(sessionId);
}

/** Only allow same-site relative redirects under the storefront. */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || typeof next !== "string") return "/account";
  if (!next.startsWith("/") || next.startsWith("//")) return "/account";
  if (/[\s\x00-\x1f]/.test(next)) return "/account";
  // Never bounce back into an auth page.
  if (next.startsWith("/login") || next.startsWith("/signup")) return "/account";
  return next;
}

export type { SessionCustomer };
