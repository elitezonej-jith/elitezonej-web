BEGIN;

DELETE FROM homepage_blocks WHERE type = 'service_cards';

INSERT INTO schema_migrations (version) VALUES ('0006_remove_service_cards');

COMMIT;
