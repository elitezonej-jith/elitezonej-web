-- Product reviews + ratings (v4). Loaded after schema-v3.sql; idempotent.
-- ALTER statements are pre-checked per-column by applyAdditive() in db.ts.

CREATE TABLE IF NOT EXISTS product_reviews (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  product_slug  TEXT NOT NULL REFERENCES products(slug) ON DELETE CASCADE,
  customer_id   INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  rating        INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title         TEXT NOT NULL DEFAULT '',
  body          TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_product_reviews_slug_status
  ON product_reviews(product_slug, status);
CREATE INDEX IF NOT EXISTS idx_product_reviews_status
  ON product_reviews(status);
