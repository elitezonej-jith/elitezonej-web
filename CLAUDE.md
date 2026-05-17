@AGENTS.md

# Elite Zone J — project context

Bespoke-tailoring e-commerce site: public storefront + an Admin operator panel
+ a Studio content panel, in a single Next.js app.

## Stack (exact versions in use)
- Next.js **16.2.4** (non-standard build — see AGENTS.md), React **19.2.4**
- TypeScript ^5, **strict mode on**; `@/*` → project root
- Zod ^4 (server-side validation only), better-sqlite3 ^12 (synchronous),
  bcryptjs ^3, @dnd-kit ^6 (drag-and-drop ordering)
- Razorpay payments via raw `fetch` — there is **no `razorpay` npm package**
- No Tailwind (CSS tokens — see AGENTS.md). No test/lint runner configured.

## Commands
    npm run dev          # next dev
    npm run build        # next build
    npm start            # next start
    npx tsc --noEmit     # the ONLY typecheck — run before/after every change
    node db/migrate.mjs  # db:migrate
    node db/seed.mjs     # db:seed

## Hard constraints (details + file list in AGENTS.md)
1. Payments/orders/persistence are **ring-fenced** — do not refactor without
   explicit approval.
2. Serverless persistence is **ephemeral by design**; live payments are
   intentionally disabled in that mode. Not a bug.
3. Every authenticated page must call its own `requireUser()` /
   `requireRole()` / `requireCustomer()` guard — there is no auth middleware.

## Top "don't do this"
- Don't add Tailwind or hardcode colours/spacing — use `var(--token)`.
- Don't write Next.js code from memory — read `node_modules/next/dist/docs/`.
- Don't trust client-supplied prices — pricing is recomputed in
  `lib/storefront/checkout.ts`.
- Don't claim success without `npx tsc --noEmit` output (before/after counts).
