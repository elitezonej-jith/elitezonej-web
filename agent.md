# Agent Rules

## Database Safety

**Never** perform any database-related operation without explicit user approval first. This includes:

- Running migrations (`db:migrate`, schema changes)
- Seeding data (`db:seed`, inserting/updating rows)
- Modifying `lib/admin/db.ts`, schema files, or seed files
- Directly querying or mutating the database via scripts
- Changing `DB_DRIVER`, `DATABASE_URL`, or any DB-related env vars
- Altering repo files (`lib/admin/repos/*`) in ways that change query behavior

Local and production share the same Neon Postgres database. Any write is a production write.

Before any DB-related change, you MUST:

1. **Explain clearly** what you intend to do, why, and what data/tables will be affected
2. **Show the exact SQL or code** that will run against the database
3. **State the risk** — whether it's reversible, whether it touches production data
4. **Wait for explicit approval** — do not proceed until the user says yes
