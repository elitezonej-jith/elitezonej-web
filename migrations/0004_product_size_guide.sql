-- 0004_product_size_guide — per-product size guide editor (additive, forward-only).
-- Stores a free-form rich-text/markdown blob; rendered on the PDP under sizes
-- and edited from the Studio product form. Empty string means "show no guide".
--
-- Manual rollback:
--   ALTER TABLE products DROP COLUMN size_guide;
--   DELETE FROM schema_migrations WHERE version = '0004_product_size_guide';

BEGIN;

ALTER TABLE products ADD COLUMN IF NOT EXISTS size_guide TEXT NOT NULL DEFAULT '';

INSERT INTO schema_migrations (version) VALUES ('0004_product_size_guide')
  ON CONFLICT (version) DO NOTHING;

COMMIT;
