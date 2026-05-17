-- Postgres baseline — consolidates lib/admin/schema.sql + schema-v2.sql +
-- schema-v3.sql into one forward-only migration (production has no data:
-- greenfield cutover, no ETL). Audit-flagged integrity constraints folded in
-- where safe. Run once via scripts/migrate.ts. See
-- docs/postgres-migration-plan.md.
--
-- Dialect notes vs the SQLite source:
--   INTEGER PRIMARY KEY AUTOINCREMENT -> BIGINT GENERATED ALWAYS AS IDENTITY
--   TEXT DEFAULT (datetime('now'))    -> timestamptz NOT NULL DEFAULT now()
--   boolean 0/1 columns kept as integer (repo code compares 0/1 — least churn)
--   email kept TEXT UNIQUE; app lowercases on read/write (see customer-auth)
--   order_items.product_slug stays a SOFT ref (no FK): the catalog is partly
--     code-resident (PRODUCTS), so a hard FK would break checkout.

BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner','staff')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  ip         TEXT,
  ua         TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_exp  ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS products (
  slug          TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  cat           TEXT NOT NULL DEFAULT '',
  cat_link      TEXT NOT NULL DEFAULT 'Men',
  price         INTEGER NOT NULL DEFAULT 0 CHECK (price >= 0),
  sale_price    INTEGER CHECK (sale_price IS NULL OR sale_price >= 0),
  line          TEXT NOT NULL DEFAULT '',
  sizes_json    TEXT NOT NULL DEFAULT '[]',
  features_json TEXT NOT NULL DEFAULT '[]',
  spec_json     TEXT NOT NULL DEFAULT '[]',
  note          TEXT NOT NULL DEFAULT '',
  fit           TEXT NOT NULL DEFAULT '',
  fabric        TEXT NOT NULL DEFAULT '',
  occasion      TEXT NOT NULL DEFAULT '',
  badge         TEXT,
  gender        TEXT NOT NULL DEFAULT 'unisex',
  category      TEXT NOT NULL DEFAULT '',
  sub           TEXT,
  kind          TEXT NOT NULL DEFAULT 'tailored' CHECK (kind IN ('tailored','fabric')),
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','draft','archived')),
  description   TEXT,
  thumbnail_path TEXT NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_kind   ON products(kind);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_cat    ON products(category);

CREATE TABLE IF NOT EXISTS inventory (
  product_slug TEXT NOT NULL REFERENCES products(slug) ON DELETE CASCADE,
  size         TEXT NOT NULL,
  stock        INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  oos_flag     INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (product_slug, size)
);

CREATE TABLE IF NOT EXISTS fabric_meta (
  product_slug       TEXT PRIMARY KEY REFERENCES products(slug) ON DELETE CASCADE,
  width_inches       INTEGER NOT NULL DEFAULT 58,
  gsm                INTEGER NOT NULL DEFAULT 0,
  composition        TEXT NOT NULL DEFAULT '',
  care               TEXT NOT NULL DEFAULT '',
  origin             TEXT NOT NULL DEFAULT '',
  stock_meters_total INTEGER NOT NULL DEFAULT 0 CHECK (stock_meters_total >= 0)
);

CREATE TABLE IF NOT EXISTS fabric_colours (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_slug TEXT NOT NULL REFERENCES products(slug) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  hex          TEXT NOT NULL,
  stock_meters INTEGER NOT NULL DEFAULT 0 CHECK (stock_meters >= 0),
  image_dir    TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_fabric_colours_slug ON fabric_colours(product_slug);

CREATE TABLE IF NOT EXISTS customers (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  first_name    TEXT NOT NULL DEFAULT '',
  last_name     TEXT NOT NULL DEFAULT '',
  phone         TEXT,
  city          TEXT,
  password_hash TEXT,
  total_orders  INTEGER NOT NULL DEFAULT 0,
  total_spent   INTEGER NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id             TEXT PRIMARY KEY,
  customer_id    BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  status         TEXT NOT NULL DEFAULT 'new'
                   CHECK (status IN ('new','confirmed','in_atelier','shipped','fulfilled','cancelled')),
  subtotal       INTEGER NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  discount       INTEGER NOT NULL DEFAULT 0 CHECK (discount >= 0),
  shipping       INTEGER NOT NULL DEFAULT 0 CHECK (shipping >= 0),
  tax            INTEGER NOT NULL DEFAULT 0 CHECK (tax >= 0),
  total          INTEGER NOT NULL DEFAULT 0 CHECK (total >= 0),
  currency       TEXT NOT NULL DEFAULT 'INR',
  promo_code     TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending'
                   CHECK (payment_status IN ('pending','paid','failed','refunded')),
  email          TEXT NOT NULL DEFAULT '',
  phone          TEXT NOT NULL DEFAULT '',
  ship_name      TEXT NOT NULL DEFAULT '',
  ship_line1     TEXT NOT NULL DEFAULT '',
  ship_line2     TEXT NOT NULL DEFAULT '',
  ship_city      TEXT NOT NULL DEFAULT '',
  ship_state     TEXT NOT NULL DEFAULT '',
  ship_pincode   TEXT NOT NULL DEFAULT '',
  ship_country   TEXT NOT NULL DEFAULT 'India',
  notes          TEXT,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  -- Audit-flagged money invariant (free to enforce on a greenfield DB).
  CONSTRAINT ck_orders_total CHECK (total = subtotal - discount + shipping + tax)
);
CREATE INDEX IF NOT EXISTS idx_orders_status   ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created  ON orders(created_at);

CREATE TABLE IF NOT EXISTS order_items (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id     TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_slug TEXT NOT NULL,            -- soft ref (catalog is partly code-resident)
  qty          INTEGER NOT NULL DEFAULT 1 CHECK (qty > 0),
  unit_price   INTEGER NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  size         TEXT,
  colour       TEXT,
  is_fabric    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

CREATE TABLE IF NOT EXISTS payments (
  id                  TEXT PRIMARY KEY,
  order_id            TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider            TEXT NOT NULL DEFAULT 'razorpay',
  provider_order_id   TEXT,
  provider_payment_id TEXT,
  amount              INTEGER NOT NULL DEFAULT 0 CHECK (amount >= 0),
  currency            TEXT NOT NULL DEFAULT 'INR',
  status              TEXT NOT NULL DEFAULT 'created'
                        CHECK (status IN ('created','paid','failed')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_provider_order ON payments(provider_order_id);

CREATE TABLE IF NOT EXISTS bookings (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  first_name  TEXT NOT NULL DEFAULT '',
  last_name   TEXT NOT NULL DEFAULT '',
  phone       TEXT NOT NULL DEFAULT '',
  email       TEXT,
  city        TEXT NOT NULL DEFAULT '',
  service     TEXT NOT NULL DEFAULT '',
  message     TEXT,
  status      TEXT NOT NULL DEFAULT 'new'
                CHECK (status IN ('new','contacted','scheduled','done','closed')),
  source      TEXT NOT NULL DEFAULT 'web',
  assigned_to BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bookings_status  ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at);

CREATE TABLE IF NOT EXISTS categories (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  parent_id  BIGINT REFERENCES categories(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL,
  gender     TEXT,
  kind       TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  image_path TEXT NOT NULL DEFAULT '',
  enabled    INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_categories_slug_parent
  ON categories (slug, COALESCE(parent_id, 0));

CREATE TABLE IF NOT EXISTS promotions (
  code        TEXT PRIMARY KEY,
  type        TEXT NOT NULL CHECK (type IN ('percent','flat','free_ship')),
  value       INTEGER NOT NULL DEFAULT 0 CHECK (value >= 0),
  starts_at   timestamptz,
  ends_at     timestamptz,
  min_total   INTEGER NOT NULL DEFAULT 0,
  usage_limit INTEGER,
  usage_count INTEGER NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active','scheduled','expired','disabled')),
  description TEXT,
  is_featured INTEGER NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS offer_targets (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  promo_code  TEXT NOT NULL REFERENCES promotions(code) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id   TEXT NOT NULL,
  UNIQUE (promo_code, target_type, target_id)
);
CREATE INDEX IF NOT EXISTS idx_offer_targets_code ON offer_targets(promo_code);

CREATE TABLE IF NOT EXISTS flash_sales (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title        TEXT NOT NULL DEFAULT '',
  subtitle     TEXT NOT NULL DEFAULT '',
  promo_code   TEXT REFERENCES promotions(code) ON DELETE SET NULL,
  banner_image TEXT NOT NULL DEFAULT '',
  starts_at    timestamptz,
  ends_at      timestamptz NOT NULL,
  enabled      INTEGER NOT NULL DEFAULT 1,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS home_sections (
  key         TEXT PRIMARY KEY,
  title       TEXT NOT NULL DEFAULT '',
  kicker      TEXT,
  body        TEXT,
  image_path  TEXT,
  link_text   TEXT,
  link_href   TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  enabled     INTEGER NOT NULL DEFAULT 1,
  extras_json TEXT
);

CREATE TABLE IF NOT EXISTS banners (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title             TEXT NOT NULL DEFAULT '',
  subtitle          TEXT NOT NULL DEFAULT '',
  button_text       TEXT NOT NULL DEFAULT '',
  button_href       TEXT NOT NULL DEFAULT '',
  image_path        TEXT NOT NULL DEFAULT '',
  mobile_image_path TEXT NOT NULL DEFAULT '',
  text_align        TEXT NOT NULL DEFAULT 'left',
  text_color        TEXT NOT NULL DEFAULT 'light',
  starts_at         timestamptz,
  ends_at           timestamptz,
  status            TEXT NOT NULL DEFAULT 'draft',
  enabled           INTEGER NOT NULL DEFAULT 1,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_banners_sort   ON banners(sort_order);
CREATE INDEX IF NOT EXISTS idx_banners_status ON banners(status);

CREATE TABLE IF NOT EXISTS notices (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type         TEXT NOT NULL DEFAULT 'scroll',
  body         TEXT NOT NULL DEFAULT '',
  link_href    TEXT NOT NULL DEFAULT '',
  link_text    TEXT NOT NULL DEFAULT '',
  color_bg     TEXT NOT NULL DEFAULT '',
  color_fg     TEXT NOT NULL DEFAULT '',
  priority     INTEGER NOT NULL DEFAULT 0,
  starts_at    timestamptz,
  ends_at      timestamptz,
  dismissable  INTEGER NOT NULL DEFAULT 1,
  enabled      INTEGER NOT NULL DEFAULT 1,
  target_paths TEXT NOT NULL DEFAULT '*',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notices_type ON notices(type);
CREATE INDEX IF NOT EXISTS idx_notices_pri  ON notices(priority DESC);

CREATE TABLE IF NOT EXISTS homepage_blocks (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL DEFAULT '',
  kicker      TEXT NOT NULL DEFAULT '',
  config_json TEXT NOT NULL DEFAULT '{}',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  enabled     INTEGER NOT NULL DEFAULT 1,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_homepage_sort ON homepage_blocks(sort_order);

CREATE TABLE IF NOT EXISTS product_images (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_slug TEXT NOT NULL REFERENCES products(slug) ON DELETE CASCADE,
  image_path   TEXT NOT NULL,
  alt          TEXT NOT NULL DEFAULT '',
  sort_order   INTEGER NOT NULL DEFAULT 0,
  is_thumbnail INTEGER NOT NULL DEFAULT 0,
  is_hover     INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_product_images_slug ON product_images(product_slug, sort_order);

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

CREATE TABLE IF NOT EXISTS media (
  path         TEXT PRIMARY KEY,
  alt          TEXT,
  role         TEXT,
  width        INTEGER,
  height       INTEGER,
  bytes        INTEGER,
  used_in_json TEXT
);

CREATE TABLE IF NOT EXISTS media_assets (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  path        TEXT NOT NULL UNIQUE,
  alt         TEXT NOT NULL DEFAULT '',
  folder      TEXT NOT NULL DEFAULT 'uploads',
  width       INTEGER,
  height      INTEGER,
  bytes       INTEGER,
  mime        TEXT NOT NULL DEFAULT 'image/webp',
  uploaded_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_media_folder ON media_assets(folder);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS audit_log (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      BIGINT REFERENCES users(id) ON DELETE SET NULL,
  action       TEXT NOT NULL,
  entity       TEXT NOT NULL,
  entity_id    TEXT,
  payload_json TEXT,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);

CREATE TABLE IF NOT EXISTS customer_sessions (
  id          TEXT PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  ip          TEXT,
  ua          TEXT
);
CREATE INDEX IF NOT EXISTS idx_cust_sessions_customer ON customer_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_cust_sessions_exp ON customer_sessions(expires_at);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  source     TEXT NOT NULL DEFAULT 'footer',
  status     TEXT NOT NULL DEFAULT 'subscribed'
               CHECK (status IN ('subscribed','unsubscribed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS webhook_events (
  event_id    TEXT PRIMARY KEY,
  provider    TEXT NOT NULL DEFAULT 'razorpay',
  event_type  TEXT,
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS checkout_idempotency (
  key        TEXT PRIMARY KEY,
  order_id   TEXT NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Migration bookkeeping (forward-only; replaces SQLite re-run-every-boot).
CREATE TABLE IF NOT EXISTS schema_migrations (
  version    TEXT PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO schema_migrations (version) VALUES ('0001_baseline')
  ON CONFLICT (version) DO NOTHING;

COMMIT;
