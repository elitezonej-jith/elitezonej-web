# Production Runbook — Elite Zone J

Documentation only. This file lists the environment variables a **durable**
production deployment must set, and the by-design behaviour when persistence is
ephemeral. None of this changes application code.

## Required environment variables (durable production)

| Variable | Purpose | If unset |
|---|---|---|
| `RAZORPAY_KEY_ID` | Razorpay API key id (live mode). | Live payments cannot be created; checkout falls back to the disabled/sandbox path. |
| `RAZORPAY_KEY_SECRET` | Razorpay API secret. Used for order creation and checkout signature verification. | Same as above. |
| `RAZORPAY_WEBHOOK_SECRET` | HMAC secret for `POST /api/webhooks/razorpay`. The webhook **fail-closes** (HTTP 400, logged) when keys are live but this is unset, so paid orders are not reconciled via webhook. | Webhook rejects all events. The client `confirmPayment` callback still reconciles amount independently, but the webhook is the authoritative path — **set this before going live.** |
| `CHECKOUT_TOKEN_SECRET` | HMAC secret for the order-receipt / mock-pay token (closes the receipt IDOR). | Falls back to a **per-process random** secret: tokens do not validate across instances/restarts. Acceptable only in the ephemeral mode below; set a stable value for durable multi-instance prod. |
| `ADMIN_BOOTSTRAP_PASSWORD` | Initial owner password for the seeded `admin@elitezonej.com` account. | A random one-time password is generated and printed once to server logs on first DB seed; must be retrieved from logs or this var set. Min 8 chars. |

Optional: `IS_SERVERLESS=1` forces the ephemeral path off a non-Vercel host
(see below); normally inferred from `VERCEL=1`.

## By-design: ephemeral persistence (NOT a bug)

Per `AGENTS.md`/`CLAUDE.md`: on Vercel/serverless the SQLite file cannot
persist, so `lib/admin/db.ts` falls back to an **in-memory DB that resets on
every cold start**. In that mode:

- Orders, payments, sessions and Studio edits do **not** survive a cold start
  or redeploy.
- **Live payments are intentionally hard-disabled** via
  `isEphemeralPersistence()` — a deliberate money-safety guard, not a defect.
- The storefront still renders correctly: it seeds from the catalogue and
  Studio content shows, it simply does not durably retain operator mutations.

To run with durable data and live payments, deploy on a host with a persistent
filesystem (or the future Postgres path — currently a dormant, unimported stub
in `lib/db/sql.ts`) and set the variables above.

## Pre-go-live checklist

1. Set all five required variables (especially `RAZORPAY_WEBHOOK_SECRET`).
2. Confirm durable persistence (not the in-memory fallback).
3. Sign in as the seeded owner and rotate the bootstrap password.
4. Configure the Razorpay webhook endpoint to `/api/webhooks/razorpay` with the
   matching secret.
