-- Category-aware filters (v7)
-- Migration repair: the original schema used BIGSERIAL (Postgres syntax) which
-- SQLite accepts but does NOT auto-generate IDs (all rows get id=NULL). If the
-- table exists with the broken schema we must drop and recreate. We detect the
-- broken state by checking if the table's PK column type is not INTEGER (SQLite
-- only auto-generates rowid when the column is exactly "INTEGER PRIMARY KEY").
-- Fresh DBs and already-fixed DBs are unaffected (CREATE TABLE IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS category_filters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  field_key TEXT NOT NULL,
  filter_type TEXT NOT NULL DEFAULT 'checkbox',
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE(category_id, name)
);

CREATE TABLE IF NOT EXISTS filter_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filter_id INTEGER NOT NULL REFERENCES category_filters(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  label TEXT,
  color_hex TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE(filter_id, value)
);
