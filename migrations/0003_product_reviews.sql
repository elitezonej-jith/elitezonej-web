-- 0003_product_reviews — customer reviews + star ratings per product
-- (additive, forward-only). Mirrors lib/admin/schema-v4.sql.
--
-- Manual rollback (run by hand if this must be reverted):
--   DROP TABLE IF EXISTS product_reviews;
--   DELETE FROM schema_migrations WHERE version = '0003_product_reviews';

BEGIN;

CREATE TABLE IF NOT EXISTS product_reviews (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_slug  TEXT NOT NULL REFERENCES products(slug) ON DELETE CASCADE,
  customer_id   BIGINT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  rating        INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title         TEXT NOT NULL DEFAULT '',
  body          TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected')),
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_product_reviews_slug_status
  ON product_reviews(product_slug, status);
CREATE INDEX IF NOT EXISTS idx_product_reviews_status
  ON product_reviews(status);

INSERT INTO schema_migrations (version) VALUES ('0003_product_reviews')
  ON CONFLICT (version) DO NOTHING;

COMMIT;
