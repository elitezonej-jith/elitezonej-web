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

-- Storefront customer accounts. `password_hash` is nullable: guest customers
-- created at checkout have none until they sign up (account upgrade in place).
ALTER TABLE customers ADD COLUMN password_hash TEXT;

CREATE TABLE IF NOT EXISTS customer_sessions (
  id           TEXT PRIMARY KEY,
  customer_id  INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  expires_at   TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  ip           TEXT,
  ua           TEXT
);
CREATE INDEX IF NOT EXISTS idx_cust_sessions_customer ON customer_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_cust_sessions_exp ON customer_sessions(expires_at);

-- Payment-gateway webhook idempotency: one row per processed provider event,
-- so a Razorpay retry/replay of the same event is a guaranteed no-op.
CREATE TABLE IF NOT EXISTS webhook_events (
  event_id    TEXT PRIMARY KEY,
  provider    TEXT NOT NULL DEFAULT 'razorpay',
  event_type  TEXT,
  received_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Checkout idempotency: maps a per-submission client key to the order it
-- created, so a double-click / network retry resumes the same order instead
-- of creating a duplicate order + duplicate gateway order.
CREATE TABLE IF NOT EXISTS checkout_idempotency (
  key        TEXT PRIMARY KEY,
  order_id   TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
