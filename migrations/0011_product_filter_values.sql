BEGIN;

CREATE TABLE IF NOT EXISTS product_filter_values (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_slug TEXT NOT NULL REFERENCES products(slug) ON DELETE CASCADE,
  filter_id   BIGINT NOT NULL REFERENCES category_filters(id) ON DELETE CASCADE,
  option_id   BIGINT NOT NULL REFERENCES filter_options(id) ON DELETE CASCADE,
  UNIQUE(product_slug, option_id)
);
CREATE INDEX IF NOT EXISTS idx_pfv_product ON product_filter_values(product_slug);
CREATE INDEX IF NOT EXISTS idx_pfv_option ON product_filter_values(option_id);
CREATE INDEX IF NOT EXISTS idx_pfv_filter ON product_filter_values(filter_id);

INSERT INTO schema_migrations (version) VALUES ('0011_product_filter_values')
ON CONFLICT DO NOTHING;

COMMIT;
