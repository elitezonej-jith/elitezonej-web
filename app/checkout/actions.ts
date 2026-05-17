"use server";
import { headers } from "next/headers";
import { z } from "zod";
import { priceCart, type CartLineInput } from "../../lib/storefront/checkout";
import { createProviderOrder } from "../../lib/storefront/payments";
import {
  verifyCheckoutSignature,
  razorpayConfigured,
} from "../../lib/storefront/payments/razorpay";
import {
  createPendingOrder,
  fulfilOrderPaid,
  getOrder,
} from "../../lib/admin/repos/orders";
import { createPayment } from "../../lib/admin/repos/payments";
import { getPaymentByProviderOrderId } from "../../lib/admin/repos/payments";
import { logAudit } from "../../lib/admin/repos/audit";
import { rateLimit } from "../../lib/admin/rate-limit";

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
  ship_line1: z.string().min(3, "Address is required").max(200),
  ship_line2: z.string().max(200).optional().default(""),
  ship_city: z.string().min(1, "City is required").max(80),
  ship_state: z.string().min(1, "State is required").max(80),
  ship_pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  promo_code: z.string().max(40).optional().default(""),
});

export type CheckoutStartState = {
  ok?: boolean;
  error?: string;
  orderId?: string;
  provider?: "razorpay" | "offline";
  amount?: number;
  razorpay?: { keyId: string; providerOrderId: string };
  pricing?: { subtotal: number; discount: number; shipping: number; tax: number; total: number };
};

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
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
    return { error: form.error.issues[0]?.message ?? "Please complete the form." };
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
