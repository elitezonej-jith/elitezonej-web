-- v6: Product colour variants for tailored garments
-- Additive migration — new table + nullable FK column on product_images.

CREATE TABLE IF NOT EXISTS product_colours (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  product_slug  TEXT NOT NULL REFERENCES products(slug) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  hex           TEXT NOT NULL DEFAULT '#000000',
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_default    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_product_colours_slug ON product_colours(product_slug);

ALTER TABLE product_images ADD COLUMN colour_id INTEGER REFERENCES product_colours(id) ON DELETE SET NULL;

-- Premium collection flag
ALTER TABLE product_meta ADD COLUMN is_premium INTEGER NOT NULL DEFAULT 0;

-- Seed premium products (idempotent — ON CONFLICT updates only is_premium)
INSERT INTO product_meta (product_slug, is_premium) VALUES ('heritage-three-piece', 1)
  ON CONFLICT(product_slug) DO UPDATE SET is_premium = 1;
INSERT INTO product_meta (product_slug, is_premium) VALUES ('black-tie-tuxedo', 1)
  ON CONFLICT(product_slug) DO UPDATE SET is_premium = 1;
INSERT INTO product_meta (product_slug, is_premium) VALUES ('festive-sherwani', 1)
  ON CONFLICT(product_slug) DO UPDATE SET is_premium = 1;
INSERT INTO product_meta (product_slug, is_premium) VALUES ('aria-pant-suit', 1)
  ON CONFLICT(product_slug) DO UPDATE SET is_premium = 1;
INSERT INTO product_meta (product_slug, is_premium) VALUES ('embroidered-lehenga', 1)
  ON CONFLICT(product_slug) DO UPDATE SET is_premium = 1;
INSERT INTO product_meta (product_slug, is_premium) VALUES ('raw-silk-saree', 1)
  ON CONFLICT(product_slug) DO UPDATE SET is_premium = 1;
