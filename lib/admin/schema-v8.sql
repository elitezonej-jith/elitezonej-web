-- schema-v8: First-order discount support. Idempotent.

-- Flag on promotions to mark "first order only" codes.
ALTER TABLE promotions ADD COLUMN first_order_only INTEGER NOT NULL DEFAULT 0;

-- Atomic claim table: UNIQUE(customer_id) guarantees at most ONE active
-- first-order discount claim per customer at any time. The race condition
-- where two tabs both pass the eligibility check is eliminated because the
-- second INSERT will violate the unique constraint and fail atomically.
CREATE TABLE IF NOT EXISTS first_order_claims (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL UNIQUE,
  order_id    TEXT NOT NULL,
  promo_code  TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','used','released')),
  claimed_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_foc_order ON first_order_claims(order_id);
