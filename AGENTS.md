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

## Performance rules (the storefront must stay fast on phones)
CI runs Lighthouse (mobile) on every pull request and fails below the budget
in `lighthouserc.json`. Background: docs/performance-strategy.md. Do not:
- Pass large data from a server component into every page. Anything only
  some visitors need (e.g. the search index) is fetched on demand from an
  API route (`/api/search-index`).
- Call React state setters on every animation frame. Write per-frame values
  to a CSS variable on a ref instead.
- Run `requestAnimationFrame`/`setInterval` loops while the element is off
  screen or the tab is hidden. Start/stop them from an IntersectionObserver.
- Add full-screen loaders, curtains or `loading.tsx` at the root. Navigation
  feedback is the thin `NavProgress` bar.
- Mark below-the-fold images `priority`; only the hero/LCP image is.
- Add `force-dynamic` or read `cookies()`/`headers()` in storefront pages
  (`/`, `/products/[slug]`). They are ISR-cached; per-visitor data is fetched
  client-side from an API route (see `/api/reviews/eligibility`).
- Serve photos at full size. Product images go through `next/image`, whose
  custom loader resizes them via `/api/img` (allowed widths in
  `lib/image-widths.ts`). Don't add `unoptimized` to `next.config.ts`.

## Verification gate (no "done" without evidence)
There is no test/lint/typecheck script. The real typecheck is:

    npx tsc --noEmit

Run it before and after your change. Report the error count before and after.
Never claim work is complete, fixed, or passing without showing this output.
TypeScript strict mode is on; `@/*` aliases the project root.

## Git workflow
When merging changes: always create a feature branch, commit there, switch back
to `master`, merge the branch, and push to origin. Never commit directly on
`master`.