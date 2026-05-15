# Task Tracker

Legend: `[ ]` pending · `[/]` in progress · `[x]` done

## Phase 1 — Schema & types  (P0)
- [x] `lib/admin/schema-v3.sql`: orders columns, `payments`, `newsletter_subscribers`
- [x] `applyV3()` wired into `db.ts` open()
- [x] Types: `Payment`, `NewsletterSubscriber`, extended `Order`

## Phase 2 — Repos  (P0)
- [x] `orders.createPendingOrder()` (order + items, snapshot address)
- [x] `orders.fulfilOrderPaid()` transactional (stock re-check, decrement, promo, customer totals)
- [x] `repos/payments.ts` (create / settle / get by provider order id)
- [x] `repos/newsletter.ts` (subscribe upsert, list)
- [x] promo usage increment + validity check helper

## Phase 3 — Pricing engine  (P0)
- [x] `lib/storefront/checkout.ts`: re-price from DB, promo apply, totals; stock pre-check

## Phase 4 — Payments  (P0)
- [x] `payments/index.ts` provider selection + interface
- [x] `payments/razorpay.ts` order create + signature/webhook verify (fetch + crypto)

## Phase 5 — Actions  (P0)
- [x] `app/checkout/actions.ts`: `startCheckout`, `confirmPayment`
- [x] `app/components/actions/newsletter.ts`: `subscribeNewsletter`

## Phase 6 — Webhook  (P1)
- [x] `app/api/webhooks/razorpay/route.ts`

## Phase 7 — Frontend wiring  (P1)
- [x] CheckoutClient: shipping form, promo field, Razorpay flow, offline fallback
- [x] `app/checkout/confirmation/page.tsx`
- [x] NewsletterForm → server action

## Phase 8 — QA / hardening  (P1)
- [x] Typecheck (`tsc --noEmit`) green
- [x] Security review doc, perf doc, deployment doc

## Blockers
None. Live payments require real Razorpay keys in env; offline mode covers absence.
