import "server-only";
import { getDb } from "../db";

/**
 * Records a processed payment-gateway webhook event. Returns `true` only the
 * first time a given `eventId` is seen; subsequent calls (provider retries /
 * replays) return `false` so the caller can no-op idempotently.
 */
export function recordWebhookEvent(
  eventId: string,
  provider: string,
  eventType: string | null,
): boolean {
  const r = getDb()
    .prepare(
      `INSERT OR IGNORE INTO webhook_events (event_id, provider, event_type)
       VALUES (?, ?, ?)`,
    )
    .run(eventId, provider, eventType);
  return r.changes === 1;
}

/** Returns the order id a prior checkout submission with this key created,
 *  or null if the key is new. */
export function getCheckoutIdempotency(key: string): string | null {
  const row = getDb()
    .prepare("SELECT order_id FROM checkout_idempotency WHERE key = ?")
    .get(key) as { order_id: string } | undefined;
  return row?.order_id ?? null;
}

/** Records key → order_id once; ignores a repeat (the first writer wins). */
export function putCheckoutIdempotency(key: string, orderId: string): void {
  getDb()
    .prepare(
      "INSERT OR IGNORE INTO checkout_idempotency (key, order_id) VALUES (?, ?)",
    )
    .run(key, orderId);
}
