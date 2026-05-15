# Auth & Roles

## Storefront (commerce)
- **Guest checkout, no login.** Customers are identified by email and upserted (`upsertCustomer`). This matches the existing UX (no storefront auth anywhere) and is an explicit scope decision.
- Abuse control instead of auth: existing in-memory `rateLimit()` on every public action (`checkout`, `newsletter`), Zod validation, server-side re-pricing, signature-verified payment + webhook.
- No PII beyond order fulfilment data; no card data touches the server (Razorpay-hosted checkout).

## Admin / Studio (unchanged, documented for completeness)
- Cookie session (`SESSION_COOKIE`) → `getSessionUser` → `requireUser()` / `requireRole('owner')`.
- Roles: `owner` (full, incl. user management) and `staff`.
- New order/payment data is **read** by existing `/admin/orders` & `/studio/orders` pages; no new admin auth surface introduced.

## Permissions matrix (commerce-relevant)
| Action | Guest | staff | owner |
|---|---|---|---|
| Start checkout / pay | ✓ | ✓ | ✓ |
| View orders | ✗ | ✓ | ✓ |
| Change order status | ✗ | ✓ | ✓ |
| Manage promotions | ✗ | ✗ | ✓ (existing) |
| View newsletter list | ✗ | ✓ | ✓ |

## Future (deferred)
Customer accounts would reuse the `customers` table + a separate session table; not built now.
