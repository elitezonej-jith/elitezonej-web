# Postgres Migration Plan — elitezonej

**Status:** foundation landed (inert) · **Author:** backend audit follow-up · **Date:** 2026-05-17

## 0. Progress

Provider-independent foundation is in place and **inert** — SQLite
(`lib/admin/db.ts`) is still the only active path; nothing imports the new
layer, so the live (guarded) deployment is unaffected:

- `postgres@^3` dependency added.
- `lib/db/sql.ts` — async shim (`sql.get/all/run/tx`, `?`→`$n` rewriter,
  pooled client). Dormant.
- `migrations/0001_baseline.sql` — full Postgres-dialect schema (v1+v2+v3
  consolidated) **with the audit's integrity hardening folded in** (money
  CHECKs, `orders` total invariant, stock/qty CHECKs, `schema_migrations`
  bookkeeping). `order_items.product_slug` deliberately left a SOFT ref —
  the catalog is partly code-resident, a hard FK would break checkout.
- `db/migrate.mjs` + `db/seed.mjs` (+ `npm run db:migrate` /
  `db:seed`), zero extra tooling.
- `.env.example` documents `DB_DRIVER` (default `sqlite`), `DATABASE_URL`
  (pooled), seed vars, and `CHECKOUT_TOKEN_SECRET`.

**Remaining (gated on a provisioned `DATABASE_URL` for verification):** port
the 24 repos to `await sql.*` (mechanical, `tsc`-guarded), wire `getDb()` to
honour `DB_DRIVER`, verify the 13 transactions against a Neon branch DB, then
flip the flag in Preview → Production. Not landed blind because it cannot be
runtime-verified without the database.

## 1. Why

`lib/admin/db.ts` falls back to in-memory SQLite on Vercel (`VERCEL === "1"`),
so orders/payments/sessions are destroyed on every cold start. The
`c374ab6` guard now *hard-refuses live payments* in that mode, so there is no
unsafe state — but real payments on Vercel stay blocked until a durable,
shared database exists. This plan moves persistence to Postgres.

## 2. The one hard problem: sync → async

`better-sqlite3` is **synchronous** (`.prepare().get()/.all()/.run()`,
`db.transaction()`), and every one of the **24 repos / 210 prepare sites / 13
transactions** is a synchronous `export function`. Every Postgres Node driver
is **asynchronous**. This is ~90% of the migration effort. Data movement is
**zero** — production is ephemeral, so this is a greenfield cutover, not an
ETL.

## 3. Scope decision (pick one)

| Option | Churn | Durability | Recommendation |
|---|---|---|---|
| **A. Full async port** — all 24 repos → async, `await` everywhere | High (mechanical) | Everything durable | **Recommended** if Vercel stays the host |
| **B. Persistent-disk host** (Fly/Render/Railway volume) — keep `better-sqlite3` as-is | ~Zero code | Everything durable | Fastest path; abandons Vercel-native deploy |
| **C. Hybrid** — only the transactional cluster on Postgres, CMS stays SQLite | Medium | Commerce durable, admin/studio edits still ephemeral | Only if A is too big to schedule |

The rest of this plan assumes **Option A** (the user asked for a Postgres
migration). Option B is noted as the lower-risk fallback if timeline matters
more than staying on Vercel.

## 4. Target stack

- **Database:** Neon (Postgres) via the Vercel Marketplace integration —
  serverless-native, autoscaling, built-in connection pooler. Alternatives:
  Supabase, Vercel Postgres-compatible Marketplace options. Any managed
  Postgres with a **pooled** connection string works.
- **Driver:** `postgres` (postgres.js) — small, fast, tagged-template or
  parameterised queries, good serverless story. (Neon's
  `@neondatabase/serverless` is an alternative for HTTP-only edge; we run
  Node/Fluid Compute so plain `postgres` over the pooled URL is simplest.)
- **Pooling:** use Neon's **pooled** endpoint (PgBouncer, transaction mode).
  Driver configured with a small `max` (e.g. 1–5) because Fluid Compute reuses
  instances; never hold a growing pool across invocations.
- **Migrations:** versioned SQL files run by a one-shot script
  (`db/migrate.mjs`) or `node-pg-migrate`. **Stop** runtime
  schema-bootstrap-on-every-open; Postgres wants versioned, forward-only
  migrations.
- **ORM:** none. Keep raw SQL behind a thin async shim (below) to minimise
  per-repo rewrite and preserve the current code style. Drizzle is optional
  later; it would add churn now.

## 5. Architecture: a drop-in async shim

Replace `getDb()` with an async query layer that mirrors the existing
verbs so repo bodies change minimally:

```
// lib/admin/db.ts (new shape)
export const sql = {
  get<T>(text: string, params?: unknown[]): Promise<T | null>
  all<T>(text: string, params?: unknown[]): Promise<T[]>
  run(text: string, params?: unknown[]): Promise<{ rowCount: number; rows: any[] }>
  tx<T>(fn: (t: Tx) => Promise<T>): Promise<T>   // BEGIN/COMMIT/ROLLBACK
}
```

Per-repo change is then mechanical:
`getDb().prepare(S).get(a,b)` → `await sql.get(S, [a,b])`, and the function
signature gains `async` / `Promise<...>`. Server actions and route handlers
are already `async`, so callers just add `await`.

## 6. SQL dialect translation (exhaustive checklist)

| SQLite | Postgres | Sites |
|---|---|---|
| `?` placeholders | `$1, $2, …` | 210 — do in the shim, not by hand (positional rewriter) |
| `datetime('now')` | `now()` (store `timestamptz`) | many — global replace |
| `INTEGER PRIMARY KEY AUTOINCREMENT` | `BIGINT GENERATED ALWAYS AS IDENTITY` | 7 |
| `lastInsertRowid` | `INSERT … RETURNING id` | 11 |
| `INSERT OR IGNORE` | `INSERT … ON CONFLICT DO NOTHING` | 4 |
| `INSERT OR REPLACE` / upserts | `ON CONFLICT (key) DO UPDATE SET …` | audit each `upsert*` repo |
| `.changes` / `r.changes === 1` | `result.rowCount` | 14 |
| `db.pragma('journal_mode'|'foreign_keys')` | delete (FKs enforced by default) | 2 |
| `0/1` boolean columns | keep `integer` initially (least churn) or `boolean` | `is_*` columns |
| `TEXT` timestamps | `timestamptz` | orders/payments/sessions/* |
| `COLLATE NOCASE` (email) | `citext` extension **or** `lower()` unique index | customers/users email |
| `CREATE TABLE IF NOT EXISTS` | fine, but move into versioned migrations | schema.sql/v2/v3 |
| text `id` PKs (`EZJ-…`, `pay_…`) | keep `text` PK — no change | orders/payments |

## 7. Schema port

1. Consolidate `schema.sql` + `schema-v2.sql` + `schema-v3.sql` into a single
   ordered baseline migration `migrations/0001_baseline.sql` (Postgres
   dialect), since there is no existing data and no need to replay the v1→v3
   ALTER history.
2. **Add the integrity constraints the audit flagged** while we own the
   schema (now cheap — empty DB):
   - `payments`: `CHECK (amount >= 0)`, keep `provider_order_id` UNIQUE
     (Postgres treats multiple NULLs as distinct — matches current intent).
   - `orders`: `CHECK (total >= 0)`, optionally
     `CHECK (total = subtotal - discount + shipping + tax)`; drop
     `NOT NULL DEFAULT ''` masking on `email`/`ship_*` (enforce non-empty).
   - `order_items`: real `REFERENCES products(slug)` (decide ON DELETE
     RESTRICT vs keep soft ref).
   - Indexes: `payments(provider_order_id)`, `orders(customer_id)`,
     `customer_sessions(expires_at)`, `webhook_events(event_id)` (PK already),
     `checkout_idempotency(key)` (PK already).
3. Keep table/column names identical so repo SQL is otherwise untouched.

## 8. Seed (replaces SQLite auto-seed)

Production has no data, so cutover needs a **seed script**
(`db/seed.mjs`) that creates: default owner user (env-driven creds),
store settings row, and the authored catalog (products/categories/etc. from
the existing seed source). Run once post-migrate, idempotently
(`ON CONFLICT DO NOTHING`).

## 9. Transactions — the risk cluster

13 `db.transaction()` blocks. The critical one is
`fulfilOrderPaid` (orders.ts) — single transaction over: stock decrement
(guarded `WHERE stock >= ?`), order status, promo usage, customer lifetime
totals, payment settle. Port notes:
- Wrap in `sql.tx(async t => { … })`; the guarded
  `UPDATE … WHERE stock >= ? RETURNING` → check `rowCount === 0` to throw &
  roll back (same semantics as today's `r.changes === 0`).
- Postgres gives **real concurrency** (multi-instance safe) — a genuine
  improvement over single-writer SQLite; consider `SELECT … FOR UPDATE` on
  the order row to serialise concurrent confirm+webhook (idempotency guard
  already covers correctness; this tightens it).
- Other 12: reorder/setThumbnail/setHover/setInventory/setFabricColours/
  createPendingOrder(order+items) — straight port.

## 10. Connection lifecycle (serverless)

- Singleton client per instance on `globalThis` (like the current
  `global.__ezj_admin_db`) but pointing at a **pooled** Postgres URL.
- `max` small; idle timeout short; `connect_timeout` set; rely on Neon
  pooler for fan-out across Fluid Compute instances.
- Remove `IS_SERVERLESS` in-memory branch and the `isEphemeralPersistence()`
  guard's *blocking* behaviour once Postgres is live (keep the function but it
  returns false in prod). The live-payment refuse guard stays as a safety net
  keyed on "DB unreachable" instead.

## 11. Rollout sequence

1. Provision Neon (or chosen provider) via Vercel Marketplace; capture
   **pooled** `DATABASE_URL` (+ direct URL for migrations) into Vercel env
   (Preview + Production) and `.env.local`.
2. Land the async shim + dialect rewriter in `lib/admin/db.ts` behind a
   `DB_DRIVER=postgres|sqlite` flag (sqlite path stays for local dev until
   parity proven).
3. Port repos folder-by-folder (commerce-critical first: `orders`,
   `payments`, `webhook-events`, `customer-auth`, `customers`, `users`,
   sessions; then catalog/CMS). Add `await` at call sites; `tsc` after each.
4. Add `migrations/` + `db/migrate.mjs` + `db/seed.mjs`; wire
   `migrate` into the deploy (Vercel build step or a one-shot job — **not**
   on every request).
5. Verify the 13 transactions, esp. `fulfilOrderPaid` and the Razorpay
   webhook (amount reconcile + idempotency) against a Neon branch DB.
6. Flip `DB_DRIVER=postgres` in Preview → smoke test full checkout
   (sandbox + a Razorpay test order) → Production. Remove SQLite path after a
   soak period.
7. Pair with the **shared rate-limit store** (Upstash Redis) while infra is
   being provisioned — same serverless-instance argument; out of scope here
   but should ship alongside.

## 12. Effort & risk

- **Effort:** shim + migrations ≈ 1–2 days; repo port ≈ 2–4 days (mechanical,
  `tsc`-guarded); transaction verification ≈ 1 day. Total ≈ 1 working week.
- **Risk:** low-correctness / high-tedium. Biggest watch items: transaction
  semantics in `fulfilOrderPaid`, the positional-param rewriter, `upsert*`
  conflict targets, and email case-collation. No data-loss risk (greenfield).
- **Reversible:** the `DB_DRIVER` flag keeps SQLite working throughout; cutover
  is a flag flip, rollback is the reverse.

## 13. What I need from you to start

1. Choose & provision the provider (Neon recommended) and add `DATABASE_URL`
   (pooled) + a direct URL to Vercel env.
2. Confirm Option A (full port) vs C (hybrid) — A recommended.
3. Confirm whether to fold the audit's schema CHECK/FK hardening into the
   baseline (recommended — free now).

Once (1) is done I can land steps 2–4 behind the flag without affecting the
live (guarded) deployment.
