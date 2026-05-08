# Elite Zone J

Premium Indian tailoring & fashion e-commerce — Next.js 16 App Router storefront with **two parallel admin panels** sharing one SQLite backend.

**Live storefront:** [web-two-mocha-61.vercel.app](https://web-two-mocha-61.vercel.app)
**Admin panels:** local-only (SQLite needs a writable filesystem — Vercel won't work, see *Deployment*).

---

## Read this first — it isn't vanilla Next.js

This repo runs **Next.js 16.2.4** with breaking changes from earlier versions:

| What changed | Impact |
|---|---|
| `middleware.ts` → **`proxy.ts`** | Same behaviour, new filename. Both admin panels are gated by `proxy.ts` at the repo root. |
| `cookies()` is **async** | `const c = await cookies()` everywhere. |
| Server actions sit next to pages | `app/admin/actions/*.ts`, `app/studio/actions/*.ts`. |
| Native modules need allow-listing | `next.config.ts` has `serverExternalPackages: ["better-sqlite3"]`. |

**Before writing code:** check `node_modules/next/dist/docs/` for the canonical Next 16 patterns. Don't rely on Next 14/15 muscle memory.

---

## One brand, two operator surfaces

Both panels read & write the **same `data/admin.db`** via the **same session cookie** (`ezj_admin_session`). Pick the one whose vibe fits the operator.

### `/admin` — *Atelier Ledger*
Editorial, oxblood-on-cream "leather workbook". Cormorant Garamond italics, mono kickers, hairline rules, zero radii. Designed for the brand owner who wants the back-office to feel like a tailor's notebook, not a SaaS dashboard.
- 16 routes, 9 server actions
- `app/admin/styles/admin.css` carries the design tokens

### `/studio` — *Shopify+Canva-style operator*
Pragmatic, productivity-first. Dense tables, drag-to-reorder lists, image uploaders with crop, toast notifications. Designed for staff doing high-volume catalogue/banner/offer work.
- 20 routes, 9 server actions
- `app/studio/styles/studio.css` + `react-image-crop` for media handling

Same data, two ways of looking at it. You can run them side-by-side or pick one and delete the other; the lib layer doesn't care.

---

## Quick start

```bash
npm install                      # installs better-sqlite3, bcryptjs, sharp, puppeteer-core, etc.
npm run dev                      # → http://localhost:3000 (or :3001 if 3000 is busy)
```

**First-run flow:**

1. Visit `/admin` → redirected to `/admin/login` → redirected to `/admin/setup`
   *(or visit `/studio` for the operator panel — same setup page works)*
2. Create the **owner** account.
3. Land on the dashboard. The DB at `data/admin.db` is auto-created with:
   - 30 SKUs seeded from `lib/products.ts`
   - 25 mock orders, 18 customers, 6 bookings, 4 promo codes (so dashboards aren't empty)
   - Default homepage blocks, banners, notices

**Storefront** stays on the static catalog (`lib/products.ts`); admin edits do **not** yet propagate to the public homepage. The DB-driven storefront layer (`app/components/storefront/`) is wired and tested but not the default — see *Future work*.

---

## Architecture

```
                              ┌──────────────────┐
                              │  proxy.ts        │  gates /admin/* and /studio/*
                              │  (root)          │  on the SESSION_COOKIE
                              └────────┬─────────┘
                                       │
                 ┌─────────────────────┼─────────────────────┐
                 │                     │                     │
                 ▼                     ▼                     ▼
         ┌────────────┐         ┌────────────┐       ┌──────────────┐
         │ /admin     │         │ /studio    │       │ /            │
         │ atelier    │         │ shopify    │       │ storefront   │
         │ ledger     │         │ canva      │       │ (public)     │
         └─────┬──────┘         └─────┬──────┘       └──────┬───────┘
               │                      │                     │
               └──────────┬───────────┘                     │
                          ▼                                 │
                  ┌───────────────┐                         │
                  │ lib/admin/    │                         │
                  │ ─────────     │                         │
                  │ db.ts         │  better-sqlite3 ◄───────┘  (storefront reads
                  │ auth.ts       │  singleton                  use lib/storefront/
                  │ session.ts    │                             which optionally hits
                  │ repos/*.ts    │                             the same DB)
                  │ schema.sql    │
                  │ schema-v2.sql │
                  └───────┬───────┘
                          ▼
                  ┌───────────────┐
                  │ data/admin.db │   (gitignored, WAL mode)
                  └───────────────┘
```

### Database — `better-sqlite3`

- **Synchronous.** No `await` on queries. Fits Server Components and Server Actions cleanly.
- **Singleton** on `globalThis.__ezj_admin_db` so dev hot-reload doesn't open a new handle every render.
- **Idempotent bootstrap** in `lib/admin/db.ts`:
  - `schema.sql` (v1) loaded with `CREATE TABLE IF NOT EXISTS` on every open.
  - `schema-v2.sql` applied statement-by-statement so `ALTER TABLE ADD COLUMN` can be skipped if the column already exists.
  - Empty DB → seeds catalog (`seed.ts`), fixtures (`seed-fixtures.ts`), and studio defaults (`seed-studio.ts`).
- **WAL mode** + foreign keys ON. DB file lives at `data/admin.db` (gitignored).

### Auth

- **Hashing:** `bcryptjs` (pure-JS, no native build) at cost 12.
- **Sessions:** server-side rows in `sessions` table; cookie `ezj_admin_session` holds only the session id (32 random bytes, hex). `httpOnly`, `sameSite=lax`, `secure` in prod, **30-day TTL**.
- **Bootstrap:** if `users` is empty, every gate redirects through `/admin/setup` (or `/studio/setup`). After bootstrap, the setup page returns 404.
- **Three-layer authorization:**
  1. `proxy.ts` — coarse "logged in or not" gate
  2. `app/{admin,studio}/layout.tsx` — fetches the session user once via `getSessionUser(sid)` and passes to children
  3. Per-action `requireRole('owner'|'staff')` before any mutation

### Server actions

Each domain gets one file under `app/admin/actions/` or `app/studio/actions/`. Pattern:

```ts
"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "../../../lib/admin/session";

const Schema = z.object({ /* … */ });

export async function upsertProduct(formData: FormData) {
  const me = await requireUser();
  const data = Schema.parse(Object.fromEntries(formData));
  // …repo write…
  revalidatePath("/admin/products");
}
```

The `repos/` modules are the only place that touches SQL. Pages and actions call repos; nothing else.

### Routing map

```
app/admin/
  page.tsx                      Dashboard — KPIs, sparkline, low-stock, recent bookings
  login/page.tsx
  setup/page.tsx                First-run owner bootstrap (auto-disabled after)
  products/{,new/,[slug]/}      Catalogue editor — Details · Inventory · Media · Pricing
  fabrics/{,new/,[slug]/}       Fabric SKUs + colourway matrix (hex picker, stock meters)
  inventory/page.tsx            Global SKU × size stock grid
  orders/{,[id]/}               Order list + detail with status flow
  customers/{,[id]/}            Customer list + history
  bespoke/{,[id]/}              Booking inbox — new → contacted → scheduled → done
  categories/page.tsx           Category tree editor
  promotions/{,new/,[code]/}    Promo codes (percent / flat / free_ship)
  content/page.tsx              Hero / Editorial / Process / MFY / Banner / Trust copy
  media/page.tsx                /public/generated explorer
  settings/page.tsx             Brand · Account · Users · Audit log

app/studio/
  page.tsx                      Operator dashboard — open orders, drafts, quick actions
  login/page.tsx
  setup/page.tsx
  products/{,new/,[slug]/}      Catalogue with multi-image upload + crop
  banners/{,new/,[id]/}         Hero banners (desktop + mobile, schedule, target)
  notices/{,new/,[id]/}         Ticker / popup / festive notices
  homepage/{,[id]/}             Composable block builder (drag to reorder)
  categories/{,new/,[id]/}      Category editor with images + visibility toggle
  offers/{,new/,[code]/}        Offer codes with target audience matrix
  flash-sales/{,new/,[id]/}     Countdown banners tied to promo codes
  orders/{,[id]/}               Order workbench
  customers/{,[id]/}
  bespoke/{,[id]/}
  media/page.tsx                Real media library (uploads → /public/admin-uploads)
  settings/page.tsx
```

---

## Database schema cheat sheet

| Table | What it stores | Key columns |
|---|---|---|
| `users` | Admin operators | `email` (unique), `password_hash`, `role` (`owner`/`staff`) |
| `sessions` | Active logins | `id` (uuid), `user_id`, `expires_at` |
| `products` | Catalogue (tailored + fabric) | `slug` (PK), `kind`, `status`, `price`, `sale_price` |
| `inventory` | Stock per size | `(product_slug, size)` PK, `stock`, `oos_flag` |
| `fabric_meta` | Fabric specs | `width_inches`, `gsm`, `composition`, `stock_meters_total` |
| `fabric_colours` | Colourways | `name`, `hex`, `stock_meters`, `image_dir` |
| `customers` | Buyer records | `email` (unique), `total_orders`, `total_spent` |
| `orders` | Order ledger | `id` (`WK-####`), `status`, `total`, `currency` |
| `order_items` | Line items | `order_id`, `product_slug`, `qty`, `unit_price`, `size`, `colour` |
| `bookings` | Bespoke leads | `service`, `status`, `assigned_to` |
| `categories` | Nav tree | `parent_id` self-ref, `slug`, `gender`, `kind`, `image_path` |
| `promotions` | Promo codes | `code` (PK), `type`, `value`, `usage_limit`, `is_featured` |
| `offer_targets` | Promo audience | `target_type` (`all`/`category`/`product`), `target_id` |
| `flash_sales` | Countdown banners | `promo_code` FK, `ends_at` |
| `home_sections` | Legacy homepage copy | `key` (PK), `title`, `body`, `image_path` |
| `homepage_blocks` | Composable home blocks | `type`, `config_json`, `sort_order` |
| `banners` | Hero banners | `image_path`, `mobile_image_path`, `text_align`, `status` |
| `notices` | Tickers / popups | `type`, `priority`, `target_paths` |
| `product_images` | Multi-image gallery | `product_slug`, `image_path`, `sort_order`, `is_thumbnail`, `is_hover` |
| `product_meta` | Flags + SEO | `is_featured`, `is_trending`, `is_new_arrival`, `meta_title` |
| `media_assets` | Upload tracking | `path` (unique), `folder`, `mime`, `uploaded_by` |
| `settings` | Brand config | `key` (PK), `value` |
| `audit_log` | Mutation trail | `user_id`, `action`, `entity`, `entity_id`, `payload_json` |

Schema files: `lib/admin/schema.sql` (v1), `lib/admin/schema-v2.sql` (additions).

---

## How to extend

### Add a new page in either panel

1. Create `app/{admin|studio}/<route>/page.tsx`.
2. Make it a server component — read with `listX()` from a repo.
3. For mutations, drop a server action in `app/{admin|studio}/actions/<domain>.ts` and pass it as `action={…}` to a `<form>`.
4. The layout already provides the shell — just return the page body.

### Add a new schema field

1. Append to `lib/admin/schema-v2.sql` (use `ALTER TABLE … ADD COLUMN`; the `applyV2` runner skips columns that already exist).
2. Update the matching repo + types in `lib/admin/types.ts`.
3. Either delete `data/admin.db` for a clean reseed, or just restart `npm run dev` — the migration runs idempotently.

### Add a new repo

Drop a file under `lib/admin/repos/`. Keep all `db.prepare(...)` SQL inside repos — pages and actions should never import `getDb()` directly.

### Add a new homepage block type

1. Add the type string to `homepage_blocks.type` (no enum constraint — it's free-form text).
2. Create the React component under `app/components/storefront/blocks/`.
3. Wire it into the switch in `app/components/storefront/HomepageRenderer.tsx`.
4. Build a `/studio/homepage/[id]` editor section for its `config_json` shape.

---

## Client preview — screenshot deliverable

When you can't deploy and need to show the client what the panels look like:

```bash
# 1. Boot the dev server
npm run dev

# 2. Plant a session cookie (one-shot — keeps script unauthenticated-free)
node -e '
  const Db = require("better-sqlite3");
  const { randomBytes } = require("crypto");
  const fs = require("fs");
  const db = new Db("data/admin.db");
  const id = randomBytes(32).toString("hex");
  const exp = new Date(Date.now() + 86400e3).toISOString();
  db.prepare("DELETE FROM sessions").run();
  db.prepare("INSERT INTO sessions (id,user_id,expires_at) VALUES (?,1,?)").run(id, exp);
  fs.writeFileSync("/tmp/ezj_session_id", id);
'

# 3. Capture 41 routes × 2 viewports = 82 PNGs (uses system Chrome via puppeteer-core)
node scripts/admin-screenshots.mjs

# 4. Output: /tmp/admin-screenshots/{admin,studio,storefront}/{desktop,mobile}/*.png
```

The script reads `BASE_URL` (defaults to `http://localhost:3001`) and writes full-page screenshots at `1440×900 @2x` and `390×844` (iPhone UA).

---

## Deployment

### Vercel won't work for the admin panels

`better-sqlite3` requires a **writable, persistent filesystem**. Vercel's serverless functions get an ephemeral `/tmp` and the `.next` build is read-only. The storefront deploys fine; the admin panels do not.

### Options that do work

| Host | Why it works |
|---|---|
| **Railway** | Persistent volume, Node runtime, simple Git-deploy |
| **Fly.io** | Volumes + always-on machines |
| **Cloudflare Tunnel** to your own server | Lowest cost, full control, real disk |
| **Self-hosted VPS** (DigitalOcean / Hetzner) | Vanilla `npm run start` behind nginx |

Whichever you pick, ensure `data/` is on a **persistent volume** (not the container's ephemeral layer).

### Storefront-only on Vercel

The public site under `/`, `/collection`, `/products/[slug]`, `/bespoke` reads from the static `lib/products.ts` and deploys cleanly. You can keep that on Vercel and host the admin panels separately under e.g. `admin.elitezonej.com` pointing at Railway.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2 App Router (Turbopack) |
| UI | React 19, hand-written CSS (no UI lib) |
| Database | SQLite via `better-sqlite3` |
| Auth | `bcryptjs` + DB-backed sessions |
| Validation | `zod` in server actions |
| Image processing | `sharp` (resize/optimize on upload) |
| Image cropping | `react-image-crop` (studio only) |
| Screenshots | `puppeteer-core` + system Chrome |
| Language | TypeScript strict |

---

## File map (the parts you'll actually touch)

```
elitezonej/
├── proxy.ts                    Auth gate for /admin/* and /studio/*
├── next.config.ts              serverExternalPackages: ["better-sqlite3"]
├── data/                       SQLite home (gitignored)
│   └── admin.db                Auto-created on first run
│
├── app/
│   ├── page.tsx                Storefront homepage (HeroGrid, CarouselShowcase, EditorialSplit, MadeForYou…)
│   ├── components/             Storefront components (Header, Footer, ProductCard, …)
│   │   └── storefront/blocks/  DB-driven block components (optional alt homepage)
│   │
│   ├── admin/                  Atelier Ledger panel
│   │   ├── layout.tsx          Auth gate + sidebar/topbar shell
│   │   ├── page.tsx            Dashboard
│   │   ├── styles/admin.css    Design tokens (oxblood, cream, Cormorant)
│   │   ├── components/         AdminSidebar, KpiTile, Folio, StatusPill, …
│   │   ├── actions/            Server actions (auth, products, fabrics, orders, …)
│   │   └── <domain>/page.tsx   One folder per operator surface
│   │
│   └── studio/                 Shopify+Canva panel
│       ├── layout.tsx          ToastProvider + StudioShell
│       ├── styles/studio.css
│       ├── components/         StudioShell, ImageUploader, SortableList, Toast, …
│       ├── actions/
│       └── <domain>/page.tsx
│
├── lib/
│   ├── products.ts             Static catalog (storefront source of truth + seed source)
│   ├── admin/
│   │   ├── db.ts               better-sqlite3 singleton + bootstrap
│   │   ├── auth.ts             bcrypt + session helpers
│   │   ├── session.ts          requireUser(), requireRole()
│   │   ├── schema.sql          v1 DDL (idempotent)
│   │   ├── schema-v2.sql       v2 additions (idempotent ALTERs)
│   │   ├── seed.ts             First-run catalog seed from lib/products.ts
│   │   ├── seed-fixtures.ts    25 orders, 18 customers, 6 bookings, 4 promos
│   │   ├── seed-studio.ts      Default homepage blocks, banners, notices
│   │   ├── types.ts            Shared TS types
│   │   ├── kpi.ts              Dashboard aggregations
│   │   ├── format.ts           ₹ formatter, date formatter
│   │   └── repos/              19 repos — one per domain, only files that touch SQL
│   └── storefront/             DB-aware reads for the public site (optional)
│
├── public/
│   ├── generated/              Product imagery (5 angles × 30 SKUs + section images)
│   └── admin-uploads/          Operator uploads (gitignored)
│
└── scripts/
    └── admin-screenshots.mjs   Puppeteer-driven panel screenshot capture
```

---

## Common gotchas

- **Port 3001 fallback** — if anything is bound to 3000 (Brave keeps stale connections open after closing tabs), Next switches to 3001 silently. Update bookmarks and check the dev server output.
- **`cookies()` is async** — `await cookies()` everywhere. `cookies().get(...)` synchronous use will throw at runtime.
- **DB file is gitignored** — every clone gets a fresh seed on first `npm run dev`. To share state, copy `data/admin.db` manually (it's a single file).
- **Two cookies, one auth** — `ezj_admin_session` and `ezj_studio_session` both exist as cookie names in seeds, but the active gate is just `ezj_admin_session`. Logging into either panel logs you into both.
- **Schema v2 ALTER pattern** — never delete a column from `schema-v2.sql`. The DB might already have it; we silently skip. To remove a column you have to write a v3 migration that does the table-rebuild dance.
- **Storefront ↔ admin disconnect** — admin edits today don't change the public homepage; the storefront still reads `lib/products.ts`. The DB-backed renderer (`HomepageRenderer.tsx`) exists and works, but `app/page.tsx` deliberately stays on the static editorial layout. Future task: switch `/collection` and `/products/[slug]` to `lib/storefront/products.ts`.

---

## Future work

- Wire the public storefront (`/`, `/collection`, `/products/[slug]`) to read from `lib/storefront/products.ts` so admin edits go live.
- PDF invoice generation (`app/api/admin/orders/[id]/invoice/route.ts` is stubbed to return JSON).
- Email notifications on `bookings.status = scheduled` and `orders.status = shipped`.
- Move `data/admin.db` to a managed host (Turso / Cloudflare D1) so the panels can run on edge.

---

## Scripts

```bash
npm run dev        # Next dev server (turbopack)
npm run build      # production build
npm run start      # production server
```

No tests yet; verification is manual against the 12-step checklist that lived in the original plan (login → seed → CRUD round-trip on each domain → bespoke booking from `/bespoke` lands in `/admin/bespoke`).

---

## Credit & contact

Built for Elite Zone J — Delhi atelier, made-to-measure.
Owner contact: see `settings` table after first-run setup.
