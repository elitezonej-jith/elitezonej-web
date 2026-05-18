import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// Short-lived HMAC token that binds a checkout-flow action / receipt view to
// the browser that actually created the order. It does NOT replace the
// Razorpay signature (which proves payment) — it closes the IDOR where any
// visitor could read another order's PII via ?o= or flip another order to
// paid via confirmMockPayment with only the order id.
//
// 2h TTL: long enough to complete payment and land on the receipt, short
// enough that a leaked URL stops working quickly.
const TTL_MS = 2 * 60 * 60 * 1000;

let cachedSecret: string | null = null;
function secret(): string {
  if (cachedSecret) return cachedSecret;
  const env = process.env.CHECKOUT_TOKEN_SECRET;
  if (env && env.length >= 16) {
    cachedSecret = env;
    return cachedSecret;
  }
  // No configured secret: use a per-process random one. Tokens then stay
  // valid for the lifetime of an instance — which covers the same-session
  // checkout → receipt flow — but do not survive a restart. That is
  // acceptable here because in the documented serverless in-memory mode the
  // orders themselves do not survive a restart either.
  cachedSecret = randomBytes(32).toString("hex");
  console.error(
    "[checkout-token] CHECKOUT_TOKEN_SECRET is not set — using an ephemeral " +
      "per-process secret. In a multi-instance deployment, offline/mock " +
      "confirmation links issued by one instance will FAIL on another. Set " +
      "CHECKOUT_TOKEN_SECRET in any non-ephemeral deployment.",
  );
  return cachedSecret;
}

function sign(orderId: string, exp: number): string {
  return createHmac("sha256", secret())
    .update(`${orderId}.${exp}`)
    .digest("base64url");
}

export function issueOrderToken(orderId: string): string {
  const exp = Date.now() + TTL_MS;
  return `${exp}.${sign(orderId, exp)}`;
}

export function verifyOrderToken(
  orderId: string,
  token: string | null | undefined,
): boolean {
  if (!token || typeof token !== "string") return false;
  const dot = token.indexOf(".");
  if (dot < 1) return false;
  const exp = Number(token.slice(0, dot));
  const mac = token.slice(dot + 1);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = Buffer.from(sign(orderId, exp));
  const got = Buffer.from(mac);
  if (expected.length !== got.length) return false;
  return timingSafeEqual(expected, got);
}
