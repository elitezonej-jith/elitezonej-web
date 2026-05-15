import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "../../../../lib/storefront/payments/razorpay";
import { getPaymentByProviderOrderId } from "../../../../lib/admin/repos/payments";
import { fulfilOrderPaid } from "../../../../lib/admin/repos/orders";
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
      payment?: { entity?: { id?: string; order_id?: string } };
      order?: { entity?: { id?: string } };
    };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad payload" }, { status: 400 });
  }

  const providerOrderId =
    event.payload?.payment?.entity?.order_id ?? event.payload?.order?.entity?.id ?? "";
  const paymentId = event.payload?.payment?.entity?.id ?? null;

  if (
    (event.event === "payment.captured" || event.event === "order.paid") &&
    providerOrderId
  ) {
    const payment = getPaymentByProviderOrderId(providerOrderId);
    if (payment) {
      // Idempotent — safe even if the client callback already fulfilled it.
      const r = fulfilOrderPaid(payment.order_id, { providerPaymentId: paymentId });
      logAudit({
        user_id: null,
        action: r.ok ? "order_paid_webhook" : "order_paid_webhook_failed",
        entity: "order",
        entity_id: payment.order_id,
        payload: { event: event.event, ok: r.ok },
      });
    }
  }

  // Always 200 after a valid signature so Razorpay stops retrying.
  return NextResponse.json({ received: true });
}
