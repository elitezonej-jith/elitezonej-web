# Walk-In Invoice / POS Feature — Architectural Plan

## Context

The client wants to generate and print/send invoices **directly from Studio** for customers who purchase from the **physical store** (walk-in sales). Currently, invoices only exist for online orders placed through the storefront checkout.

---

## Current State

**What already exists (and is excellent):**
- ✅ Full invoice renderer at `/studio/orders/[id]/invoice/page.tsx` — branded, formatted, print-optimised
- ✅ Print CSS (`@media print`) hides sidebar/topbar, renders invoice full-width
- ✅ "Print / Download PDF" button using `window.print()` (browser PDF generation)
- ✅ `InvoiceActions.tsx` with back link + print button
- ✅ `createPendingOrder()` in `lib/admin/repos/orders.ts` that creates orders with items
- ✅ Order data model supports all fields needed: shipping, tax, discount, promo, items
- ✅ Customer upsert (creates or finds by email)
- ✅ Invoice styles: `.inv-doc` with header, billing, items table, totals, footer

**What's missing:**
- No way to create an order from Studio without going through the storefront checkout
- No "walk-in" or "POS" order creation form
- No "Quick Invoice" flow that bypasses the full checkout

---

## Feature Design

### User Story

> As a store operator, I want to quickly create an invoice for a walk-in customer by selecting products, entering customer details, and immediately printing or sending the invoice — all from the Studio dashboard.

### UX Flow

```
/studio/orders/new (new page)
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│ Create Walk-In Order                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─ Customer Card ───────────────────────────────────────────┐   │
│ │ Name: [_____________]  Phone: [___________]               │   │
│ │ Email: [_____________] (optional for walk-in)             │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─ Items Card ──────────────────────────────────────────────┐   │
│ │ [Search products...]                                      │   │
│ │                                                           │   │
│ │ ┌────────────────────────────────────────────────┐        │   │
│ │ │ Product          Size   Qty   Price    Total   │        │   │
│ │ ├────────────────────────────────────────────────┤        │   │
│ │ │ Heritage Suit    40     1     ₹12,999  ₹12,999 │ [×]   │   │
│ │ │ Linen Fabric     —      3m    ₹899/m   ₹2,697 │ [×]   │   │
│ │ └────────────────────────────────────────────────┘        │   │
│ │ [+ Add item]                                              │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─ Summary Card ────────────────────────────────────────────┐   │
│ │ Subtotal:                              ₹15,696            │   │
│ │ Discount: [_____] [% ▾] or [code]     −₹0                │   │
│ │ Tax (GST): [18]%                       ₹2,825             │   │
│ │ ─────────────────────────────────────────────────         │   │
│ │ TOTAL:                                 ₹18,521            │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─ Payment & Notes ─────────────────────────────────────────┐   │
│ │ Payment: (●) Cash  ( ) Card  ( ) UPI  ( ) Pending         │   │
│ │ Notes: [________________________________]                  │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│              [Create & Print Invoice]  [Create as Draft]        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
       │
       ▼ (on submit)
┌──────────────────────────────────────────┐
│ 1. Creates order (status: 'confirmed')   │
│ 2. Creates customer (upsert by phone)    │
│ 3. Inserts order_items                   │
│ 4. Decrements stock (same as online)     │
│ 5. Redirects to /studio/orders/[id]/invoice │
│ 6. Auto-opens print dialog              │
└──────────────────────────────────────────┘
```

---

## Information Architecture

```
/studio/orders/new     ← NEW PAGE: Walk-in order creation form
/studio/orders         ← Existing list (walk-in orders appear here too)
/studio/orders/[id]    ← Existing detail (works for walk-in orders)
/studio/orders/[id]/invoice  ← Existing invoice (works for walk-in orders)
```

Walk-in orders are stored in the same `orders` table with:
- `payment_status: 'paid'` (cash/card/UPI) or `'pending'`
- `status: 'confirmed'` (skip 'new' since it's an in-person sale)
- `ship_*` fields: store address or blank (walk-in = no shipping)
- `notes: 'Walk-in sale'` or custom note

---

## Component Hierarchy

```
WalkInOrderPage (server component)
  └── WalkInOrderForm (client component — main form)
        ├── CustomerSection
        │     ├── Name input
        │     ├── Phone input (primary identifier for walk-in)
        │     └── Email input (optional)
        │
        ├── ItemsSection
        │     ├── ProductSearch (combobox — searches products table)
        │     ├── ItemRow × N (product, variant, qty, price, remove)
        │     └── AddItemButton
        │
        ├── SummarySection
        │     ├── Subtotal (auto-computed)
        │     ├── DiscountInput (flat ₹ or %)
        │     ├── TaxInput (GST %, default 0 for walk-in)
        │     └── Total (auto-computed)
        │
        ├── PaymentSection
        │     ├── PaymentMethod radio (cash/card/upi/pending)
        │     └── Notes textarea
        │
        └── SubmitButtons
              ├── "Create & Print Invoice" → creates order + redirects to invoice + auto-print
              └── "Save as Draft" → creates order with status 'new'
```

---

## Server Action: `createWalkInOrder`

```ts
// app/studio/actions/orders.ts (new action)

type WalkInInput = {
  // Customer
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  // Items
  items: Array<{
    product_slug: string;
    product_name: string;
    size: string | null;
    colour: string | null;
    qty: number;
    unit_price: number;
    is_fabric: boolean;
  }>;
  // Pricing
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  // Payment
  payment_method: "cash" | "card" | "upi" | "pending";
  notes?: string;
};
```

**Action flow:**
1. Validate with Zod
2. Upsert customer (by phone for walk-in, or email if provided)
3. Create order (status: confirmed, payment_status: paid/pending)
4. Insert order_items
5. Decrement inventory (same `fulfilOrderPaid` stock logic — but simplified since we know it's confirmed)
6. Log audit
7. Redirect to `/studio/orders/{id}/invoice?print=1`

The invoice page already handles everything — we just redirect there. The `?print=1` param triggers `window.print()` on load.

---

## Data Model Changes

**None required.** The existing schema supports everything:
- `orders.payment_status` already has 'paid' and 'pending'
- `orders.notes` can store "Walk-in · Cash" etc.
- `orders.ship_*` fields can be empty (walk-in = no shipping)
- `order_items` already supports both clothing (size) and fabric (colour + is_fabric)

---

## File-Level Implementation Plan

### 1. New page: `app/studio/orders/new/page.tsx`

Server component that fetches products for the search, renders `WalkInOrderForm`.

### 2. New component: `app/studio/orders/new/WalkInOrderForm.tsx`

Client component (~300 lines). The main form with:
- Customer fields (name, phone, email)
- Product search + item rows
- Auto-calculated totals
- Payment method selection
- Submit via server action

### 3. New component: `app/studio/orders/new/ProductSearch.tsx`

Client combobox component:
- Searches products by name (from a pre-loaded list or debounced)
- Shows results with price + sizes
- On select: adds to items with qty=1
- For fabric: prompts for metres

### 4. New server action: `app/studio/actions/orders.ts` → `createWalkInOrderAction`

Validates, creates order, inserts items, decrements stock, redirects to invoice.

### 5. Modify existing: `app/studio/orders/[id]/invoice/InvoiceActions.tsx`

Add auto-print on `?print=1` URL param:
```tsx
useEffect(() => {
  if (new URLSearchParams(window.location.search).has("print")) {
    setTimeout(() => window.print(), 500);
  }
}, []);
```

### 6. Styles: `app/studio/styles/studio.css`

Add `.stu-pos-*` block for the walk-in form layout.

---

## Edge Cases & Decisions

| Scenario | Handling |
|---|---|
| Customer has no email (walk-in, cash) | Phone is the primary identifier. Email defaults to `walkin-{phone}@placeholder.local` for the customer record (non-nullable in schema). |
| Same phone number as existing customer | Upsert: updates name, returns existing customer_id. Orders linked to same customer. |
| Product with no stock (OOS) | Allow anyway for walk-in (physical sale already happened). Show warning but don't block. |
| Fabric sold by metre (e.g. 2.5m) | Qty input accepts decimals for fabric items. Price calculation: qty × per-metre price. |
| Discount: flat vs percentage | UI toggle: ₹ amount or %. Server receives the final discount amount. |
| Tax: included vs excluded | Default 0% for walk-in (price already includes GST for physical store). Operator can set if needed. |
| Duplicate order (double submit) | Disable submit button on pending. Server action is idempotent (generates new order ID each time, so double-submit creates two orders — acceptable for POS). |
| Invoice for draft order | Works fine — invoice renders regardless of status. Payment shows "PENDING". |
| Send invoice via WhatsApp/Email | Phase 2: add "Send via WhatsApp" button that constructs a wa.me link with the invoice URL. Email: use a transactional email service. |

---

## Implementation Order (prioritized)

| Step | File | Effort | Impact |
|---|---|---|---|
| 1 | `createWalkInOrderAction` server action | 2h | Core — nothing works without this |
| 2 | `WalkInOrderForm.tsx` main form | 4h | The primary UI |
| 3 | `ProductSearch.tsx` combobox | 2h | Product selection UX |
| 4 | `orders/new/page.tsx` server page | 30min | Wire data + render form |
| 5 | Auto-print on `?print=1` | 15min | Polish — instant print flow |
| 6 | Styles | 1h | Visual polish |
| 7 | Stock decrement for walk-in | 1h | Inventory accuracy |

**Total: ~11 hours**

---

## UX Enhancements (future)

- **Quick access**: Add "New walk-in order" button to Studio dashboard + sidebar
- **Recent customers**: Autocomplete phone number from recent customers
- **Barcode/SKU scan**: Input field that accepts barcode scanner input
- **Receipt format**: Shorter thermal-printer-friendly format (58mm/80mm)
- **WhatsApp share**: Generate invoice link + send via wa.me API
- **Recurring customers**: Show their purchase history in the form
- **Multi-currency**: Support USD for international walk-ins

---

## Integration Points

- **Inventory**: Walk-in sales decrement `inventory.stock` (clothing) or `fabric_colours.stock_meters` (fabric) — same as online orders
- **Customer records**: Walk-in customers appear in `/studio/customers` with their total spend
- **Order list**: Walk-in orders appear in `/studio/orders` (can be filtered by `notes LIKE '%Walk-in%'` if needed)
- **Reports/KPIs**: Walk-in revenue counts in dashboard totals
- **Invoice**: Reuses the exact same invoice page and print infrastructure
