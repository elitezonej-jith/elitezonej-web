-- 0009_order_shipping — adds shipping tracking columns to orders and couriers table.
-- Additive only. Idempotent via IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.

BEGIN;

-- Shipping/tracking columns on orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

-- Couriers lookup table
CREATE TABLE IF NOT EXISTS couriers (
  code        TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  url_pattern TEXT
);

-- Seed common Indian couriers
INSERT INTO couriers (code, name, url_pattern) VALUES
  ('delhivery', 'Delhivery', 'https://www.delhivery.com/track/package/{awb}'),
  ('shiprocket', 'Shiprocket', 'https://shiprocket.co/tracking/{awb}'),
  ('dtdc', 'DTDC', 'https://www.dtdc.in/tracking.asp?strCnno={awb}'),
  ('bluedart', 'BlueDart', 'https://www.bluedart.com/tracking/{awb}'),
  ('india_post', 'India Post', 'https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx?ConsignmentNo={awb}'),
  ('ecom_express', 'Ecom Express', 'https://ecomexpress.in/tracking/?awb_field={awb}'),
  ('xpressbees', 'XpressBees', 'https://www.xpressbees.com/track?awb={awb}'),
  ('other', 'Other', NULL)
ON CONFLICT (code) DO NOTHING;

INSERT INTO schema_migrations (version) VALUES ('0009_order_shipping')
ON CONFLICT (version) DO NOTHING;

COMMIT;
