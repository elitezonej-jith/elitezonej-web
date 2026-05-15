# Frontend Analysis — Elite Zone J

Reverse-engineered from the existing Next.js 16 (App Router, React 19) storefront.

## Surfaces

| Area | Route | Backend state (before this work) |
|---|---|---|
| Home | `/` | Dynamic — `homepage_blocks`/`banners`/`notices` via studio repos |
| Collection | `/collection` | Dynamic — products repo + filters |
| PDP | `/products/[slug]` | Dynamic — product + images + inventory |
| Cart | `/cart` | **Client only** — `CartProvider` + `localStorage` (`ezj-cart-v1`) |
| Checkout | `/checkout` | **No backend** — built a WhatsApp deep link only |
| Wishlist | `/wishlist` | **Client only** |
| Bespoke | `/bespoke` | Wired — `submitBespokeBooking` → `bookings` |
| Newsletter | footer | **Client stub** — `setDone(true)`, no persistence |
| Admin / Studio | `/admin`, `/studio` | Full backend (SQLite + repos + auth) |

## Cart item shape (`CartProvider.CartItem`)

`id (slug|size|colour)`, `slug`, `name`, `unitPrice` (per piece or per metre), `qty` (count for tailored, metres for fabric), `size?`, `colour?`, `imageSrc`, `isFabric?`.

Fabrics: `qty` is metres (0.5 step), counted as 1 line. Tailored: integer pieces.

## Behavioural inferences (the backend must honour these)

- **Two product kinds** — `tailored` (size + stock per size in `inventory`) and `fabric` (colour + `stock_meters` in `fabric_colours`). Order/inventory logic must branch on `is_fabric`.
- **Pricing** is server-truth: `sale_price` overrides `price`; client `unitPrice` must be re-derived server-side at checkout (never trusted).
- **Currency** is INR, integer minor-unit-free rupees (`fmtINR` uses `toLocaleString`). Razorpay needs paise → ×100 at the gateway boundary only.
- **Guest checkout** — no storefront auth exists; customers are keyed by email and upserted (`upsertCustomer` already does this).
- **Promotions** exist (`promotions`, `offer_targets`) but were never applied to a cart.
- Checkout copy promised "secure payment link launching shortly" → now fulfilled by the Razorpay flow.

## Edge cases the UI implies

- Stock can be 0 / `oos_flag` set → checkout must reject out-of-stock lines atomically.
- Cross-tab cart sync exists; order creation must be idempotent per attempt.
- Empty cart / unhydrated states already handled client-side.
