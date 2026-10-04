import "server-only";
import { sql } from "../db";

/**
 * Records a processed payment-gateway webhook event. Returns `true` only the
 * first time a given `eventId` is seen; subsequent calls (provider retries /
 * replays) return `false` so the caller can no-op idempotently.
 *
 * `INSERT OR IGNORE` → `INSERT … ON CONFLICT (event_id) DO NOTHING` (portable;
 * valid on both better-sqlite3 and Postgres). Affected-row count is 1 on the
 * first insert and 0 on a conflicting replay — same semantics as the prior
 * `r.changes === 1`, so webhook idempotency is exactly preserved.
 */
export async function recordWebhookEvent(
  eventId: string,
  provider: string,
  eventType: string | null,
): Promise<boolean> {
  const r = await sql.run(
    `INSERT INTO webhook_events (event_id, provider, event_type)
     VALUES (?, ?, ?)
     ON CONFLICT (event_id) DO NOTHING`,
    [eventId, provider, eventType],
  );
  return r.count === 1;
}

/** Drops a recorded event so a provider retry is processed again. Used when
 *  handling failed transiently (e.g. DB unavailable) — otherwise the retry
 *  would be swallowed as a duplicate and a paid order never confirmed. */
export async function forgetWebhookEvent(eventId: string): Promise<void> {
  await sql.run("DELETE FROM webhook_events WHERE event_id = ?", [eventId]);
}

/** Returns the order id a prior checkout submission with this key created,
 *  or null if the key is new. */
export async function getCheckoutIdempotency(key: string): Promise<string | null> {
  const row = await sql.get<{ order_id: string }>(
    "SELECT order_id FROM checkout_idempotency WHERE key = ?",
    [key],
  );
  return row?.order_id ?? null;
}

/** Records key → order_id once; ignores a repeat (the first writer wins). */
export async function putCheckoutIdempotency(key: string, orderId: string): Promise<void> {
  await sql.run(
    `INSERT INTO checkout_idempotency (key, order_id) VALUES (?, ?)
     ON CONFLICT (key) DO NOTHING`,
    [key, orderId],
  );
}
