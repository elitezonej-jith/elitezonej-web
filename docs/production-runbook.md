# Production Runbook — Elite Zone J

Living document. **Phase 1 below is the owner-run prerequisite that blocks all
migration coding.** Phases 2–5 (code) are filled in as they land. The Rollback
section is authoritative now. Strategy: `docs/postgres-migration-plan.md`.
Approved plan: `~/.claude/plans/objective-take-the-app-immutable-pearl.md`.

---

## Phase 1 — Provision Neon + env (OWNER-RUN, blocking)

Must be done by whoever owns the **Joyfernandas Vercel account** the production
project deploys from. It cannot be done from the `wesorters01-4123` CLI login
that was active in the working session. Until `DATABASE_URL` is provisioned and
verifiable, **no migration code is written** — the sync→async port cannot be
runtime-verified blind, and not landing it blind is a deliberate safety stance
(matches the original foundation commit's reasoning).

SQLite stays the live path throughout: `DB_DRIVER` stays `sqlite`. None of
these steps change app behavior; they only stand up infrastructure.

### 1.1 Provision Neon via Vercel Marketplace

1. Vercel dashboard → **Joyfernandas** team → production project → **Storage**
   (or **Integrations → Marketplace**) → add **Neon** (Serverless Postgres).
2. Capture **both** Neon connection strings:
   - **Pooled** (host contains `-pooler`, PgBouncer transaction mode) →
     runtime, used by `lib/db/sql.ts`.
   - **Direct / unpooled** → migrations only (DDL + multi-statement
     transactions need a real session, not the transaction-mode pooler).
3. Create a Neon **branch** (e.g. `verify`) off main. All Phase 3 verification
   runs on the branch so the production DB is untouched until the deliberate
   `DB_DRIVER` flip.

### 1.2 Set environment variables (Vercel: Preview + Production, and local)

Vercel project → **Settings → Environment Variables**, for **Preview** and
**Production**:

| Var | Value | Notes |
|---|---|---|
| `DB_DRIVER` | `sqlite` | Stays `sqlite` now. Flip to `postgres` only at the gated cutover (Phase 4/5). |
| `DATABASE_URL` | Neon **pooled** URL | Runtime connection. Required before live payments can ever be enabled. |
| `DATABASE_POOL_MAX` | `3` | Optional; small pool for Fluid Compute. |
| `CHECKOUT_TOKEN_SECRET` | random ≥16 chars (`openssl rand -hex 24`) | **Mandatory** in durable multi-instance prod — no per-process fallback. |
| `RAZORPAY_KEY_ID` | live key id | Phase 4 go-live; use **test** keys in Preview for the dry run. |
| `RAZORPAY_KEY_SECRET` | live key secret | — |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook secret | Unset while keys set ⇒ ALL webhooks rejected (fail-closed, by design). |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | same as `RAZORPAY_KEY_ID` | Browser checkout. |
| `ADMIN_BOOTSTRAP_PASSWORD` | initial owner pw (≥8) | SQLite-path seed only; Postgres path uses `SEED_OWNER_*` below. |

Local: copy `.env.example` → `.env.local`, keep `DB_DRIVER=sqlite`; set
`DATABASE_URL` to the **branch** URL only when testing the Postgres path
locally. The migration **direct** URL is passed inline to the commands below —
never committed.

### 1.3 Baseline migration + seed against the Neon branch

```bash
DATABASE_URL='<neon BRANCH DIRECT url>' npm run db:migrate
DATABASE_URL='<neon BRANCH DIRECT url>' \
  SEED_OWNER_EMAIL='you@domain.com' \
  SEED_OWNER_PASSWORD='<a real strong password>' \
  SEED_OWNER_NAME='Owner' \
  npm run db:seed
```

- `db/migrate.mjs`: forward-only, idempotent (skips versions in
  `schema_migrations`); applies `0001_baseline.sql` then
  `0002_customer_addresses.sql`.
- `db/seed.mjs`: idempotent (`ON CONFLICT DO NOTHING`); owner user + base
  settings only. **Set `SEED_OWNER_PASSWORD`** — fallback is literal
  `admin123` (script warns). No orders/products seeded (catalog code-resident;
  greenfield — no fake orders look real).

### 1.4 Connectivity check (Phase 1 acceptance)

```bash
DATABASE_URL='<neon BRANCH POOLED url>' node -e "import('postgres').then(async({default:p})=>{const s=p(process.env.DATABASE_URL,{max:1,prepare:false});console.log(await s\`select version()\`);console.log(await s\`select count(*) from schema_migrations\`);await s.end()})"
```

**Phase 1 is done when:** Neon provisioned (pooled + direct + `verify`
branch); env set in Preview + Production (`DB_DRIVER` still `sqlite`);
`db:migrate` + `db:seed` succeed on the branch; the probe returns a version and
non-empty `schema_migrations`. Report these outputs back — that unblocks RF-1.

---

## Phase 2 — async port (DONE, inert)

Full sync→async port landed behind `DB_DRIVER` (commit on
`feat/postgres-migration`). `DB_DRIVER=sqlite` stays default → runtime
unchanged. `npx tsc --noEmit` 0 errors; `npm run build` succeeds (SQLite path,
22/22 static pages). Runtime parity/durability NOT yet proven — that is Phase 3.

## Phase 3 — verify durability & parity (BLOCKING, owner-run for Postgres)

Local SQLite path: verified via `npm run build` (green).

Postgres path — run against the Neon **verify branch** (never production):

```bash
DATABASE_URL='<neon VERIFY-branch url>' npm run db:migrate   # if not already
DATABASE_URL='<neon VERIFY-branch url>' npm run db:verify
```

`db:verify` (db/verify.mjs) asserts, with zero impact on real data
(temp tables + a self-deleting marker):
- migrations applied; payments/webhook/idempotency constraints exist;
- guarded stock decrement affects 0 rows when insufficient (no oversell);
- `CASE` floor clamp; `ON CONFLICT (pk) DO NOTHING` idempotency (count 1 then 0);
- `RETURNING id`; `CURRENT_TIMESTAMP`;
- durability: a row written, then read back over a brand-new connection.

Expected: `N passed, 0 failed` (exit 0). Paste the output back.

Still owed before Phase 4 sign-off: (a) re-confirm `db:seed` ran from THIS
repo against the verify branch (owner user exists), (b) a full
order→pay→webhook→reconcile lifecycle dry run with Razorpay **test** keys in a
Preview deploy on `DB_DRIVER=postgres`. Both QA and Security must sign off.

## Phases 4–5

Live payments stay disabled until Phase 4’s durability gate (RF-7, replaces the
`isEphemeralPersistence()` hard-disable) — gated on Phase 3 sign-off + explicit
user approval.

## Rollback (authoritative, every phase ≤ 4)

- **Instant revert:** set `DB_DRIVER=sqlite` in Vercel (Preview/Prod) +
  redeploy → prior guarded, ephemeral behavior; live payments auto-disable via
  the durability gate. No data-loss concern (ephemeral had none).
- **Bad migration:** never edit an applied file; add a new forward versioned
  migration; verify on the Neon `verify` branch first.
- **Production DB untouched** until the deliberate `DB_DRIVER=postgres` flip;
  all prior verification uses the branch.

---

## Appendix — Money-path env reference (still current)

| Variable | Purpose | If unset |
|---|---|---|
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay order creation + checkout signature verification. | Live payments cannot be created; checkout falls back to the disabled/sandbox path. |
| `RAZORPAY_WEBHOOK_SECRET` | HMAC for `POST /api/webhooks/razorpay`. Webhook **fail-closes** (HTTP 400, logged) when keys are live but this is unset. | Webhook rejects all events. Client `confirmPayment` still reconciles amount, but the webhook is authoritative — **set before go-live.** |
| `CHECKOUT_TOKEN_SECRET` | HMAC for the order-receipt / mock-pay token (closes the receipt IDOR). | Per-process random secret: tokens don’t validate across instances/restarts. **Must be stable** in durable prod. |
| `ADMIN_BOOTSTRAP_PASSWORD` | Initial owner password (SQLite seed path). | Random one-time pw printed once to logs on first seed. Min 8 chars. |

### By-design note (updated)

Pre-cutover, on Vercel the SQLite DB is in-memory and resets every cold start;
live payments are intentionally hard-disabled via `isEphemeralPersistence()`.
This cutover **resolves** that (durable Neon Postgres) rather than working
around it; the hard-disable is replaced by the Phase 4 durability gate. Until
`DB_DRIVER=postgres` is flipped, the by-design ephemeral behavior still stands.

### Pre-go-live checklist (Phase 4/5 gate)

1. All money-path vars set (especially `RAZORPAY_WEBHOOK_SECRET`).
2. Durability proven on Postgres (Phase 3 sign-off) — not the in-memory fallback.
3. Sign in as seeded owner; rotate the password.
4. Razorpay webhook endpoint → `/api/webhooks/razorpay` with the matching secret.
5. Durability gate verified to refuse payments when the DB is unreachable.
