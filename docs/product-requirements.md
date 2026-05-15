# Product Requirements (reverse-engineered)

## Goal
Elite Zone J is a luxury bespoke + ready-to-wear fashion storefront (India, INR). It must accept real online orders with online payment, while preserving the personal-atelier brand experience.

## In scope (this engagement)
1. **Checkout & orders** — persist orders, capture shipping/contact, online payment via gateway, atomic inventory reservation, order confirmation.
2. **Payments** — Razorpay (INR) behind a provider abstraction; graceful offline fallback when keys absent.
3. **Promotions at checkout** — apply existing promo codes (percent / flat / free_ship) with validity, min-total, usage-limit and targeting checks.
4. **Newsletter** — persist subscribers from the footer form.
5. **Documentation** — full `docs/` suite.

## Out of scope (explicitly deferred)
- Storefront customer accounts/login (guest checkout only — matches current UX).
- Shipping-rate engine / live courier integration (flat/free only).
- Returns/RMA workflow, multi-currency, tax engine beyond a configurable rate.

## Business rules
- Server is the source of truth for price (re-derive from `products.sale_price ?? price`).
- An order is only **`confirmed`** after verified payment; unpaid attempts stay `new` + `payment_status=pending`.
- Inventory is decremented **only on verified payment**, inside a transaction; insufficient stock aborts the whole order.
- Promo `usage_count` increments only on successful paid order; `usage_limit` enforced.
- Customer `total_orders`/`total_spent` updated on paid order.
- Every state change is written to `audit_log`.

## Non-functional
Production-grade: typed, validated (Zod), rate-limited public endpoints, idempotent payment verification, signature-verified webhooks, no secrets client-side.
