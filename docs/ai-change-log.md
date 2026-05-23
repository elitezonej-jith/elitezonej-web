# AI Change Log

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
