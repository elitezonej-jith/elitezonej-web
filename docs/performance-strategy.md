# Performance Strategy

## Hot paths
- **`startCheckout`** — O(lines) prepared-statement reads (product + inventory/colour per line) + 1 insert tx + 1 outbound Razorpay call. Lines capped at 50. Razorpay call is the only network latency; everything else is local SQLite (sub-ms).
- **`fulfilOrderPaid`** — single transaction, O(items) conditional updates. No N+1: statements prepared once per call.
- **Webhook** — verify + one indexed lookup (`uq_payments_provider_order`) + one tx. Returns 200 fast so Razorpay doesn't retry-storm.

## Indexing (added/relied upon)
- `uq_payments_provider_order` — O(1) webhook/callback → order resolution.
- `idx_payments_order`, existing `idx_orders_*`, `inventory` PK `(product_slug,size)`, `idx_fabric_colours_slug` — all checkout lookups are index-served.

## Caching
- Storefront catalog/home reads already use the existing repo layer; no change. The commerce write path is intentionally **not** cached (correctness > latency for money/stock).
- Schema SQL is read once at module load (existing pattern preserved), not per request.

## Serverless considerations
- `better-sqlite3` is synchronous and fast; the dominant cost is the Razorpay HTTPS round-trip — unavoidable and user-expected during "Preparing…".
- Razorpay `checkout.js` is lazy-loaded only when a gateway order exists (no third-party JS on the page until the user pays).
- Fluid Compute keeps the function warm; the global DB handle (`global.__ezj_admin_db`) is reused across invocations.

## Scale ceiling & next steps (when needed)
- SQLite single-writer is fine to thousands of orders/day. Beyond that: migrate to Postgres (repo interface unchanged), move rate-limit + idempotency keys to Redis, and process webhooks via a queue (Vercel Queues) for spike absorption.
