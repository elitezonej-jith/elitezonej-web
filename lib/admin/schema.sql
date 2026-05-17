-- Elite Zone J — admin panel schema. Loaded once on first DB open.

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  name            TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner','staff')),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at   TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id           TEXT PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at   TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  ip           TEXT,
  ua           TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_exp  ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS products (
  slug           TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  cat            TEXT NOT NULL DEFAULT '',
  cat_link       TEXT NOT NULL DEFAULT 'Men',
  price          INTEGER NOT NULL DEFAULT 0,
  sale_price     INTEGER,
  line           TEXT NOT NULL DEFAULT '',
  sizes_json     TEXT NOT NULL DEFAULT '[]',
  features_json  TEXT NOT NULL DEFAULT '[]',
  spec_json      TEXT NOT NULL DEFAULT '[]',
  note           TEXT NOT NULL DEFAULT '',
  fit            TEXT NOT NULL DEFAULT '',
  fabric         TEXT NOT NULL DEFAULT '',
  occasion       TEXT NOT NULL DEFAULT '',
  badge          TEXT,
  gender         TEXT NOT NULL DEFAULT 'unisex',
  category       TEXT NOT NULL DEFAULT '',
  sub            TEXT,
  kind           TEXT NOT NULL DEFAULT 'tailored' CHECK (kind IN ('tailored','fabric')),
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','draft','archived')),
  description    TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_products_kind   ON products(kind);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_cat    ON products(category);

CREATE TABLE IF NOT EXISTS inventory (
  product_slug TEXT NOT NULL REFERENCES products(slug) ON DELETE CASCADE,
  size         TEXT NOT NULL,
  stock        INTEGER NOT NULL DEFAULT 0,
  oos_flag     INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (product_slug, size)
);

CREATE TABLE IF NOT EXISTS fabric_meta (
  product_slug        TEXT PRIMARY KEY REFERENCES products(slug) ON DELETE CASCADE,
  width_inches        INTEGER NOT NULL DEFAULT 58,
  gsm                 INTEGER NOT NULL DEFAULT 0,
  composition         TEXT NOT NULL DEFAULT '',
  care                TEXT NOT NULL DEFAULT '',
  origin              TEXT NOT NULL DEFAULT '',
  stock_meters_total  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS fabric_colours (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  product_slug  TEXT NOT NULL REFERENCES products(slug) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  hex           TEXT NOT NULL,
  stock_meters  INTEGER NOT NULL DEFAULT 0,
  image_dir     TEXT,
  sort_order    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_fabric_colours_slug ON fabric_colours(product_slug);

CREATE TABLE IF NOT EXISTS customers (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,
  first_name    TEXT NOT NULL DEFAULT '',
  last_name     TEXT NOT NULL DEFAULT '',
  phone         TEXT,
  city          TEXT,
  total_orders  INTEGER NOT NULL DEFAULT 0,
  total_spent   INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Saved shipping address book. Scoped to the owning customer; the app only
-- ever queries WHERE customer_id = <server-resolved session id>. Exactly one
-- row per customer carries is_default = 1 (enforced transactionally in
-- repos/addresses.ts, not by a DB constraint).
CREATE TABLE IF NOT EXISTS addresses (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id   INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label         TEXT NOT NULL DEFAULT '',
  first_name    TEXT NOT NULL DEFAULT '',
  last_name     TEXT NOT NULL DEFAULT '',
  line1         TEXT NOT NULL DEFAULT '',
  line2         TEXT NOT NULL DEFAULT '',
  city          TEXT NOT NULL DEFAULT '',
  state         TEXT NOT NULL DEFAULT '',
  pincode       TEXT NOT NULL DEFAULT '',
  country       TEXT NOT NULL DEFAULT 'India',
  is_default    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_addresses_customer ON addresses(customer_id);

CREATE TABLE IF NOT EXISTS orders (
  id           TEXT PRIMARY KEY,
  customer_id  INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'new'
                CHECK (status IN ('new','confirmed','in_atelier','shipped','fulfilled','cancelled')),
  subtotal     INTEGER NOT NULL DEFAULT 0,
  tax          INTEGER NOT NULL DEFAULT 0,
  total        INTEGER NOT NULL DEFAULT 0,
  currency     TEXT NOT NULL DEFAULT 'INR',
  notes        TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_orders_status   ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created  ON orders(created_at);

CREATE TABLE IF NOT EXISTS order_items (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id      TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_slug  TEXT NOT NULL,
  qty           INTEGER NOT NULL DEFAULT 1,
  unit_price    INTEGER NOT NULL DEFAULT 0,
  size          TEXT,
  colour        TEXT,
  is_fabric     INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

CREATE TABLE IF NOT EXISTS bookings (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name    TEXT NOT NULL DEFAULT '',
  last_name     TEXT NOT NULL DEFAULT '',
  phone         TEXT NOT NULL DEFAULT '',
  email         TEXT,
  city          TEXT NOT NULL DEFAULT '',
  service       TEXT NOT NULL DEFAULT '',
  message       TEXT,
  status        TEXT NOT NULL DEFAULT 'new'
                  CHECK (status IN ('new','contacted','scheduled','done','closed')),
  source        TEXT NOT NULL DEFAULT 'web',
  assigned_to   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_bookings_status  ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at);

CREATE TABLE IF NOT EXISTS categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id   INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  gender      TEXT,
  kind        TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_categories_slug_parent ON categories(slug, IFNULL(parent_id,0));

CREATE TABLE IF NOT EXISTS promotions (
  code         TEXT PRIMARY KEY,
  type         TEXT NOT NULL CHECK (type IN ('percent','flat','free_ship')),
  value        INTEGER NOT NULL DEFAULT 0,
  starts_at    TEXT,
  ends_at      TEXT,
  min_total    INTEGER NOT NULL DEFAULT 0,
  usage_limit  INTEGER,
  usage_count  INTEGER NOT NULL DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active','scheduled','expired','disabled')),
  description  TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS home_sections (
  key          TEXT PRIMARY KEY,
  title        TEXT NOT NULL DEFAULT '',
  kicker       TEXT,
  body         TEXT,
  image_path   TEXT,
  link_text    TEXT,
  link_href    TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  enabled      INTEGER NOT NULL DEFAULT 1,
  extras_json  TEXT
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

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS audit_log (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action       TEXT NOT NULL,
  entity       TEXT NOT NULL,
  entity_id    TEXT,
  payload_json TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
