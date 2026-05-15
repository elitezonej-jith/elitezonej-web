# Implementation Roadmap

| Phase | Deliverable | Status |
|---|---|---|
| 1 | Schema v3 (`schema-v3.sql`) + `applyV3` in `db.ts` + types | done |
| 2 | Repos: extend `orders` (createPendingOrder, fulfilOrderPaid txn), new `payments`, `newsletter`; promo usage increment | done |
| 3 | Pricing/promo engine `lib/storefront/checkout.ts` (pure) | done |
| 4 | Payment abstraction `lib/storefront/payments/*` (Razorpay + offline) | done |
| 5 | Server actions: `app/checkout/actions.ts`, newsletter action | done |
| 6 | Webhook route `/api/webhooks/razorpay` | done |
| 7 | Frontend wiring: CheckoutClient (address + promo + pay), NewsletterForm, confirmation page | done |
| 8 | QA / security / perf review + docs finalisation | done |

## Dependencies
2 → 1 · 3 → 1 · 5 → 3,4 · 6 → 2,4 · 7 → 5,6

## Rollout / env
Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`. Absent ⇒ system runs in **offline** mode (orders persist as pending, manual confirmation) so dev/preview never breaks.
