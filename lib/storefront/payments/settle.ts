import "server-only";
import {
  fulfilOrderPaid,
  claimOrderForAutoRefund,
  revertAutoRefundClaim,
  getOrder,
} from "../../admin/repos/orders";
import { logAudit } from "../../admin/repos/audit";
import { refundRazorpayPayment } from "./razorpay";

export type SettleResult =
  /** Order confirmed (or already was). */
  | { kind: "paid"; alreadyPaid: boolean }
  /** Order can't be fulfilled; the customer's money has been refunded. */
  | { kind: "refunded" }
  /** Order can't be fulfilled; a concurrent callback/webhook owns the refund. */
  | { kind: "refund_in_progress" }
  /** Order can't be fulfilled and the refund call failed — retry / refund manually. */
  | { kind: "refund_failed"; error: string }
  /** Transient failure (e.g. DB unavailable) — safe to retry later. */
  | { kind: "retry"; error: string };

// fulfilOrderPaid throws this when stock ran out between checkout and payment.
// It's deterministic — retrying won't help — so the money must go back.
const UNFULFILLABLE = /^Insufficient stock/;

/**
 * Settles a payment that Razorpay has CAPTURED (money taken). Shared by the
 * client callback and the webhook so both paths behave identically:
 * fulfil the order, or — if it can no longer be fulfilled — refund in full
 * rather than keep money for an order that will never ship.
 */
export async function settleCapturedPayment(args: {
  orderId: string;
  paymentId: string;
  source: "callback" | "webhook";
}): Promise<SettleResult> {
  const { orderId, paymentId, source } = args;

  const r = await fulfilOrderPaid(orderId, { providerPaymentId: paymentId });
  if (r.ok) return { kind: "paid", alreadyPaid: r.alreadyPaid };
  if (!UNFULFILLABLE.test(r.error)) return { kind: "retry", error: r.error };

  // Exactly one of callback/webhook wins the claim and issues the refund.
  const claim = await claimOrderForAutoRefund(orderId);
  if (!claim) {
    const order = await getOrder(orderId);
    if (order?.payment_status === "paid") return { kind: "paid", alreadyPaid: true };
    return { kind: "refund_in_progress" };
  }

  const refund = await refundRazorpayPayment(paymentId, {
    order_id: orderId,
    reason: "out_of_stock_after_payment",
  });
  if ("error" in refund) {
    await revertAutoRefundClaim(orderId, claim.prevStatus);
    await logAudit({
      user_id: null,
      action: "auto_refund_failed",
      entity: "order",
      entity_id: orderId,
      payload: { source, payment_id: paymentId, stock_error: r.error, refund_error: refund.error },
    });
    return { kind: "refund_failed", error: refund.error };
  }

  await logAudit({
    user_id: null,
    action: "order_auto_refunded",
    entity: "order",
    entity_id: orderId,
    payload: { source, payment_id: paymentId, refund_id: refund.id, reason: r.error },
  });
  return { kind: "refunded" };
}
