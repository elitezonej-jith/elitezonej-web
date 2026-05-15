# Backend Architecture

## Principles
Extend the existing, hardened pattern rather than re-platform:
- **Data access:** `"server-only"` repo modules in `lib/admin/repos/*` over `better-sqlite3` (`getDb()`), prepared statements, no ORM.
- **Mutations:** Next.js Server Actions in `app/<area>/actions.ts` — Zod-validated, rate-limited for public endpoints, audited.
- **Schema:** additive SQL files applied idempotently at DB open (`schema.sql` → `applyV2` → `applyV3`). No destructive migrations.
- **Serverless-safe:** in-memory SQLite fallback already handled in `db.ts`; new tables created the same way.

## Layering for commerce

```
CheckoutClient (client)
  └─ startCheckout()  ─┐         app/checkout/actions.ts  (server action, public, rate-limited)
                       ├─ pricing/promo engine   lib/storefront/checkout.ts   (pure, testable)
                       ├─ payment provider        lib/storefront/payments/*    (abstraction + razorpay)
                       └─ repos                    lib/admin/repos/{orders,payments,promotions,...}
  └─ Razorpay Checkout.js (browser) ── on success ──> confirmPayment()  (verify signature → fulfil txn)
Razorpay webhook ──> app/api/webhooks/razorpay/route.ts  (signature-verified, idempotent fulfilment)
```

## Key modules (new)
| Module | Responsibility |
|---|---|
| `lib/storefront/checkout.ts` | Pure pricing: re-price lines from DB, apply promo, compute subtotal/discount/shipping/tax/total. No I/O side effects beyond reads. |
| `lib/storefront/payments/index.ts` | `PaymentProvider` interface + provider selection (Razorpay if keys, else offline). |
| `lib/storefront/payments/razorpay.ts` | REST calls via `fetch` (no SDK dep), HMAC-SHA256 order + webhook verification (Node `crypto`). |
| `lib/admin/repos/payments.ts` | `payments` table CRUD. |
| `lib/admin/repos/newsletter.ts` | subscriber upsert/list. |
| `lib/admin/repos/orders.ts` (extended) | `createPendingOrder`, `fulfilOrderPaid` (transaction), status setters. |

## Transaction boundary
`fulfilOrderPaid(orderId, paymentMeta)` runs in a single `better-sqlite3` transaction:
1. Re-check order is `payment_status=pending` (idempotency guard).
2. Re-validate stock for every line; abort on shortfall.
3. Decrement `inventory.stock` (tailored) / `fabric_colours.stock_meters` + `fabric_meta.stock_meters_total` (fabric).
4. Set order `status=confirmed`, `payment_status=paid`.
5. Increment promo `usage_count`; bump customer `total_orders/total_spent`.
6. Insert/settle `payments` row; `audit_log`.

## Idempotency & security
- Payment verification keyed on provider order id; second call is a no-op (guard in step 1).
- Webhook and client-callback both route through the same `fulfilOrderPaid` — safe to fire both.
- All money math server-side; client-sent prices ignored.
- Public actions rate-limited via existing `rateLimit()`.
