import "server-only";
import { randomUUID } from "node:crypto";
import { getDb } from "../db";
import type { Payment } from "../types";

export function createPayment(input: {
  order_id: string;
  provider: "razorpay" | "offline";
  provider_order_id: string | null;
  amount: number;
  currency?: string;
}): string {
  const id = `pay_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
  getDb()
    .prepare(
      `INSERT INTO payments (id, order_id, provider, provider_order_id, amount, currency, status)
       VALUES (?, ?, ?, ?, ?, ?, 'created')`,
    )
    .run(id, input.order_id, input.provider, input.provider_order_id, input.amount, input.currency ?? "INR");
  return id;
}

export function getPaymentByProviderOrderId(providerOrderId: string): Payment | null {
  return (
    (getDb()
      .prepare("SELECT * FROM payments WHERE provider_order_id = ?")
      .get(providerOrderId) as Payment | undefined) ?? null
  );
}

export function getPaymentsForOrder(orderId: string): Payment[] {
  return getDb()
    .prepare("SELECT * FROM payments WHERE order_id = ? ORDER BY datetime(created_at) DESC")
    .all(orderId) as Payment[];
}

export function settlePayment(
  id: string,
  status: "paid" | "failed",
  providerPaymentId: string | null,
): void {
  getDb()
    .prepare(
      `UPDATE payments SET status = ?, provider_payment_id = COALESCE(?, provider_payment_id),
       updated_at = datetime('now') WHERE id = ?`,
    )
    .run(status, providerPaymentId, id);
}
