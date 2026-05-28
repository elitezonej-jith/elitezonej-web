-- Booking `state` column (v5). Loaded after schema-v4.sql; additive.
-- ALTER statements are pre-checked per-column by applyAdditive() in db.ts.

ALTER TABLE bookings ADD COLUMN state TEXT NOT NULL DEFAULT '';
