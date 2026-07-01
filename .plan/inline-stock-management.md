# Inline Stock Management — Architectural Plan

## Context

Currently, stock is managed via a separate `/studio/inventory` page (a global matrix view). The client wants to manage per-size stock quantities **directly within the product create/edit form** in Studio, so operators can set/adjust stock without navigating away.

The separate inventory page remains as-is — this is an **additive feature**, not a replacement.

---

## Current State (as-is)

```
┌─────────────────────────────────────────────────────────────────┐
│ ProductForm.tsx (client component)                               │
│                                                                 │
│ "Sizes & details" section:                                      │
│   <textarea> for sizes (one per line, -oos suffix = out-of-stock)│
│   No stock quantities — just a text list                        │
│                                                                 │
│ On save (saveProductAction):                                    │
│   • New product → seeds inventory with stock=6 for each size    │
│   • Edit product → does NOT touch inventory at all              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ /studio/inventory (separate page)                               │
│                                                                 │
│ Global matrix: all products × all sizes                         │
│ StockEditor: per-cell number input, auto-saves onBlur           │
│ updateStockAction: UPSERT on (product_slug, size)               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Proposed Design (to-be)

### UX Model

Replace the plain sizes textarea with a **structured size × stock table** inside the "Sizes & details" card. Each row = one size, with its stock quantity inline.

```
┌─────────────────────────────────────────────────────────────────┐
│ "Sizes & stock" card                                            │
│                                                                 │
│ ┌──────────────┬─────────────┬──────────┐                      │
│ │ Size         │ Stock qty   │          │                      │
│ ├──────────────┼─────────────┼──────────┤                      │
│ │ [36_______]  │ [_12______] │  [× Del] │                      │
│ │ [38_______]  │ [__8______] │  [× Del] │                      │
│ │ [40_______]  │ [__5______] │  [× Del] │                      │
│ │ [42_______]  │ [__0______] │  [× Del] │  ← highlighted red   │
│ └──────────────┴─────────────┴──────────┘                      │
│                                                                 │
│ [+ Add size]                                                    │
│                                                                 │
│ Total stock: 25 units   •   1 size out of stock                 │
└─────────────────────────────────────────────────────────────────┘
```

**Behaviour:**
- **Edit mode:** Pre-populates from the existing `inventory` table rows for this product.
- **New mode:** Starts empty. Operator adds sizes and sets initial stock (no more magic "6" default).
- Each row is a size name + stock number input.
- "Add size" adds a blank row. Operator types the size name and quantity.
- Delete removes a size from the form (and from DB on save).
- `oos_flag` is auto-computed: stock = 0 → oos_flag = 1.
- The old `-oos` suffix convention is **dropped** — the explicit stock number is the single source of truth.
- Saves happen **with the main form submit** (batch save) — not onBlur like the inventory page.

---

## File-Level Change Plan

### 1. Server component (data fetch) — `app/studio/products/[slug]/page.tsx`

**Change:** Fetch inventory data and pass it to ProductForm.

```diff
+ import { getInventory } from "../../../../lib/admin/repos/products";
  ...
  const product = await getProduct(slug);
+ const inventory = await getInventory(slug);
  ...
- <ProductForm mode="edit" product={product} meta={meta} categories={categories} filters={filterDefs} />
+ <ProductForm mode="edit" product={product} meta={meta} categories={categories} filters={filterDefs} inventory={inventory} />
```

**No change to `new/page.tsx`** — it passes no inventory (empty array default in form).

### 2. New client component — `app/studio/products/[slug]/SizeStockEditor.tsx`

A self-contained client component for the size × stock grid.

**Props:**
```ts
type SizeStockRow = { size: string; stock: number };
type Props = {
  initial: SizeStockRow[];    // from DB (empty for new products)
  onChange: (rows: SizeStockRow[]) => void;  // lifts state to parent form
};
```

**Responsibilities:**
- Renders the size/stock table with add/remove
- Manages its own local state (array of {size, stock} rows)
- Calls `onChange` on any mutation (parent form serialises to hidden inputs)
- Shows summary: total units, OOS count
- Visual indicators: red for stock=0, amber for stock ≤ low-stock threshold

**Why a separate component?** Keeps ProductForm's complexity bounded. The form itself stays as a thin orchestrator that collects data from child sections.

### 3. Modified client component — `app/studio/products/[slug]/ProductForm.tsx`

**Changes:**
- Remove the plain `sizes` textarea from "Sizes & details" section
- Import and render `SizeStockEditor` in its place
- Manage `sizeStockRows` state: `useState<SizeStockRow[]>(initial)`
- Serialize to hidden inputs the action can parse:
  ```html
  <input type="hidden" name="inventory_json" value={JSON.stringify(sizeStockRows)} />
  ```
- Still emit `sizes` as a derived value (for backward compat with `products.sizes_json`):
  ```ts
  const derivedSizes = sizeStockRows.map(r => r.size);
  <input type="hidden" name="sizes" value={derivedSizes.join("\n")} />
  ```

### 4. Modified server action — `app/studio/actions/products.ts` → `saveProductAction`

**Changes:**
```diff
  const ProductSchema = z.object({
    ...
-   sizes: z.string().default(""),
+   sizes: z.string().default(""),  // still kept (backward compat for sizes_json)
+   inventory_json: z.string().default("[]"),
    ...
  });

  // Inside the action body:
+ const inventoryRows: Array<{ size: string; stock: number }> = JSON.parse(v.inventory_json);
+ const inventoryPayload = inventoryRows.map(r => ({
+   size: r.size,
+   stock: Math.max(0, r.stock),
+   oos_flag: r.stock <= 0 ? 1 : 0,
+ }));

  await upsertProduct(input);
  await upsertMeta({ ... });

- if (!exists) {
-   await setInventory(v.slug, splitLines(v.sizes).map(s => ({ size: s, stock: 6, oos_flag: 0 })));
- }
+ // Always sync inventory (both new and edit)
+ if (inventoryPayload.length > 0) {
+   await setInventory(v.slug, inventoryPayload);
+ }
```

**Key decisions:**
- `setInventory` already does UPSERT + delete-orphans in a transaction — reuse as-is.
- No new repo functions needed.
- Both create and edit now go through the same inventory save path.
- `bustProducts()` already fires (handles storefront cache). Add explicit `bustInventory()` call too for `/studio/inventory` page revalidation.

### 5. Styles — `app/studio/styles/studio.css`

Add a `.stu-size-stock` block for the size/stock table:
- Grid layout: `size` (flex 2), `stock` (flex 1), `action` (32px)
- Red highlight on stock=0 rows
- Amber on low-stock rows (leverage the existing `--stu-warning` / `--stu-danger` tokens)
- Compact row spacing matching the existing `inv-size` component density

---

## Data Flow (edit save)

```
User clicks "Save changes"
       │
       ▼
ProductForm submits FormData to saveProductAction
  ├── FormData contains: name, price, ..., sizes (newline string), inventory_json
       │
       ▼
saveProductAction validates with Zod
       │
       ▼
upsertProduct(input)         → products table (sizes_json = derived from inventory rows)
upsertMeta(...)              → product_meta table
setInventory(slug, rows)     → inventory table (UPSERT + delete orphans, transaction)
       │
       ▼
bustProducts() + bustInventory()
revalidatePath(...)
redirect → /studio/products/{slug}?saved=1
```

---

## Data Flow (new product)

```
User fills form, adds sizes with quantities, clicks "Create product"
       │
       ▼
saveProductAction: same flow as edit
  • upsertProduct creates the product row
  • setInventory inserts all size/stock rows
  • No more hardcoded "stock: 6" default — operator sets real numbers
```

---

## Edge Cases & Decisions

| Scenario | Handling |
|---|---|
| Operator removes a size that has existing stock | `setInventory` deletes orphaned rows from `inventory` table. This is intentional — removing a size means the product no longer comes in that size. |
| Operator adds a new size to existing product | UPSERT creates the new inventory row. |
| Operator changes a size name (e.g. "L" → "XL") | This is a delete + add (old row deleted as orphan, new row created). Stock does NOT carry over — operator must re-enter. This is correct behaviour (changing a size IS changing the product offering). |
| Duplicate size names in the form | Frontend enforces uniqueness: trim, lowercase comparison. Show inline error if duplicate detected. |
| Stock left blank | Treat as 0 (out of stock). |
| Empty inventory on new product | Valid — product is created with no stock tracking. Same as today's untracked products (shows in "Start tracking" on the inventory page). |
| Concurrent stock decrements (order placed while operator is editing) | `setInventory` uses UPSERT which **overwrites** to the form value. This is acceptable since the inventory page's per-cell auto-save has the same semantics. The operator is making a deliberate stock count correction. |

---

## What Stays Unchanged

- `/studio/inventory` page — still the global matrix for bulk stock management
- `updateStockAction` — the per-cell auto-save action remains independent
- `products.sizes_json` — still maintained (derived from inventory rows) for backward compat
- Schema — no DDL changes needed
- Storefront stock reads — same `inventory` table, same queries

---

## Component Hierarchy (edit mode)

```
ProductEditorPage (server component)
  │  fetches: product, meta, images, colours, inventory
  │
  └── ProductForm (client component)
        │  props: mode, product, meta, categories, filters, inventory
        │  state: name, seoOpen, images, sizeStockRows
        │
        ├── "Basic info" card
        ├── "Pricing" card
        ├── "Sizes & stock" card
        │     └── SizeStockEditor (client component)
        │           props: initial, onChange
        │           state: rows[]
        ├── FilterAttributes
        ├── "Advanced: SEO" card
        └── Sidebar cards (Visibility, Category, etc.)
```

---

## Implementation Order

1. **SizeStockEditor.tsx** — new component, isolated, testable
2. **ProductForm.tsx** — replace textarea, wire new component, add hidden inputs
3. **[slug]/page.tsx** — fetch + pass inventory data
4. **saveProductAction** — parse `inventory_json`, call `setInventory` on every save
5. **studio.css** — add `.stu-size-stock` styles
6. **Verify** — `npx tsc --noEmit`, manual test (create + edit round trip)

---

## Effort Estimate

| File | Change Type | Complexity |
|---|---|---|
| `SizeStockEditor.tsx` | New (~80 lines) | Low-medium |
| `ProductForm.tsx` | Modify (replace textarea, add state) | Low |
| `[slug]/page.tsx` | Modify (2 lines) | Trivial |
| `saveProductAction` | Modify (~10 lines diff) | Low |
| `studio.css` | Add (~40 lines) | Low |

**Total:** ~2 hours of implementation work. No schema migration. No new dependencies.
