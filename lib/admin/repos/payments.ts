import "server-only";
import { randomUUID } from "node:crypto";
import { sql } from "../db";
import type { Payment } from "../types";

export async function createPayment(input: {
  order_id: string;
  provider: "razorpay" | "offline";
  provider_order_id: string | null;
  amount: number;
  currency?: string;
}): Promise<string> {
  const id = `pay_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
  // provider_order_id UNIQUE is enforced by the schema (0001_baseline), not
  // here — preserved across the migration.
  await sql.run(
    `INSERT INTO payments (id, order_id, provider, provider_order_id, amount, currency, status)
     VALUES (?, ?, ?, ?, ?, ?, 'created')`,
    [id, input.order_id, input.provider, input.provider_order_id, input.amount, input.currency ?? "INR"],
  );
  return id;
}

export async function getPaymentByProviderOrderId(
  providerOrderId: string,
): Promise<Payment | null> {
  return sql.get<Payment>(
    "SELECT * FROM payments WHERE provider_order_id = ?",
    [providerOrderId],
  );
}

export async function getPaymentsForOrder(orderId: string): Promise<Payment[]> {
  return sql.all<Payment>(
    "SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC",
    [orderId],
  );
}

export async function settlePayment(
  id: string,
  status: "paid" | "failed",
  providerPaymentId: string | null,
): Promise<void> {
  await sql.run(
    `UPDATE payments SET status = ?, provider_payment_id = COALESCE(?, provider_payment_id),
       updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [status, providerPaymentId, id],
  );
}
