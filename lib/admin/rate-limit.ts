import "server-only";
// Lightweight in-memory fixed-window rate limiter. Process-local — good
// enough for single-instance / serverless-warm protection against brute
// force and form spam. For multi-region scale, back this with Redis.

type Bucket = { count: number; resetAt: number };

declare global {
  // eslint-disable-next-line no-var
  var __ezj_rate_buckets: Map<string, Bucket> | undefined;
}

const buckets: Map<string, Bucket> =
  global.__ezj_rate_buckets ?? (global.__ezj_rate_buckets = new Map());

export type RateResult = { ok: boolean; retryAfterSec: number };

export function rateLimit(key: string, max: number, windowMs: number): RateResult {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }
  if (b.count >= max) {
    return { ok: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

export function resetRateLimit(key: string): void {
  buckets.delete(key);
}
