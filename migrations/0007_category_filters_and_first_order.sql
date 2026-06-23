-- 0007_category_filters_and_first_order — schema-v7 + schema-v8 for Postgres.
-- Additive only. Idempotent via IF NOT EXISTS / IF NOT EXISTS.

BEGIN;

-- schema-v7: Category-aware filters
CREATE TABLE IF NOT EXISTS category_filters (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  field_key   TEXT NOT NULL,
  filter_type TEXT NOT NULL DEFAULT 'checkbox',
  sort_order  INT NOT NULL DEFAULT 0,
  UNIQUE(category_id, name)
);

CREATE TABLE IF NOT EXISTS filter_options (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  filter_id   BIGINT NOT NULL REFERENCES category_filters(id) ON DELETE CASCADE,
  value       TEXT NOT NULL,
  label       TEXT,
  color_hex   TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  UNIQUE(filter_id, value)
);

-- schema-v8: First-order discount support
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS first_order_only INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS first_order_claims (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT NOT NULL UNIQUE,
  order_id    TEXT NOT NULL,
  promo_code  TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','used','released')),
  claimed_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_foc_order ON first_order_claims(order_id);

INSERT INTO schema_migrations (version) VALUES ('0007_category_filters_and_first_order')
ON CONFLICT DO NOTHING;

COMMIT;
