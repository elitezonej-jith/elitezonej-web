# Security Review — commerce surface

## Threats considered & mitigations

| Risk | Mitigation |
|---|---|
| **Price tampering** (client sends cheaper prices) | Client price is never read. `priceCart()` re-derives every `unit_price` from `products` (`sale_price ?? price`) server-side. |
| **Payment forgery** (fake success callback) | `confirmPayment` recomputes `HMAC_SHA256(order_id\|payment_id, key_secret)` and `timingSafeEqual`s it against `razorpay_signature`. The provider order id must also match a payment row we created. |
| **Webhook spoofing** | `/api/webhooks/razorpay` verifies `X-Razorpay-Signature` (HMAC of raw body, webhook secret) before any DB work; bad signature → 400, no side effects. |
| **Double fulfilment / replay** (webhook + callback both fire) | `fulfilOrderPaid` is idempotent: first action inside the transaction checks `payment_status='paid'` and returns a no-op. `UNIQUE(payments.provider_order_id)` enforces one payment row per provider order. |
| **Overselling / race on stock** | Stock decrement is conditional (`UPDATE … WHERE stock >= ?`) inside a single `better-sqlite3` transaction; `changes === 0` aborts the whole order (rollback). SQLite serialises writes, so no lost-update window. |
| **Promo abuse** | Validity window, `min_total`, `usage_limit` enforced at pricing time; `usage_count` only incremented inside the paid transaction (not on abandoned carts). |
| **IDOR on confirmation page** | Order id is a high-entropy `EZJ-` + 8 hex token; the confirmation page only renders non-sensitive summary fields, no auth tokens. |
| **Form spam / brute force** | Existing in-memory `rateLimit()` on `checkout:<ip>` (8/10min) and `news:<ip>` (5/hr); Zod validation rejects malformed input before any I/O. |
| **Secret exposure** | `RAZORPAY_KEY_SECRET` / webhook secret only used in `"server-only"` modules. Only `NEXT_PUBLIC_RAZORPAY_KEY_ID` reaches the browser (intended public key). No card data touches the server (Razorpay-hosted checkout). |
| **Injection** | All SQL uses prepared statements with bound params; no string interpolation of user input. |
| **Audit** | Every checkout start, payment success/failure, signature failure and webhook is written to `audit_log`. |

## Residual / accepted
- In-memory rate limiter is process-local (documented in code) — acceptable for single-instance/warm serverless; back with Redis for multi-region.
- Serverless in-memory SQLite (existing behaviour) loses data on cold start — acceptable for preview, **must** use a persistent host/DB for production payments.
- No CSRF token: mutations are Next Server Actions (same-origin, POST, action-id bound) — framework-level protection; no cross-site form replay path that bypasses signature checks.
