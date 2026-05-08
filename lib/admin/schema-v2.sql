-- Studio additions (v2). Loaded after schema.sql; idempotent.

-- Banners — separate, first-class. The /admin home_sections table stays
-- for legacy; banners are the new typed slot.
CREATE TABLE IF NOT EXISTS banners (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT NOT NULL DEFAULT '',
  subtitle      TEXT NOT NULL DEFAULT '',
  button_text   TEXT NOT NULL DEFAULT '',
  button_href   TEXT NOT NULL DEFAULT '',
  image_path    TEXT NOT NULL DEFAULT '',
  mobile_image_path TEXT NOT NULL DEFAULT '',
  text_align    TEXT NOT NULL DEFAULT 'left',  -- left | center | right
  text_color    TEXT NOT NULL DEFAULT 'light', -- light | dark
  starts_at     TEXT,
  ends_at       TEXT,
  status        TEXT NOT NULL DEFAULT 'draft', -- draft | scheduled | published
  enabled       INTEGER NOT NULL DEFAULT 1,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_banners_sort   ON banners(sort_order);
CREATE INDEX IF NOT EXISTS idx_banners_status ON banners(status);

-- Notices — scrolling ticker, popup, festive
CREATE TABLE IF NOT EXISTS notices (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  type         TEXT NOT NULL DEFAULT 'scroll', -- scroll | popup | festive
  body         TEXT NOT NULL DEFAULT '',
  link_href    TEXT NOT NULL DEFAULT '',
  link_text    TEXT NOT NULL DEFAULT '',
  color_bg     TEXT NOT NULL DEFAULT '',
  color_fg     TEXT NOT NULL DEFAULT '',
  priority     INTEGER NOT NULL DEFAULT 0,
  starts_at    TEXT,
  ends_at      TEXT,
  dismissable  INTEGER NOT NULL DEFAULT 1,
  enabled      INTEGER NOT NULL DEFAULT 1,
  target_paths TEXT NOT NULL DEFAULT '*', -- comma-list of path prefixes or '*'
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notices_type ON notices(type);
CREATE INDEX IF NOT EXISTS idx_notices_pri  ON notices(priority DESC);

-- Homepage typed blocks — composable home page
CREATE TABLE IF NOT EXISTS homepage_blocks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  type        TEXT NOT NULL,         -- hero_grid | hero_banner | banner_carousel
                                     -- | product_carousel | editorial_split
                                     -- | service_cards | process_strip
                                     -- | full_banner | trust_strip | wedding_editorial
                                     -- | bespoke_teaser | category_grid | custom_html
  title       TEXT NOT NULL DEFAULT '',
  kicker      TEXT NOT NULL DEFAULT '',
  config_json TEXT NOT NULL DEFAULT '{}',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  enabled     INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_homepage_sort ON homepage_blocks(sort_order);

-- Per-product image table (multi-image with sort, alt text, thumbnail flag)
CREATE TABLE IF NOT EXISTS product_images (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  product_slug  TEXT NOT NULL REFERENCES products(slug) ON DELETE CASCADE,
  image_path    TEXT NOT NULL,
  alt           TEXT NOT NULL DEFAULT '',
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_thumbnail  INTEGER NOT NULL DEFAULT 0,
  is_hover      INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_product_images_slug ON product_images(product_slug, sort_order);

-- Per-product flags + SEO (one row per product; mirrors products PK)
CREATE TABLE IF NOT EXISTS product_meta (
  product_slug      TEXT PRIMARY KEY REFERENCES products(slug) ON DELETE CASCADE,
  is_featured       INTEGER NOT NULL DEFAULT 0,
  is_trending       INTEGER NOT NULL DEFAULT 0,
  is_new_arrival    INTEGER NOT NULL DEFAULT 0,
  short_description TEXT NOT NULL DEFAULT '',
  long_description  TEXT NOT NULL DEFAULT '',
  meta_title        TEXT NOT NULL DEFAULT '',
  meta_description  TEXT NOT NULL DEFAULT '',
  og_image_path     TEXT NOT NULL DEFAULT ''
);

-- Offer / promotion targeting + featured + flash-sale fields
ALTER TABLE promotions ADD COLUMN is_featured INTEGER NOT NULL DEFAULT 0;
-- (the next two might already exist on a re-run; guarded via TRY in code)

CREATE TABLE IF NOT EXISTS offer_targets (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  promo_code  TEXT NOT NULL REFERENCES promotions(code) ON DELETE CASCADE,
  target_type TEXT NOT NULL,  -- all | category | product
  target_id   TEXT NOT NULL,  -- '' for all, slug for category/product
  UNIQUE(promo_code, target_type, target_id)
);
CREATE INDEX IF NOT EXISTS idx_offer_targets_code ON offer_targets(promo_code);

-- Flash sales — countdown banners targeting offer codes
CREATE TABLE IF NOT EXISTS flash_sales (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT NOT NULL DEFAULT '',
  subtitle      TEXT NOT NULL DEFAULT '',
  promo_code    TEXT REFERENCES promotions(code) ON DELETE SET NULL,
  banner_image  TEXT NOT NULL DEFAULT '',
  starts_at     TEXT,
  ends_at       TEXT NOT NULL,
  enabled       INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Categories: image + enabled
ALTER TABLE categories ADD COLUMN image_path TEXT NOT NULL DEFAULT '';
ALTER TABLE categories ADD COLUMN enabled    INTEGER NOT NULL DEFAULT 1;

-- Real media library — replaces the read-only `media` table for tracking uploads
CREATE TABLE IF NOT EXISTS media_assets (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  path        TEXT NOT NULL UNIQUE,
  alt         TEXT NOT NULL DEFAULT '',
  folder      TEXT NOT NULL DEFAULT 'uploads',
  width       INTEGER,
  height      INTEGER,
  bytes       INTEGER,
  mime        TEXT NOT NULL DEFAULT 'image/webp',
  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_media_folder ON media_assets(folder);

-- Add original_image to products so the storefront can pick a default thumbnail
ALTER TABLE products ADD COLUMN thumbnail_path TEXT NOT NULL DEFAULT '';
