-- 0005_booking_state — add `state` column to bespoke bookings (additive, forward-only).
-- Mirrors lib/admin/schema.sql `bookings`. Baselined migrations are NOT edited.
--
-- Manual rollback (run by hand if this must be reverted — there is no
-- automated down-migration in this project):
--   ALTER TABLE bookings DROP COLUMN state;
--   DELETE FROM schema_migrations WHERE version = '0005_booking_state';

BEGIN;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS state TEXT NOT NULL DEFAULT '';

INSERT INTO schema_migrations (version) VALUES ('0005_booking_state')
  ON CONFLICT (version) DO NOTHING;

COMMIT;
