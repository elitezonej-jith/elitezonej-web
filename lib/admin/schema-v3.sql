-- Storefront commerce additions (v3). Loaded after schema-v2.sql; idempotent.
-- ALTER statements are pre-checked per-column by applyV3() in db.ts.

-- Order: promo, money breakdown, payment lifecycle, contact + shipping snapshot.
ALTER TABLE orders ADD COLUMN discount       INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN shipping       INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN promo_code     TEXT;
ALTER TABLE orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN email          TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN phone          TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN ship_name      TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN ship_line1     TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN ship_line2     TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN ship_city      TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN ship_state     TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN ship_pincode   TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN ship_country   TEXT NOT NULL DEFAULT 'India';

CREATE TABLE IF NOT EXISTS payments (
  id                  TEXT PRIMARY KEY,
  order_id            TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider            TEXT NOT NULL DEFAULT 'razorpay',
  provider_order_id   TEXT,
  provider_payment_id TEXT,
  amount              INTEGER NOT NULL DEFAULT 0,
  currency            TEXT NOT NULL DEFAULT 'INR',
  status              TEXT NOT NULL DEFAULT 'created'
                        CHECK (status IN ('created','paid','failed')),
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_provider_order ON payments(provider_order_id);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT NOT NULL UNIQUE,
  source      TEXT NOT NULL DEFAULT 'footer',
  status      TEXT NOT NULL DEFAULT 'subscribed'
                CHECK (status IN ('subscribed','unsubscribed')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
