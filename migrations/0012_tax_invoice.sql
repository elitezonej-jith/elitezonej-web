-- 0012_tax_invoice — GST rate on products, per-item GST on order_items,
-- and business settings for Indian Tax Invoice header.

BEGIN;

-- Per-product GST rate (default 5% = standard Indian garment rate)
ALTER TABLE products ADD COLUMN IF NOT EXISTS gst_rate INTEGER NOT NULL DEFAULT 5;

-- Per-item GST snapshot at order time (so future rate changes don't affect old invoices)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS gst_rate INTEGER NOT NULL DEFAULT 5;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS gst_amount INTEGER NOT NULL DEFAULT 0;

-- Business details for Tax Invoice header
INSERT INTO settings (key, value) VALUES ('business_legal_name', 'ZONE J') ON CONFLICT(key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('business_gstin', '33BQSPN8858E1Z7') ON CONFLICT(key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('business_state_code', '33') ON CONFLICT(key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('business_address', '1/1334, 4TH CROSS STREET
THIRUVALLUVAR SALAI, BETHAL NAGAR,
INJAMBAKKAM, CHENNAI- 60015') ON CONFLICT(key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('business_phone', '8939888593') ON CONFLICT(key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('business_phone2', '8939888594') ON CONFLICT(key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('business_email', 'elitezonej@gmail.com') ON CONFLICT(key) DO NOTHING;

INSERT INTO schema_migrations (version) VALUES ('0012_tax_invoice')
ON CONFLICT (version) DO NOTHING;

COMMIT;
