import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature, amountMatches } from "../../../../lib/storefront/payments/razorpay";
import { getPaymentByProviderOrderId } from "../../../../lib/admin/repos/payments";
import { markOrderPaymentFailed, markOrderRefunded } from "../../../../lib/admin/repos/orders";
import { recordWebhookEvent, forgetWebhookEvent } from "../../../../lib/admin/repos/webhook-events";
import { settleCapturedPayment } from "../../../../lib/storefront/payments/settle";
import { logAudit } from "../../../../lib/admin/repos/audit";

// Node runtime: needs the raw body + node:crypto for HMAC verification.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhookSignature(raw, sig)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: {
      payment?: { entity?: { id?: string; order_id?: string; amount?: number; currency?: string } };
      order?: { entity?: { id?: string; amount?: number; currency?: string } };
      refund?: { entity?: { id?: string; payment_id?: string; amount?: number } };
    };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad payload" }, { status: 400 });
  }

  // Idempotency: one row per provider event id. A retry/replay is a no-op.
  const eventId =
    req.headers.get("x-razorpay-event-id") ?? `sig:${sig.slice(0, 64)}`;
  if (!(await recordWebhookEvent(eventId, "razorpay", event.event ?? null))) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const pe = event.payload?.payment?.entity;
  const oe = event.payload?.order?.entity;
  const providerOrderId = pe?.order_id ?? oe?.id ?? "";
  const paymentId = pe?.id ?? null;
  const gatewayPaise = pe?.amount ?? oe?.amount ?? null;
  const gatewayCurrency = pe?.currency ?? oe?.currency ?? null;

  if (event.event === "payment.failed" && providerOrderId) {
    const payment = await getPaymentByProviderOrderId(providerOrderId);
    if (payment) {
      await markOrderPaymentFailed(payment.order_id);
      await logAudit({
        user_id: null,
        action: "payment_failed_webhook",
        entity: "order",
        entity_id: payment.order_id,
        payload: { event: event.event },
      });
    }
    return NextResponse.json({ received: true });
  }

  if (
    (event.event === "payment.captured" || event.event === "order.paid") &&
    providerOrderId
  ) {
    const payment = await getPaymentByProviderOrderId(providerOrderId);
    if (payment) {
      // Reconcile amount/currency — the signature does NOT cover the amount,
      // so a partial/mismatched capture must not fulfil the full order.
      const amountOk =
        gatewayPaise != null && amountMatches(payment.amount, gatewayPaise);
      const currencyOk =
        !gatewayCurrency || gatewayCurrency === payment.currency;
      if (!amountOk || !currencyOk) {
        await logAudit({
          user_id: null,
          action: "payment_amount_mismatch_webhook",
          entity: "order",
          entity_id: payment.order_id,
          payload: {
            event: event.event,
            expected_paise: Math.round(payment.amount * 100),
            gateway_paise: gatewayPaise,
            expected_currency: payment.currency,
            gateway_currency: gatewayCurrency,
          },
        });
        // 200 so Razorpay stops retrying a structurally-wrong event; the
        // mismatch is recorded for manual review and the order stays unpaid.
        return NextResponse.json({ received: true, reconciled: false });
      }

      // Idempotent — safe even if the client callback already fulfilled it.
      // Both events only fire once the payment is captured.
      const r = paymentId
        ? await settleCapturedPayment({
            orderId: payment.order_id,
            paymentId,
            source: "webhook",
          })
        : ({ kind: "retry", error: "order.paid without a payment entity" } as const);
      await logAudit({
        user_id: null,
        action:
          r.kind === "paid"
            ? "order_paid_webhook"
            : r.kind === "refunded"
              ? "order_refunded_webhook"
              : r.kind === "refund_in_progress"
                ? "order_refund_concurrent_webhook"
                : "order_paid_webhook_failed",
        entity: "order",
        entity_id: payment.order_id,
        payload: { event: event.event, result: r.kind, error: "error" in r ? r.error : undefined },
      });
      // Transient failure or a refund that didn't go through: un-record the
      // event and return 5xx so Razorpay retries (it backs off for ~24h).
      if (r.kind === "retry" || r.kind === "refund_failed") {
        await forgetWebhookEvent(eventId);
        return NextResponse.json({ received: false, retry: true }, { status: 500 });
      }
    }
  }

  // Full refund issued from the Razorpay dashboard → reflect it on the order
  // so Admin doesn't keep showing it as paid. Partial refunds are only logged.
  if (event.event === "refund.processed" && providerOrderId) {
    const re = event.payload?.refund?.entity;
    const payment = await getPaymentByProviderOrderId(providerOrderId);
    if (payment && re) {
      const full = amountMatches(payment.amount, Number(re.amount ?? 0));
      const changed = full ? await markOrderRefunded(payment.order_id) : false;
      await logAudit({
        user_id: null,
        action: full ? "order_refunded_dashboard" : "order_partial_refund",
        entity: "order",
        entity_id: payment.order_id,
        payload: { refund_id: re.id, refund_paise: re.amount, payment_id: re.payment_id, status_changed: changed },
      });
    }
  }

  // Always 200 after a valid signature so Razorpay stops retrying.
  return NextResponse.json({ received: true });
}
