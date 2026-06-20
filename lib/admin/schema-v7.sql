-- Category-aware filters (v7)
CREATE TABLE IF NOT EXISTS category_filters (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  field_key TEXT NOT NULL,
  filter_type TEXT NOT NULL DEFAULT 'checkbox',
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE(category_id, name)
);

CREATE TABLE IF NOT EXISTS filter_options (
  id BIGSERIAL PRIMARY KEY,
  filter_id BIGINT NOT NULL REFERENCES category_filters(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  label TEXT,
  color_hex TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE(filter_id, value)
);
