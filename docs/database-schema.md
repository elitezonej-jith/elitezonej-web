# Database Schema — commerce additions (schema-v3)

Applied idempotently after v1/v2 by `applyV3()` in `lib/admin/db.ts` (same per-statement, ALTER-guarded approach as `applyV2`).

## Existing tables reused
`customers`, `orders`, `order_items`, `products`, `inventory`, `fabric_colours`, `fabric_meta`, `promotions`, `offer_targets`, `audit_log`.

## Column additions to `orders`
| Column | Type | Notes |
|---|---|---|
| `discount` | INTEGER NOT NULL DEFAULT 0 | promo discount applied |
| `shipping` | INTEGER NOT NULL DEFAULT 0 | flat shipping (0 if free) |
| `promo_code` | TEXT | nullable FK-by-value to `promotions.code` |
| `payment_status` | TEXT NOT NULL DEFAULT 'pending' | `pending\|paid\|failed\|refunded` |
| `email` | TEXT NOT NULL DEFAULT '' | contact snapshot |
| `phone` | TEXT NOT NULL DEFAULT '' | contact snapshot |
| `ship_name` | TEXT NOT NULL DEFAULT '' | address snapshot |
| `ship_line1` / `ship_line2` | TEXT | address snapshot |
| `ship_city` / `ship_state` / `ship_pincode` | TEXT | address snapshot |
| `ship_country` | TEXT NOT NULL DEFAULT 'India' | |

Address is **snapshotted on the order** (not normalised) — fulfilment must be immutable against later customer edits.

`orders.status` keeps its existing CHECK set; the customer-payment lifecycle lives in the new `payment_status` column so the admin status enum is untouched.

## New table `payments`
```
id              TEXT PRIMARY KEY            -- internal: pay_<rand>
order_id        TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE
provider        TEXT NOT NULL               -- 'razorpay' | 'offline'
provider_order_id   TEXT                    -- razorpay order id
provider_payment_id TEXT                    -- razorpay payment id
amount          INTEGER NOT NULL            -- rupees (×100 only at gateway edge)
currency        TEXT NOT NULL DEFAULT 'INR'
status          TEXT NOT NULL DEFAULT 'created'  -- created|paid|failed
created_at      TEXT NOT NULL DEFAULT (datetime('now'))
updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
INDEX (order_id), UNIQUE (provider_order_id)
```

## New table `newsletter_subscribers`
```
id          INTEGER PK AUTOINCREMENT
email       TEXT NOT NULL UNIQUE
source      TEXT NOT NULL DEFAULT 'footer'
status      TEXT NOT NULL DEFAULT 'subscribed'  -- subscribed|unsubscribed
created_at  TEXT NOT NULL DEFAULT (datetime('now'))
```

## Integrity / indexing
- `UNIQUE(payments.provider_order_id)` makes payment verification idempotent at the storage layer.
- Inventory decrements happen only inside the paid-fulfilment transaction with `foreign_keys = ON`.
- Soft-delete not introduced (orders are never hard-deleted by the storefront; cancellation is a status).
