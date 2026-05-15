# API Specification — storefront commerce

Storefront mutations use **Next.js Server Actions** (typed, no manual REST layer) plus one **webhook route**. Contracts below.

## `startCheckout(prev, FormData) : CheckoutStartState`
`app/checkout/actions.ts` — public, rate-limited (`checkout:<ip>`, 8 / 10 min).

Input (FormData): `cart` (JSON of `CartLineInput[]`), `email`, `phone`, `ship_name`, `ship_line1`, `ship_line2?`, `ship_city`, `ship_state`, `ship_pincode`, `promo_code?`.

`CartLineInput`: `{ slug, qty, size?, colour?, isFabric? }` — **price is NOT accepted from client**.

Behaviour: validate (Zod) → re-price from DB → apply promo → upsert customer → create `orders` row (`status=new`, `payment_status=pending`) + `order_items` → create provider order.

Returns:
```ts
{ ok: true,
  orderId: string,
  amount: number,                 // rupees
  provider: 'razorpay'|'offline',
  razorpay?: { keyId, providerOrderId },  // present only when provider=razorpay
  pricing: { subtotal, discount, shipping, tax, total } }
| { ok:false, error:string, fieldErrors?:Record<string,string> }
```

## `confirmPayment(input) : { ok, orderId } | { ok:false, error }`
Input: `{ orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature }`.
Verifies `HMAC_SHA256(order_id|payment_id, key_secret) === signature` → `fulfilOrderPaid()` (idempotent). Offline provider: marks order pending-review and returns ok with `mode:'offline'`.

## `POST /api/webhooks/razorpay`
`app/api/webhooks/razorpay/route.ts`. Verifies `X-Razorpay-Signature` (HMAC-SHA256 of raw body with webhook secret). On `payment.captured` / `order.paid` → `fulfilOrderPaid()` (idempotent — safe alongside client callback). Returns `200` always after signature check (Razorpay retry semantics); `400` on bad signature.

## `subscribeNewsletter(prev, FormData) : { ok?, error? }`
`app/components/actions/newsletter.ts` — public, rate-limited (`news:<ip>`, 5 / hour). Zod email; upsert into `newsletter_subscribers` (re-subscribe flips status). Idempotent on email.

## Conventions
- All amounts integer rupees in app code; ×100 to paise **only** at the Razorpay boundary.
- Validation errors → `{ ok:false, error, fieldErrors? }`, no exceptions across the action boundary.
- No pagination needed (storefront write surface); admin read APIs already paginate via existing repos.
- Status codes: webhook `200/400`; actions never throw to the client.
