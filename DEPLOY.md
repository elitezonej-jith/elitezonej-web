# Deploying Elite Zone J on your own server (Docker)

This is a **single Next.js 16 application** — the storefront, the Admin panel,
and the Studio panel all run from **one container**. There is no separate
frontend/backend to deploy.

The "build file" your DevOps engineer asked for is the **`Dockerfile`** in the
repository root. They build it once into an image, then run that image. They do
**not** need a separate compiled artifact — the build happens inside the image
so native modules compile for your server's OS.

---

## 1. Prerequisites

- Docker 20.10+ on the target server (or any host that can build & push images).
- Target architecture is almost always **linux/amd64**. If you build on an Apple
  Silicon Mac for an x86 server, build with `--platform linux/amd64`.
- A reverse proxy (nginx/Caddy/Traefik) in front of the container is recommended
  (TLS, rate limiting) — per the Next.js self-hosting guide. The container
  listens on **port 3000**.

---

## 2. Build the image

```bash
# from the repo root (where the Dockerfile is)
docker build -t elitezonej:latest \
  --build-arg NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_xxx" \
  .

# building on Apple Silicon for an x86 Linux server:
docker buildx build --platform linux/amd64 -t elitezonej:latest \
  --build-arg NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_xxx" .
```

> **Why the build-arg?** Any variable starting with `NEXT_PUBLIC_` is **baked
> into the browser bundle at build time** — it cannot be changed at runtime. The
> Razorpay *publishable* key is the only public var here. Everything else
> (secrets, DB URLs) is read at **runtime** from the env file below.

---

## 3. Create the runtime env file

Create `.env.production` on the server (do **not** commit it). Start from
`.env.example` in the repo. Minimum for a working deployment:

```env
# --- Security (required) ---
CHECKOUT_TOKEN_SECRET=<random string, >=16 chars>   # stable secret for order/checkout HMAC tokens
ADMIN_BOOTSTRAP_PASSWORD=<strong password>          # first owner login is bootstrapped from this

# --- Database driver: "sqlite" (default) or "postgres" (see §5) ---
DB_DRIVER=sqlite

# --- Payments (leave blank to run in offline/pending-order mode) ---
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# --- Uploads: leave BLOB unset to store images on the local volume (see §6) ---
# BLOB_READ_WRITE_TOKEN=

# --- Commerce policy (optional; defaults = free shipping, no tax) ---
# SHIPPING_FLAT_INR=0
# FREE_SHIP_OVER_INR=0
# TAX_RATE=0
```

---

## 4. Run the container

```bash
docker run -d --name elitezonej \
  -p 3000:3000 \
  --env-file .env.production \
  -v ezj_data:/app/data \
  -v ezj_uploads:/app/public/uploads \
  --restart unless-stopped \
  elitezonej:latest
```

The two volumes are **essential for persistence** (see below). Then point your
reverse proxy at `http://127.0.0.1:3000`.

---

## 5. Database — pick ONE

This is the most important decision. Self-hosting on a real server with a
**persistent disk** fixes the data-loss problem the app had on Vercel.

### Option A — SQLite (simplest, default)
- Set `DB_DRIVER=sqlite`.
- The DB file lives at `/app/data/admin.db` **inside the container**.
- The `-v ezj_data:/app/data` volume above is what makes it survive restarts and
  image upgrades. **Without that volume, all data is lost on restart.**
- The schema is created automatically on first boot; the first owner account is
  bootstrapped from `ADMIN_BOOTSTRAP_PASSWORD`.

### Option B — PostgreSQL  ← **this is what production already uses**
The **live site on Vercel already runs on Postgres (Neon)** — that is where all
current data (products, orders, customers) lives. To keep that data, point the
new server at the **same Neon database**. See §10 (Migrating from Vercel).
- Set in `.env.production`:
  ```env
  DB_DRIVER=postgres
  DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require   # pooled connection
  DATABASE_URL_UNPOOLED=postgres://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require  # direct, for migrations
  ```
- The exact values are in the Vercel project's Environment Variables (copy them
  over — see §10). Use the **same** Neon DB to inherit all existing data, or a
  fresh Neon/Postgres instance for a clean start.
- With Postgres you do **not** need the `ezj_data` volume.

> ⚠️ Do **not** have the new server and Vercel both taking real orders against
> the same database at the same time. Use the cutover sequence in §10.

---

## 6. Image uploads — local disk vs cloud

The Studio image uploader has two backends, chosen automatically:

- **`BLOB_READ_WRITE_TOKEN` unset (default for self-host):** uploads are written
  to `/app/public/uploads/...` on disk. The `-v ezj_uploads:/app/public/uploads`
  volume keeps them across restarts. **Without that volume, uploaded images
  vanish on restart.**
- **`BLOB_READ_WRITE_TOKEN` set:** uploads go to Vercel Blob (cloud). Only use
  this if you intend to keep using Vercel's storage.

For a fully self-contained on-prem deploy, leave Blob unset and rely on the
volume (and back the volume up like any other data).

---

## 7. One-off tasks (migrations / seed)

Run inside the running container (or as a one-shot `docker run ... <cmd>`):

```bash
# apply DB migrations (needed for Postgres; sqlite self-creates on boot)
docker exec elitezonej node db/migrate.mjs

# seed baseline/owner data (set SEED_OWNER_* in the env first if seeding prod)
docker exec elitezonej node db/seed.mjs
```

---

## 8. Health & logs

- Container healthcheck pings `/` every 30s — `docker ps` shows `healthy`.
- Logs: `docker logs -f elitezonej`.

---

## 9. How to hand this off

Everything the DevOps engineer needs is **in the git repository** (the
`Dockerfile`, `.dockerignore`, and this `DEPLOY.md` are committed). Send them
**one** of:

1. **Git access** to this repo (best — they pull and `docker build`). ← preferred
2. A **git bundle**: `git bundle create elitezonej.bundle --all` → send the
   `.bundle` file; they `git clone elitezonej.bundle`.
3. A **source archive** (no secrets, no node_modules):
   `git archive --format=tar.gz -o elitezonej-src.tar.gz HEAD` → send the
   `.tar.gz`.

Do **not** send `.env.local` / `.env.production` (secrets) or the `data/`
database files — the DevOps engineer creates fresh ones on the server.

---

## 10. Migrating from Vercel (keep all existing data)

The app currently runs on **Vercel**, with its data in **Neon Postgres** and its
config in **Vercel's Environment Variables**. The code (this repo) is the only
piece that moves to the new server — the database does not move.

**Sequence (zero data risk — both ends read the same Neon DB):**

1. **Copy the env vars out of Vercel.** Vercel dashboard → project `elitezonej`
   → Settings → Environment Variables (or `vercel env pull .env.production`).
   These become the new server's `.env.production`. The checklist below lists
   what to copy.
2. **Build & run on the company server** pointed at the **same** `DATABASE_URL`
   (Neon). The site comes up fully populated — same products, orders, accounts.
3. **Verify** the company-server URL looks identical to the live site.
4. **Switch the domain** (DNS) to the new server only after it checks out.
5. **Keep Vercel as a warm backup**, then decommission once confident.

> Avoid the one bad state: the new server **and** Vercel both accepting **real
> orders** against the same Neon DB simultaneously. Cut payments over in one
> direction during the switch.

### Env-var checklist (copy these from Vercel → `.env.production`)

| Variable | Needed when | Notes |
|---|---|---|
| `DB_DRIVER` | always | set to `postgres` to use Neon (matches current prod) |
| `DATABASE_URL` | postgres | pooled Neon connection string (the live data) |
| `DATABASE_URL_UNPOOLED` | postgres | direct connection, for migrations |
| `CHECKOUT_TOKEN_SECRET` | always | **reuse the same value as Vercel** so existing checkout links/tokens stay valid |
| `ADMIN_BOOTSTRAP_PASSWORD` | always | first owner login |
| `RAZORPAY_KEY_ID` | live payments | server secret |
| `RAZORPAY_KEY_SECRET` | live payments | server secret |
| `RAZORPAY_WEBHOOK_SECRET` | live payments | server secret |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | live payments | **build-time** → pass as `--build-arg`, not runtime |
| `BLOB_READ_WRITE_TOKEN` | only if keeping Vercel Blob for image uploads | omit to store uploads on the server disk instead |
| `SHIPPING_FLAT_INR` / `FREE_SHIP_OVER_INR` / `TAX_RATE` | optional | commerce policy overrides |

---

## Quick reference

| Concern            | Value / location                                  |
|--------------------|---------------------------------------------------|
| Build file         | `Dockerfile` (repo root)                           |
| Listens on         | port `3000`                                        |
| Live database      | **Neon Postgres** (`DB_DRIVER=postgres`) — keep using it |
| Persist DB (sqlite)| volume → `/app/data` (only if using sqlite instead)|
| Persist uploads    | volume → `/app/public/uploads`                     |
| Build-time var     | `NEXT_PUBLIC_RAZORPAY_KEY_ID` (via `--build-arg`)  |
| Runtime secrets    | `--env-file .env.production` (copied from Vercel)   |
| Node version       | 22 (Next.js 16 requires ≥ 20.9)                     |
