-- 0002_customer_addresses — saved shipping address book (additive, forward-only).
-- Mirrors lib/admin/schema.sql `addresses`. Baselined 0001 is NOT edited.
--
-- Manual rollback (run by hand if this must be reverted — there is no
-- automated down-migration in this project):
--   DROP TABLE IF EXISTS addresses;
--   DELETE FROM schema_migrations WHERE version = '0002_customer_addresses';

BEGIN;

CREATE TABLE IF NOT EXISTS addresses (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label       TEXT NOT NULL DEFAULT '',
  first_name  TEXT NOT NULL DEFAULT '',
  last_name   TEXT NOT NULL DEFAULT '',
  line1       TEXT NOT NULL DEFAULT '',
  line2       TEXT NOT NULL DEFAULT '',
  city        TEXT NOT NULL DEFAULT '',
  state       TEXT NOT NULL DEFAULT '',
  pincode     TEXT NOT NULL DEFAULT '',
  country     TEXT NOT NULL DEFAULT 'India',
  is_default  INTEGER NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_addresses_customer ON addresses(customer_id);

INSERT INTO schema_migrations (version) VALUES ('0002_customer_addresses')
  ON CONFLICT (version) DO NOTHING;

COMMIT;
