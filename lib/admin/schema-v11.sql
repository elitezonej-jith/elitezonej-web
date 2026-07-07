-- v11: Indian Tax Invoice — GST rate per product, per-item GST snapshot on order
ALTER TABLE products ADD COLUMN gst_rate INTEGER NOT NULL DEFAULT 5;
ALTER TABLE order_items ADD COLUMN gst_rate INTEGER NOT NULL DEFAULT 5;
ALTER TABLE order_items ADD COLUMN gst_amount INTEGER NOT NULL DEFAULT 0;
