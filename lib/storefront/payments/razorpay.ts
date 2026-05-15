import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const API = "https://api.razorpay.com/v1";

function keys() {
  const id = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!id || !secret) return null;
  return { id, secret };
}

export function razorpayConfigured(): boolean {
  return keys() != null;
}

/** Creates a Razorpay order. `amount` is rupees; converted to paise here only. */
export async function createRazorpayOrder(args: {
  amount: number;
  receipt: string;
}): Promise<{ id: string }> {
  const k = keys();
  if (!k) throw new Error("Razorpay not configured");
  const auth = Buffer.from(`${k.id}:${k.secret}`).toString("base64");
  const res = await fetch(`${API}/orders`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: Math.round(args.amount * 100),
      currency: "INR",
      receipt: args.receipt,
      payment_capture: 1,
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Razorpay order failed (${res.status}): ${t.slice(0, 200)}`);
  }
  const json = (await res.json()) as { id: string };
  return { id: json.id };
}

function safeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** Verifies the checkout callback signature: HMAC_SHA256(order_id|payment_id). */
export function verifyCheckoutSignature(args: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}): boolean {
  const k = keys();
  if (!k) return false;
  const expected = createHmac("sha256", k.secret)
    .update(`${args.razorpayOrderId}|${args.razorpayPaymentId}`)
    .digest("hex");
  return safeEqualHex(expected, args.signature);
}

/** Verifies a webhook payload against the raw request body. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}

export function publicKeyId(): string {
  return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "";
}
