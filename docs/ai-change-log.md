# AI Change Log

## 2026-05-23 15:10 IST — fail-loud guard against silent ephemeral SQLite on Vercel

- What: `getDb()` now throws immediately on a serverless deployment (`VERCEL=1` or `IS_SERVERLESS=1`) if `DB_DRIVER` is not `postgres`. Local dev (no `VERCEL`) is unaffected.
- Why: Without this guard, a missing/misspelled `DB_DRIVER` on Vercel silently falls back to an in-memory SQLite database that resets every 15 minutes. The site appears to function but orders, sessions, and accounts vanish on every cold start — a silent corruption mode much worse than a loud failure. This is the exact symptom we hit earlier today during the Postgres cutover; making it crash loudly catches the misconfig at request time instead of weeks later via customer complaints.
- Files: lib/admin/db.ts (ring-fenced — adding a guard, no control-flow change to the SQLite or Postgres paths).
- Notes: `tsc --noEmit` 0 errors before/after. Zero external callers of `getDb()` (verified by grep) — every repo uses the async `sql` client, which routes to Postgres in prod and SQLite in local dev. The guard only fires on the misconfig path.

## 2026-05-23 14:30 IST — layout-level force-dynamic + drop ISR (temp)

- What: Added `export const dynamic = "force-dynamic"` to `app/studio/layout.tsx` and `app/admin/layout.tsx` (covers every page in those segments). Switched `app/page.tsx`, `app/collection/page.tsx`, `app/size-guide/page.tsx`, `app/products/[slug]/page.tsx` from `revalidate` (ISR) to `force-dynamic`.
- Why: Build still failing on `/`, `/collection`, `/size-guide`, `/studio/banners/new`, `/studio/categories/new` — Vercel build runner in iad1 cannot reach the Neon pooled URL in ap-southeast-1 within 60s to prerender. Layout-level dynamic stops the same problem from popping up on the next new studio/admin page; ISR pages temporarily downgraded to per-request rendering.
- Files: app/studio/layout.tsx, app/admin/layout.tsx, app/page.tsx, app/collection/page.tsx, app/size-guide/page.tsx, app/products/[slug]/page.tsx
- Notes: ISR lost on homepage, collection, PDP, size-guide. Real fix is region-collocating build/DB (move Neon to us-east-1) OR making DB loaders return defaults on connect failure so prerender survives. tsc --noEmit: 0 errors before, 0 errors after.

## 2026-05-23 13:40 IST — force-dynamic on remaining storefront pages

- What: Added `export const dynamic = "force-dynamic"` to /login, /signup, /cart, /bespoke, /wishlist, /not-found.
- Why: Production build kept failing on a new batch of pages even after the earlier admin/studio fix. Root cause is that `app/components/Header.tsx` imports DB-touching loaders (`listProductsForPage`, `getStorefrontNav`, `getSiteSettings`), so EVERY page rendering Header tries to query Postgres at static-generation time, and the Neon pooled URL is not reachable fast enough from Vercel's build runner.
- Files: app/login/page.tsx, app/signup/page.tsx, app/cart/page.tsx, app/bespoke/page.tsx, app/wishlist/page.tsx, app/not-found.tsx
- Notes: All storefront page.tsx files using Header now have `dynamic` set. npx tsc --noEmit: 0 errors before, 0 errors after. A proper fix (lazy nav, or layout-level dynamic, or making DB calls build-safe) is a follow-up — this is the minimum to unblock prod login.

## 2026-05-23 13:20 IST — force-dynamic on admin/studio auth pages

- What: Added `export const dynamic = "force-dynamic"` to admin & studio login/setup pages and admin /new pages.
- Why: After the Postgres cutover (DB_DRIVER=postgres), Vercel's build worker timed out (>60s × 3) trying to statically prerender these pages, because they call DB helpers (e.g. `countUsers()`, `requireUser()`) and the Neon pooled URL is not reliably reachable from the build runner. Marking the pages as request-time-only skips prerender and lets the build complete; runtime behavior is unchanged (auth pages were already dynamic in spirit — they depend on cookies and DB state).
- Files: app/admin/login/page.tsx, app/admin/setup/page.tsx, app/admin/products/new/page.tsx, app/admin/promotions/new/page.tsx, app/admin/fabrics/new/page.tsx, app/studio/login/page.tsx, app/studio/setup/page.tsx
- Notes: npx tsc --noEmit: 0 errors before, 0 errors after. Ring-fenced files untouched.
