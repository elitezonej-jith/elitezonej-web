# AI Change Log

## 2026-05-23 13:20 IST — force-dynamic on admin/studio auth pages

- What: Added `export const dynamic = "force-dynamic"` to admin & studio login/setup pages and admin /new pages.
- Why: After the Postgres cutover (DB_DRIVER=postgres), Vercel's build worker timed out (>60s × 3) trying to statically prerender these pages, because they call DB helpers (e.g. `countUsers()`, `requireUser()`) and the Neon pooled URL is not reliably reachable from the build runner. Marking the pages as request-time-only skips prerender and lets the build complete; runtime behavior is unchanged (auth pages were already dynamic in spirit — they depend on cookies and DB state).
- Files: app/admin/login/page.tsx, app/admin/setup/page.tsx, app/admin/products/new/page.tsx, app/admin/promotions/new/page.tsx, app/admin/fabrics/new/page.tsx, app/studio/login/page.tsx, app/studio/setup/page.tsx
- Notes: npx tsc --noEmit: 0 errors before, 0 errors after. Ring-fenced files untouched.
