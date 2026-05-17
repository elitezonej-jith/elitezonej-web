<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version (Next.js 16.2.4) has breaking changes — APIs, conventions, and
file structure may all differ from your training data. Read the relevant guide
in `node_modules/next/dist/docs/` before writing any Next.js code. Heed
deprecation notices.
<!-- END:nextjs-agent-rules -->

# Working in this codebase

## Styling — there is NO Tailwind
Styling is plain global CSS + CSS custom properties (design tokens). No Tailwind,
no CSS Modules, no utility classes.
- Design tokens live in `app/globals.css` (`:root` block: `--accent`, `--ink`,
  `--paper`, `--s-*` spacing scale, `--t-*` type scale). This is the single
  source of truth — reference tokens (`var(--accent)`), never hardcode values.
- Per-surface stylesheets: `app/styles/*.css` (storefront),
  `app/admin/styles/admin.css` (namespaced `.adm-*`),
  `app/studio/styles/studio.css` (namespaced `.stu-*`). Keep the namespaces.

## Three surfaces, one app (code lives in `app/`, not `src/`)
- **Public storefront** — `app/` root + `/cart`, `/collection`, `/products`,
  `/checkout`, `/account`, `/login`, `/signup`, `/wishlist`, `/bespoke`.
  Customer session or public.
- **Admin** ("Atelier Ledger") — `app/admin/`. Admin session, roles
  `owner`/`staff`.
- **Studio** — `app/studio/`. Same admin session cookie and same DB tables as
  Admin; just a separate login page and UI.
- API routes: only `app/api/studio/upload/` and `app/api/webhooks/razorpay/`.
- Server actions: `app/**/actions/` and `app/**/actions.ts` (marked
  `"use server"`). Data access goes through `lib/admin/repos/*` (synchronous,
  `server-only`).
- Auth gate is NOT middleware. Each page Server Component calls
  `requireUser()` / `requireRole("owner")` / `requireCustomer()` at the top;
  the layout only hides/shows the nav. Add the guard to every new
  authenticated page.

## Ring-fenced: payments, orders, persistence (do NOT refactor without approval)
These files encode money-safety and security invariants. Do not restructure,
"clean up", or change their control flow without explicit user approval:
- `lib/admin/db.ts` (DB singleton + ephemeral fallback)
- `lib/storefront/payments/` (Razorpay + ephemeral guard)
- `lib/storefront/checkout.ts` (server-side pricing — never trust client prices)
- `lib/storefront/checkout-token.ts` (HMAC token closing the order-receipt IDOR)
- `app/checkout/actions.ts`
- `app/api/webhooks/razorpay/route.ts` (idempotent; reconciles amount)
- `lib/admin/repos/orders.ts`, `repos/payments.ts`, `repos/webhook-events.ts`

Known constraint (already by design — do not "fix"): on Vercel/serverless the
SQLite file can't persist, so `lib/admin/db.ts` falls back to an in-memory DB
that resets on cold start. Live payments are intentionally hard-disabled in that
mode via `isEphemeralPersistence()`. `lib/db/sql.ts` is a dormant Postgres
migration stub — nothing imports it yet; activating it is a deliberate,
approved task, not a casual change.

## Verification gate (no "done" without evidence)
There is no test/lint/typecheck script. The real typecheck is:

    npx tsc --noEmit

Run it before and after your change. Report the error count before and after.
Never claim work is complete, fixed, or passing without showing this output.
TypeScript strict mode is on; `@/*` aliases the project root.
