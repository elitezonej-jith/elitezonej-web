"use server";
import { headers } from "next/headers";
import { z } from "zod";
import { priceCart, type CartLineInput } from "../../lib/storefront/checkout";
import { createProviderOrder } from "../../lib/storefront/payments";
import {
  verifyCheckoutSignature,
  razorpayConfigured,
  fetchRazorpayPayment,
  amountMatches,
  publicKeyId,
} from "../../lib/storefront/payments/razorpay";
import {
  createPendingOrder,
  fulfilOrderPaid,
  getOrder,
} from "../../lib/admin/repos/orders";
import { createPayment, getPaymentByProviderOrderId, getPaymentsForOrder } from "../../lib/admin/repos/payments";
import {
  getCheckoutIdempotency,
  putCheckoutIdempotency,
} from "../../lib/admin/repos/webhook-events";
import { logAudit } from "../../lib/admin/repos/audit";
import { rateLimit } from "../../lib/admin/rate-limit";
import { issueOrderToken, verifyOrderToken } from "../../lib/storefront/checkout-token";

const LineSchema = z.object({
  slug: z.string().min(1).max(160),
  qty: z.number().positive().max(999),
  size: z.string().max(40).nullish(),
  colour: z.string().max(80).nullish(),
  isFabric: z.boolean().optional(),
});

const CheckoutSchema = z.object({
  email: z.string().email("A valid email is required").max(160),
  phone: z.string().min(6, "Phone number is required").max(40),
  first_name: z.string().min(1, "First name is required").max(60),
  last_name: z.string().min(1, "Last name is required").max(60),
  ship_line1: z.string().trim().min(1, "Enter your address").max(200),
  ship_line2: z.string().max(200).optional().default(""),
  ship_city: z.string().min(1, "City is required").max(80),
  ship_state: z.string().min(1, "State is required").max(80),
  ship_pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  promo_code: z.string().max(40).optional().default(""),
});

export type CheckoutStartState = {
  ok?: boolean;
  error?: string;
  /** Per-field validation messages, keyed by CheckoutSchema field name.
   *  Additive — `error` (above) is still set for the summary alert. */
  fieldErrors?: Partial<Record<keyof typeof CheckoutSchema.shape, string>>;
  orderId?: string;
  provider?: "razorpay" | "offline";
  amount?: number;
  razorpay?: { keyId: string; providerOrderId: string };
  pricing?: { subtotal: number; discount: number; shipping: number; tax: number; total: number };
  /** Binds the receipt view and sandbox-pay to the browser that created this
   *  order — closes the ?o= IDOR (PII leak / unauth order-paid). */
  token?: string;
};

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

/** Rebuilds the start state for an order a prior submission already created
 *  (double-click / retry of the same idempotency key). Returns null if the
 *  order can't be safely resumed, so the caller degrades to creating fresh. */
function resumeCheckout(orderId: string): CheckoutStartState | null {
  const order = getOrder(orderId);
  if (!order) return null;
  const orow = order as unknown as Record<string, unknown>;
  if (orow.payment_status === "paid") {
    return { error: "This order has already been paid.", orderId };
  }
  const pay = getPaymentsForOrder(orderId)[0];
  if (!pay) return null;
  const pricing = {
    subtotal: Number(order.subtotal ?? 0),
    discount: Number(orow.discount ?? 0),
    shipping: Number(orow.shipping ?? 0),
    tax: Number(order.tax ?? 0),
    total: Number(order.total ?? 0),
  };
  return {
    ok: true,
    orderId,
    token: issueOrderToken(orderId),
    provider: pay.provider,
    amount: pricing.total,
    razorpay:
      pay.provider === "razorpay" && pay.provider_order_id
        ? { keyId: publicKeyId(), providerOrderId: pay.provider_order_id }
        : undefined,
    pricing,
  };
}

export async function startCheckout(
  _prev: CheckoutStartState,
  fd: FormData,
): Promise<CheckoutStartState> {
  const ip = await clientIp();
  const rl = rateLimit(`checkout:${ip}`, 8, 10 * 60 * 1000);
  if (!rl.ok) return { error: "Too many attempts. Please wait a few minutes and retry." };

  let rawLines: unknown;
  try {
    rawLines = JSON.parse(String(fd.get("cart") ?? "[]"));
  } catch {
    return { error: "Your bag could not be read. Please refresh and try again." };
  }
  const linesParsed = z.array(LineSchema).max(50).safeParse(rawLines);
  if (!linesParsed.success || linesParsed.data.length === 0) {
    return { error: "Your bag is empty." };
  }

  const form = CheckoutSchema.safeParse({
    email: fd.get("email") ?? "",
    phone: fd.get("phone") ?? "",
    first_name: fd.get("first_name") ?? "",
    last_name: fd.get("last_name") ?? "",
    ship_line1: fd.get("ship_line1") ?? "",
    ship_line2: fd.get("ship_line2") ?? "",
    ship_city: fd.get("ship_city") ?? "",
    ship_state: fd.get("ship_state") ?? "",
    ship_pincode: fd.get("ship_pincode") ?? "",
    promo_code: fd.get("promo_code") ?? "",
  });
  if (!form.success) {
    const flat = z.flattenError(form.error);
    const fieldErrors = Object.fromEntries(
      Object.entries(flat.fieldErrors).map(([k, msgs]) => [k, msgs?.[0] ?? ""]),
    ) as Partial<Record<keyof typeof CheckoutSchema.shape, string>>;
    return {
      error: form.error.issues[0]?.message ?? "Please complete the form.",
      fieldErrors,
    };
  }

  // Idempotency: a double-click / network retry carrying the same key resumes
  // the order it already created instead of duplicating order + gateway order.
  const idemKey = String(fd.get("idempotency_key") ?? "").slice(0, 80);
  if (idemKey) {
    const existing = getCheckoutIdempotency(idemKey);
    if (existing) {
      const resumed = resumeCheckout(existing);
      if (resumed) return resumed;
      // Couldn't safely resume → fall through and create fresh (no worse
      // than pre-idempotency behaviour).
    }
  }

  const priced = priceCart(linesParsed.data as CartLineInput[], form.data.promo_code);
  if (!priced.ok) return { error: priced.error };

  const orderId = createPendingOrder({
    contact: {
      email: form.data.email,
      first_name: form.data.first_name,
      last_name: form.data.last_name,
      phone: form.data.phone,
      ship_line1: form.data.ship_line1,
      ship_line2: form.data.ship_line2,
      ship_city: form.data.ship_city,
      ship_state: form.data.ship_state,
      ship_pincode: form.data.ship_pincode,
      ship_country: "India",
    },
    lines: priced.lines,
    pricing: priced.pricing,
  });

  let provider: "razorpay" | "offline" = "offline";
  let providerOrderId: string | null = null;
  let keyId = "";
  try {
    const po = await createProviderOrder({
      amount: priced.pricing.total,
      receipt: orderId,
    });
    provider = po.provider;
    providerOrderId = po.providerOrderId;
    keyId = po.publicKey ?? "";
  } catch (err) {
    logAudit({
      user_id: null,
      action: "checkout_provider_error",
      entity: "order",
      entity_id: orderId,
      payload: { message: (err as Error).message },
    });
    return {
      error: "Payment could not be initialised. Please try again shortly.",
      orderId,
    };
  }

  createPayment({
    order_id: orderId,
    provider,
    provider_order_id: providerOrderId,
    amount: priced.pricing.total,
  });

  if (idemKey) putCheckoutIdempotency(idemKey, orderId);

  logAudit({
    user_id: null,
    action: "checkout_started",
    entity: "order",
    entity_id: orderId,
    payload: { provider, total: priced.pricing.total, promo: priced.pricing.promo_code },
  });

  return {
    ok: true,
    orderId,
    token: issueOrderToken(orderId),
    provider,
    amount: priced.pricing.total,
    razorpay:
      provider === "razorpay" && providerOrderId
        ? { keyId, providerOrderId }
        : undefined,
    pricing: {
      subtotal: priced.pricing.subtotal,
      discount: priced.pricing.discount,
      shipping: priced.pricing.shipping,
      tax: priced.pricing.tax,
      total: priced.pricing.total,
    },
  };
}

export type PreviewState = {
  ok?: boolean;
  error?: string;
  promoApplied?: boolean;
  promoMessage?: string;
  pricing?: { subtotal: number; discount: number; shipping: number; tax: number; total: number; promo_code: string | null };
};

/** Price the cart (optionally with a promo) WITHOUT creating an order, so the
 *  checkout summary can show the discount/shipping/total and confirm whether a
 *  promo code was accepted before the customer reaches the payment screen
 *  (QA-011). Read-only and idempotent. */
export async function previewPricing(
  _prev: PreviewState,
  fd: FormData,
): Promise<PreviewState> {
  let rawLines: unknown;
  try {
    rawLines = JSON.parse(String(fd.get("cart") ?? "[]"));
  } catch {
    return { ok: false, error: "Your bag could not be read." };
  }
  const linesParsed = z.array(LineSchema).max(50).safeParse(rawLines);
  if (!linesParsed.success || linesParsed.data.length === 0) {
    return { ok: false, error: "Your bag is empty." };
  }
  const promo = String(fd.get("promo_code") ?? "").trim();

  // Price once with the promo to learn whether it was accepted, and once
  // without so a rejected code still yields a usable (undiscounted) summary.
  const withPromo = priceCart(linesParsed.data as CartLineInput[], promo || null);
  if (!withPromo.ok) {
    const base = priceCart(linesParsed.data as CartLineInput[], null);
    if (!base.ok) return { ok: false, error: base.error };
    return {
      ok: true,
      promoApplied: false,
      promoMessage: promo ? withPromo.error : undefined,
      pricing: {
        subtotal: base.pricing.subtotal,
        discount: base.pricing.discount,
        shipping: base.pricing.shipping,
        tax: base.pricing.tax,
        total: base.pricing.total,
        promo_code: null,
      },
    };
  }

  const applied = !!promo && withPromo.pricing.promo_code != null;
  return {
    ok: true,
    promoApplied: applied,
    promoMessage: applied ? `Code ${withPromo.pricing.promo_code} applied.` : undefined,
    pricing: {
      subtotal: withPromo.pricing.subtotal,
      discount: withPromo.pricing.discount,
      shipping: withPromo.pricing.shipping,
      tax: withPromo.pricing.tax,
      total: withPromo.pricing.total,
      promo_code: withPromo.pricing.promo_code,
    },
  };
}

export type ConfirmState = { ok: boolean; orderId?: string; error?: string };

export async function confirmPayment(input: {
  orderId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<ConfirmState> {
  const orderId = String(input.orderId ?? "");
  if (!orderId) return { ok: false, error: "Missing order reference." };

  // The provider order id is the trust anchor — it ties the signed callback
  // back to the payment row we created server-side.
  const payment = getPaymentByProviderOrderId(input.razorpay_order_id);
  if (!payment || payment.order_id !== orderId) {
    return { ok: false, error: "Payment record not found." };
  }

  const valid = verifyCheckoutSignature({
    razorpayOrderId: input.razorpay_order_id,
    razorpayPaymentId: input.razorpay_payment_id,
    signature: input.razorpay_signature,
  });
  if (!valid) {
    logAudit({
      user_id: null,
      action: "payment_signature_invalid",
      entity: "order",
      entity_id: orderId,
    });
    return { ok: false, error: "Payment verification failed. You were not charged twice." };
  }

  // Reconcile the captured amount/currency — the signature proves the
  // payment belongs to this order but does NOT cover the amount. The webhook
  // is the authoritative path; here we refuse only on a *confirmed* mismatch
  // and otherwise proceed (a fetch failure falls back to the webhook).
  const gw = await fetchRazorpayPayment(input.razorpay_payment_id);
  if (gw && (!amountMatches(payment.amount, gw.amount) || gw.currency !== payment.currency)) {
    logAudit({
      user_id: null,
      action: "payment_amount_mismatch",
      entity: "order",
      entity_id: orderId,
      payload: {
        expected_paise: Math.round(payment.amount * 100),
        gateway_paise: gw.amount,
        expected_currency: payment.currency,
        gateway_currency: gw.currency,
      },
    });
    return { ok: false, error: "Payment amount could not be verified. Please contact us — you have not been charged twice." };
  }

  const result = fulfilOrderPaid(orderId, {
    providerPaymentId: input.razorpay_payment_id,
  });
  if (!result.ok) return { ok: false, error: result.error };

  logAudit({
    user_id: null,
    action: result.alreadyPaid ? "payment_confirm_idempotent" : "order_paid",
    entity: "order",
    entity_id: orderId,
    payload: { payment_id: input.razorpay_payment_id },
  });
  return { ok: true, orderId };
}

// ── Sandbox payment ─────────────────────────────────────────────────────────
// Simulated gateway used only while no real Razorpay keys are configured. The
// instant `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` are set, `activeProvider()`
// returns "razorpay", the storefront opens the real Razorpay modal, and this
// action hard-refuses — so dropping in live keys needs no other change.
export async function confirmMockPayment(input: {
  orderId: string;
  token: string;
}): Promise<ConfirmState> {
  if (razorpayConfigured()) {
    return { ok: false, error: "Sandbox is disabled — the live gateway is active." };
  }
  const ip = await clientIp();
  if (!rateLimit(`mockpay:${ip}`, 20, 10 * 60 * 1000).ok) {
    return { ok: false, error: "Too many attempts. Please wait a moment." };
  }

  const orderId = String(input.orderId ?? "");
  if (!orderId) return { ok: false, error: "Missing order reference." };

  // Bind to the checkout that created this order — without this any visitor
  // could POST an arbitrary order id and flip it to paid (IDOR).
  if (!verifyOrderToken(orderId, input.token)) {
    return { ok: false, error: "This payment session is invalid or has expired." };
  }

  const order = getOrder(orderId);
  if (!order) return { ok: false, error: "Order not found." };
  if (order.payment_status === "paid") {
    return { ok: true, orderId };
  }
  if (order.payment_status !== "pending") {
    return { ok: false, error: "This order can no longer be paid." };
  }

  const result = fulfilOrderPaid(orderId, {
    providerPaymentId: `mock_${crypto.randomUUID().replace(/-/g, "").slice(0, 18)}`,
  });
  if (!result.ok) return { ok: false, error: result.error };

  logAudit({
    user_id: null,
    action: result.alreadyPaid ? "mock_payment_idempotent" : "mock_payment_paid",
    entity: "order",
    entity_id: orderId,
    payload: { mode: "sandbox" },
  });
  return { ok: true, orderId };
}
