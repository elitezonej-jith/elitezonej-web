# Performance Strategy

## Hot paths
- **`startCheckout`** — O(lines) prepared-statement reads (product + inventory/colour per line) + 1 insert tx + 1 outbound Razorpay call. Lines capped at 50. Razorpay call is the only network latency; everything else is local SQLite (sub-ms).
- **`fulfilOrderPaid`** — single transaction, O(items) conditional updates. No N+1: statements prepared once per call.
- **Webhook** — verify + one indexed lookup (`uq_payments_provider_order`) + one tx. Returns 200 fast so Razorpay doesn't retry-storm.

## Indexing (added/relied upon)
- `uq_payments_provider_order` — O(1) webhook/callback → order resolution.
- `idx_payments_order`, existing `idx_orders_*`, `inventory` PK `(product_slug,size)`, `idx_fabric_colours_slug` — all checkout lookups are index-served.

## Caching
- **Homepage (`/`)**: ISR, `revalidate = 60`. Studio saves call `revalidatePath("/")`. The build prerenders it, so the build needs `DB_DRIVER=postgres` + `DATABASE_URL` (Production has both; Preview lacks `DB_DRIVER`).
- **Product pages (`/products/[slug]`)**: ISR, `revalidate = 300`, rendered on first visit (`generateStaticParams` returns `[]`). Review eligibility is per-visitor, so it is fetched from `/api/reviews/eligibility` in the browser; the page itself must not read cookies.
- **Search index**: `/api/search-index`, CDN-cached 5 min, loaded only when a visitor uses search.
- **Images**: `/api/img` resizes Blob uploads and `/generated/` images to allow-listed widths (`lib/image-widths.ts`); CDN-cached for a year. Falls back to the original on error.
- Storefront catalog reads use `unstable_cache` in the repo layer. The commerce write path is intentionally **not** cached (correctness > latency for money/stock).

## Front-end budget (enforced in CI by `lighthouserc.json`)
- CI (`.github/workflows/lighthouse.yml`) builds the site, warms the image resizer (`.github/perf/warmup.mjs`, mimicking the CDN), then runs Lighthouse mobile 5× on `/`, `/collection?c=men` and a product page.
- Fails the PR if the median performance score < 0.65, Total Blocking Time > 400 ms or CLS > 0.1; warns if LCP > 6.5 s or page weight > 1.4 MB. Thresholds sit below current results (≈73–81) so only real regressions fail; tighten them as the site gets faster.
- See "Performance rules" in AGENTS.md for the coding rules that keep it there.
- Schema SQL is read once at module load (existing pattern preserved), not per request.

## Serverless considerations
- `better-sqlite3` is synchronous and fast; the dominant cost is the Razorpay HTTPS round-trip — unavoidable and user-expected during "Preparing…".
- Razorpay `checkout.js` is lazy-loaded only when a gateway order exists (no third-party JS on the page until the user pays).
- Fluid Compute keeps the function warm; the global DB handle (`global.__ezj_admin_db`) is reused across invocations.

## Scale ceiling & next steps (when needed)
- SQLite single-writer is fine to thousands of orders/day. Beyond that: migrate to Postgres (repo interface unchanged), move rate-limit + idempotency keys to Redis, and process webhooks via a queue (Vercel Queues) for spike absorption.
