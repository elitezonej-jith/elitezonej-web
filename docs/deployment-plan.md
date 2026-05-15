# Deployment Plan

## Environment variables (Vercel → Project → Settings → Environment Variables)
| Key | Scope | Notes |
|---|---|---|
| `RAZORPAY_KEY_ID` | server | from Razorpay dashboard (live keys for production) |
| `RAZORPAY_KEY_SECRET` | server | **secret** — never client |
| `RAZORPAY_WEBHOOK_SECRET` | server | set when creating the webhook |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | client | same as KEY_ID, exposed for checkout.js |
| `SHIPPING_FLAT_INR` / `FREE_SHIP_OVER_INR` / `TAX_RATE` | server | optional policy overrides |

Absent Razorpay keys ⇒ **offline mode** (orders persist as pending, WhatsApp confirmation). Safe default for preview deployments.

## Razorpay setup
1. Create webhook → URL `https://<domain>/api/webhooks/razorpay`, secret = `RAZORPAY_WEBHOOK_SECRET`.
2. Subscribe events: `payment.captured`, `order.paid`.
3. Test with Razorpay test keys before switching to live.

## ⚠️ Persistence (critical for production)
The app uses `better-sqlite3` with a **serverless in-memory fallback** (`db.ts`: `IS_SERVERLESS`). On Vercel that means **orders/payments are lost on cold start** — unacceptable for real payments.

Production options (pick one before going live):
1. Deploy on a host with a persistent writable disk (the `data/admin.db` file path already works there).
2. Migrate the repo layer to Postgres (Neon via Vercel Marketplace) — repo interfaces are isolated, so this is contained to `lib/admin/db.ts` + repo SQL dialect.

Recommended: option 2 for Vercel. Until then, run real payments only on a persistent-disk host.

## Pre-launch checklist
- [ ] Persistent DB chosen & provisioned (see above)
- [ ] Live Razorpay keys + webhook configured and event-tested
- [ ] Real brand contact in `lib/contact.ts` (WhatsApp number)
- [ ] `tsc --noEmit` and `next build` green in CI
- [ ] Smoke: place test order → pay (test card) → confirmation page → admin `/admin/orders` shows `confirmed`/paid, stock decremented, audit entries present
- [ ] Webhook idempotency verified (replay event → no double decrement)

## Rollback
Schema v3 is purely additive (new columns/tables) — reverting code leaves the DB intact and the admin panel unaffected. No down-migration required.
