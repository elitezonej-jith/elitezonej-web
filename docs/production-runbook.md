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

## Phase 3 — verify durability & parity (DONE)

- ✅ Local SQLite path: `npm run build` green (22/22 static).
- ✅ Postgres parity + durability + RF-9 concurrency: `npm run db:verify`
  **12/12 passed** on the Neon verify branch (temp-table semantic checks +
  two-client concurrent-claim race + self-cleaning durability probe).
- ✅ Security code audit: 10 money-safety invariants preserved; the one
  concurrency regression found was fixed in **RF-9** (claim-first atomic
  `fulfilOrderPaid`).
- ✅ `db:seed` reconfirmed from this repo on the verify branch (owner exists).

Re-run anytime: `DATABASE_URL='<verify-branch url>' npm run db:verify` →
expect `12 passed, 0 failed`.

## Phase 4 — durability gate (DONE, RF-7)

`isDurablePersistence()` replaced the old `VERCEL`-keyed hard-disable. Live
Razorpay is taken **iff** `DB_DRIVER=postgres` AND a fresh `SELECT 1` +
`schema_migrations` probe succeeds; fail-closed otherwise (per-call probe, so a
DB outage immediately re-closes the gate). Offline/sandbox self-disable
unchanged. Code complete; activation is purely the env flip in cutover below.

## Phase 5 — integration

### Part B — Razorpay test-keys lifecycle dry run (run LOCALLY)

Do this off-Vercel so the durability gate is exercised honestly (`VERCEL`
unset locally → gate decided by DB_DRIVER + probe, not platform).

1. Razorpay **Test Mode** dashboard → copy test `key_id` / `key_secret`.
   Settings → Webhooks → add a webhook → URL = a tunnel to your local app
   (e.g. `cloudflared tunnel --url http://localhost:3000` →
   `https://<tunnel>/api/webhooks/razorpay`); subscribe to
   `payment.captured`, `order.paid`, `payment.failed`; set a webhook secret.
2. Build + start against the **verify branch** with test keys:
   ```bash
   DB_DRIVER=postgres DATABASE_URL='<verify-branch pooled url>' \
     RAZORPAY_KEY_ID='rzp_test_…' RAZORPAY_KEY_SECRET='…' \
     NEXT_PUBLIC_RAZORPAY_KEY_ID='rzp_test_…' \
     RAZORPAY_WEBHOOK_SECRET='<the webhook secret>' \
     CHECKOUT_TOKEN_SECRET='<stable ≥16-char>' \
     npm run build && \
   DB_DRIVER=postgres DATABASE_URL='<verify-branch pooled url>' \
     RAZORPAY_KEY_ID='rzp_test_…' RAZORPAY_KEY_SECRET='…' \
     NEXT_PUBLIC_RAZORPAY_KEY_ID='rzp_test_…' \
     RAZORPAY_WEBHOOK_SECRET='<the webhook secret>' \
     CHECKOUT_TOKEN_SECRET='<stable ≥16-char>' \
     npm start
   ```
3. Browser `http://localhost:3000`: add item → checkout → the **real
   Razorpay test modal** must open (proves the gate now permits live mode on
   durable Postgres). Pay with a Razorpay test card.
4. Assert the full money path:
   - Receipt page shows success; order `payment_status='paid'` **once**.
   - Webhook delivered (tunnel/log) → reconciled; re-deliver the same event
     from the Razorpay dashboard → **no double effect** (idempotent).
   - `/admin` (seeded owner): order `paid`, **stock decremented exactly
     once**, customer `total_orders/total_spent` bumped once, promo
     `usage_count` once (if used).
   - Mismatch check (optional): the amount-reconcile path logs
     `payment_amount_mismatch*` and leaves the order unpaid on a forced
     mismatch.
5. Negative gate check: stop the DB / unset `DATABASE_URL` and retry checkout
   → must fail with “Live payments are disabled …”, **no order, no charge**.

Record pass/fail. This is the QA + Security live sign-off for the money path.

### Durability-only cutover — NO Razorpay keys (RECOMMENDED FIRST)

Goes live with durable Postgres in **offline/sandbox payment mode** (orders
persist durably; no card charge). Razorpay is simply not configured → the
durability gate is never consulted (it only guards the razorpay branch).
Part B is **not** required for this. Owner — Joyfernandas Vercel account:

1. Vercel → Production env: `DB_DRIVER=postgres`, **production** pooled
   `DATABASE_URL` (NOT the verify branch), `DATABASE_POOL_MAX=3`,
   `CHECKOUT_TOKEN_SECRET` (stable ≥16 chars — still needed: it signs the
   sandbox/receipt token; a per-process fallback breaks across instances).
   Do **NOT** set any `RAZORPAY_*` yet.
2. Against the **production** DB once (direct URL):
   `DATABASE_URL='<prod DIRECT url>' npm run db:migrate` then
   `… SEED_OWNER_EMAIL/PASSWORD/NAME … npm run db:seed`
   (optionally `… npm run db:verify`).
3. Merge `feat/postgres-migration` → `master`, push (owner-run) → Vercel
   auto-deploys. Migrations are idempotent on boot.
4. Smoke: place a sandbox order; confirm it appears in `/admin`; trigger a
   redeploy (cold start) and confirm the order **is still there** — durability
   proven in production. Sign in as the seeded owner and rotate the password.

Later, when Razorpay keys arrive → do **Part B** (test keys, locally), then
the section below adds only the `RAZORPAY_*` env vars + live webhook and a
redeploy. **No code change, no new migration** — the gate auto-permits live
payments once durable Postgres + keys coexist.

### Full payments cutover (owner — when Razorpay keys are in hand)

Only after Part B passes:

1. Vercel → Production env: `DB_DRIVER=postgres`, **production** pooled
   `DATABASE_URL` (NOT the verify branch), `DATABASE_POOL_MAX=3`,
   `CHECKOUT_TOKEN_SECRET` (stable), Razorpay **live**
   `RAZORPAY_KEY_ID/SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`,
   `RAZORPAY_WEBHOOK_SECRET`.
2. Run once against the **production** DB (direct URL):
   `DATABASE_URL='<prod DIRECT url>' npm run db:migrate` then
   `… SEED_OWNER_EMAIL/PASSWORD/NAME … npm run db:seed`. Optionally
   `… npm run db:verify` (safe — temp tables + self-cleaning marker).
3. Razorpay **live** dashboard → webhook → `https://<prod-domain>/api/
   webhooks/razorpay`, same events, matching `RAZORPAY_WEBHOOK_SECRET`.
4. Merge `feat/postgres-migration` → `master`, push (owner-run), let Vercel
   auto-deploy. First request runs migrations-idempotent; gate flips live.
5. Smoke: one real low-value order end-to-end; confirm Admin + webhook;
   sign in as seeded owner and **rotate the password**.

## Rollback (authoritative, any phase incl. post-cutover)

- **Instant revert:** set `DB_DRIVER=sqlite` in Vercel (Preview/Prod) +
  redeploy → prior guarded, in-memory behavior; the durability gate then
  returns false so **live payments auto-disable** (fail-closed) — no code
  change or redeploy of app logic needed. Postgres data is left intact and
  resumes on the next `DB_DRIVER=postgres`. (Note: orders taken while reverted
  to sqlite are NOT durable — treat sqlite revert as an emergency stop, not a
  steady state.)
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
