-- 0010_product_delivery_time — per-product delivery time override.
-- Both columns are nullable: NULL means "use the global lead_time_days setting".
-- Additive only. Idempotent via ADD COLUMN IF NOT EXISTS.

BEGIN;

ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_min_days INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_max_days INTEGER;

-- Constraint: when both are set, max must be >= min.
-- Postgres CHECK constraints on nullable columns only fire when the value is non-null.
ALTER TABLE products ADD CONSTRAINT chk_delivery_range
  CHECK (delivery_max_days IS NULL OR delivery_min_days IS NULL OR delivery_max_days >= delivery_min_days);

INSERT INTO schema_migrations (version) VALUES ('0010_product_delivery_time')
ON CONFLICT (version) DO NOTHING;

COMMIT;
