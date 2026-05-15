# Phase Progress

| Phase | Outcome |
|---|---|
| 1 — Schema & types | `schema-v3.sql` added; `applyAdditive()` generalised in `db.ts` (v2+v3, idempotent, ALTER-guarded); `Order` extended, `Payment`/`NewsletterSubscriber`/`PaymentStatus` added. |
| 2 — Repos | `repos/payments.ts`, `repos/newsletter.ts` created; `orders.ts` extended with `createPendingOrder` + transactional `fulfilOrderPaid` (stock re-check & decrement, promo usage, customer totals, payment settle, idempotent). |
| 3 — Pricing engine | `lib/storefront/checkout.ts` — server-truth re-pricing, stock pre-check, promo validation (validity window, min total, usage limit, product/category targeting). |
| 4 — Payments | `payments/razorpay.ts` (REST via fetch, HMAC checkout + webhook verification, timing-safe compare) and `payments/index.ts` (provider selection, offline fallback). |
| 5 — Actions | `app/checkout/actions.ts` (`startCheckout`, `confirmPayment`); `app/components/actions/newsletter.ts`. Both public, Zod-validated, rate-limited, audited. |
| 6 — Webhook | `app/api/webhooks/razorpay/route.ts` — signature-verified, idempotent, Node runtime. |
| 7 — Frontend | `CheckoutClient` rewritten (shipping form + promo + Razorpay flow + offline WhatsApp fallback); `NewsletterForm` wired to action; `checkout/confirmation` page added. |
| 8 — QA | `tsc --noEmit` green. Security/perf/deploy docs written. |

## Verification performed
- `npx tsc --noEmit` — passed, no errors.
- Static review of transaction boundary, idempotency guards, and signature verification (see `security-review.md`).

## Known follow-ups (deferred, not blockers)
- Order-confirmation email (no SMTP provider configured; audit log + admin view cover it for now).
- Storefront customer accounts (guest checkout by design).
- Admin/Studio screen to browse `newsletter_subscribers` (data is captured; UI optional).
