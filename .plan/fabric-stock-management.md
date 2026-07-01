# Fabric Stock Management in Studio — Architectural Plan

## Context

Fabrics are sold by the metre. Stock is tracked **per colourway** (colour variant), not per size.
The data model already exists and is fully wired into checkout validation and order fulfilment.
The gap: **Studio has no UI to manage fabric stock** — it's only available in the Admin panel's `/admin/fabrics/[slug]` route.

---

## Current State

```
┌─────────────────────────────────────────────────────────────────┐
│ Schema: fabric stock lives in two tables                        │
│                                                                 │
│ fabric_meta      (1:1 with product)                             │
│   product_slug   TEXT PK → products(slug)                       │
│   width_inches   INTEGER (e.g. 58)                              │
│   gsm            INTEGER (e.g. 180)                             │
│   composition    TEXT ("100% Pure Wool")                         │
│   care           TEXT ("Dry clean only")                         │
│   origin         TEXT ("Vitale Barberis Canonico, Biella")       │
│   stock_meters_total  INTEGER (aggregate — currently manual)    │
│                                                                 │
│ fabric_colours   (1:N per fabric product)                       │
│   id             INTEGER PK                                     │
│   product_slug   TEXT → products(slug)                          │
│   name           TEXT ("Charcoal", "Navy")                      │
│   hex            TEXT ("#4A4A4A")                                │
│   stock_meters   INTEGER (per-colourway stock)                  │
│   image_dir      TEXT | NULL                                    │
│   sort_order     INTEGER                                        │
└─────────────────────────────────────────────────────────────────┘

Checkout flow (already working):
  1. priceCart() → SELECT stock_meters FROM fabric_colours WHERE product_slug=? AND name=?
  2. Rejects if stock_meters < qty
  3. fulfilOrderPaid() → UPDATE fabric_colours SET stock_meters = stock_meters - ?
                       → UPDATE fabric_meta SET stock_meters_total = stock_meters_total - ?
```

---

## Proposed Design

### UX Model

When the product `kind === "fabric"`, the form conditionally shows:
1. **Fabric Specifications** card — width, GSM, composition, care, origin (set-once metadata)
2. **Colourway Stock** card — per-colourway name, swatch, hex, stock metres, image folder

These **replace** the SizeStockEditor (which only makes sense for tailored products).

### Layout: Colourway Stock Card

```
┌─────────────────────────────────────────────────────────────────┐
│ Colourway Stock                                                 │
│ 4 colourways · 182m total · 1 running low                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SWATCH   NAME              HEX        STOCK (M)            ×  │
│ ─────────────────────────────────────────────────────────────── │
│  [●]    [ Charcoal       ] #4A4A4A    [  45  ] m           [×] │
│  [●]    [ Navy           ] #1B2A4A    [  80  ] m           [×] │
│  [●]    [ Ivory          ] #FFFFF0    [   3  ] m  ⚠        [×] │  ← warning bg
│  [●]    [ Burgundy       ] #6B1D2A    [   0  ] m  ⚠        [×] │  ← error bg
│                                                                 │
│  [+ Add colourway]                                              │
│                                                                 │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│  128m total · 1 low (≤ 5m) · 1 out of stock                    │
└─────────────────────────────────────────────────────────────────┘
```

### Behaviour

- **Swatch:** clickable colour circle → opens native `<input type="color">` via hidden input + label pattern
- **Stock:** number input, `min=0`, `step=1` (whole metres). Suffix "m" shown beside input.
- **Low stock threshold:** stock > 0 and ≤ 5m → warning row highlight
- **OOS:** stock = 0 → error row highlight
- **Add colourway:** appends blank row, auto-focuses name input
- **Remove:** × button. Removes immediately (fabric colourways with stock get saved on form submit — no data loss until the operator explicitly saves)
- **Duplicate name:** inline error message, same pattern as SizeStockEditor
- **Image dir:** optional field, auto-defaults to `{slug}/{name_slugified}`
- **`stock_meters_total`:** auto-computed on save from `sum(colourway.stock_meters)` — no manual input needed

---

## File-Level Change Plan

### 1. New component — `app/studio/products/[slug]/FabricStockEditor.tsx`

```ts
"use client";
export type ColourwayRow = {
  name: string;
  hex: string;
  stock_meters: number;
  image_dir: string;
};

type Props = {
  initial: ColourwayRow[];
  slug: string;
  onChange: (rows: ColourwayRow[]) => void;
};
```

**Responsibilities:**
- Renders the colourway × stock grid
- Manages local state with add/remove
- Duplicate name detection (case-insensitive)
- Calls `onChange` on every mutation
- Summary with total metres, low count, OOS count
- Visual states: normal, low stock (warning), OOS (error)

### 2. New component — `app/studio/products/[slug]/FabricMetaFields.tsx`

```ts
"use client";
type Props = {
  meta: {
    width_inches: number;
    gsm: number;
    composition: string;
    care: string;
    origin: string;
  } | null;
};
```

Simple field group with `.stu-row--3` and `.stu-row` grid layouts.
Emits named hidden inputs: `fabric_meta_width`, `fabric_meta_gsm`, `fabric_meta_composition`, `fabric_meta_care`, `fabric_meta_origin`.

### 3. Modified — `app/studio/products/[slug]/ProductForm.tsx`

**Conditional rendering based on product kind:**

```tsx
const [kind, setKind] = useState(product?.kind ?? "tailored");

// In the form body:
{kind === "fabric" ? (
  <>
    <FabricMetaFields meta={fabricMeta} />
    <FabricStockEditor
      initial={fabricColours}
      slug={product?.slug ?? slugDerived}
      onChange={(rows) => { setFabricColourRows(rows); markDirty(); }}
    />
    <input type="hidden" name="fabric_colours_json" value={JSON.stringify(fabricColourRows.filter(r => r.name.trim()))} />
  </>
) : (
  <>
    <SizeStockEditor ... />
    <input type="hidden" name="inventory_json" ... />
  </>
)}
```

Also need to make the `kind` select a controlled component so switching `kind` dynamically shows/hides the appropriate editor.

### 4. Modified — `app/studio/products/[slug]/page.tsx`

Fetch fabric-specific data when the product is a fabric:

```diff
+ import { getFabricMeta, listFabricColours } from "../../../../lib/admin/repos/fabrics";
  ...
  const inventory = (await getInventory(slug)).map(r => ({ size: r.size, stock: r.stock }));
+ const fabricMeta = product.kind === "fabric" ? await getFabricMeta(slug) : null;
+ const fabricColours = product.kind === "fabric"
+   ? (await listFabricColours(slug)).map(c => ({
+       name: c.name, hex: c.hex, stock_meters: c.stock_meters, image_dir: c.image_dir ?? "",
+     }))
+   : [];
  ...
  <ProductForm
    ...
    inventory={inventory}
+   fabricMeta={fabricMeta}
+   fabricColours={fabricColours}
  />
```

### 5. Modified — `app/studio/actions/products.ts` → `saveProductAction`

Add fabric-specific fields to Zod schema and save logic:

```diff
  const ProductSchema = z.object({
    ...
+   fabric_colours_json: z.string().default("[]"),
+   fabric_meta_width: z.coerce.number().int().min(0).max(120).default(58),
+   fabric_meta_gsm: z.coerce.number().int().min(0).max(2000).default(0),
+   fabric_meta_composition: z.string().max(200).default(""),
+   fabric_meta_care: z.string().max(200).default(""),
+   fabric_meta_origin: z.string().max(200).default(""),
    ...
  });
```

After the existing inventory save:

```ts
  // Fabric-specific saves
  if (input.kind === "fabric") {
    // Parse and validate colourways
    let fabricColours: Array<{ name: string; hex: string; stock_meters: number; image_dir: string }> = [];
    try { fabricColours = JSON.parse(v.fabric_colours_json); } catch {}
    
    const cleanColours = fabricColours
      .filter(c => c.name && typeof c.name === "string" && c.name.trim())
      .map(c => ({
        name: c.name.trim(),
        hex: /^#[0-9a-fA-F]{6}$/.test(c.hex) ? c.hex : "#000000",
        stock_meters: Math.max(0, Math.round(Number(c.stock_meters) || 0)),
        image_dir: (c.image_dir || `${v.slug}/${c.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}`),
      }));

    // Auto-compute total from per-colourway stock
    const totalMeters = cleanColours.reduce((sum, c) => sum + c.stock_meters, 0);

    await upsertFabricMeta(v.slug, {
      width_inches: v.fabric_meta_width,
      gsm: v.fabric_meta_gsm,
      composition: v.fabric_meta_composition,
      care: v.fabric_meta_care,
      origin: v.fabric_meta_origin,
      stock_meters_total: totalMeters,
    });

    if (cleanColours.length > 0) {
      await setFabricColours(v.slug, cleanColours);
    }
  }
```

### 6. Styles — `app/studio/styles/studio.css`

Add `.stu-fabric-stock` block (~60 lines):

```css
.stu-fabric-stock__row {
  display: grid;
  grid-template-columns: 28px 1.5fr 90px 80px 32px;
  /* swatch | name | hex | stock | remove */
  gap: 8px;
  align-items: center;
}
.stu-fabric-stock__row--low { background: var(--stu-warning-soft); }
.stu-fabric-stock__row--oos { background: var(--stu-error-soft); }
.stu-fabric-stock__swatch { width: 24px; height: 24px; border-radius: 50%; border: 1px solid var(--stu-border-strong); }
```

---

## Data Flow

### Edit save (fabric product)

```
User clicks "Save changes"
       │
       ▼
ProductForm submits FormData:
  ├── standard product fields (name, price, kind="fabric", ...)
  ├── fabric_meta_width, fabric_meta_gsm, ...
  ├── fabric_colours_json = '[{"name":"Charcoal","hex":"#4A4A4A","stock_meters":45,"image_dir":"..."},...]'
  └── sizes = "" (empty — fabrics don't use sizes)
       │
       ▼
saveProductAction:
  ├── upsertProduct(input)        → products table
  ├── upsertMeta(...)             → product_meta table
  ├── (inventory path skipped — sizes empty for fabrics)
  ├── upsertFabricMeta(...)       → fabric_meta (stock_meters_total = sum of colourways)
  └── setFabricColours(...)       → fabric_colours (DELETE + INSERT in transaction)
       │
       ▼
bustProducts() + bustInventory()
revalidatePath(...)
redirect → /studio/products/{slug}?saved=1
```

### Checkout reads (already working, no changes)

```
Customer adds fabric to cart → priceCart()
  → SELECT stock_meters FROM fabric_colours WHERE product_slug=? AND name=?
  → Rejects if stock_meters < qty

Payment confirmed → fulfilOrderPaid()
  → UPDATE fabric_colours SET stock_meters = stock_meters - ?
  → UPDATE fabric_meta SET stock_meters_total = stock_meters_total - ?
```

---

## Edge Cases & Decisions

| Scenario | Handling |
|---|---|
| Operator switches kind from "tailored" → "fabric" | Form swaps SizeStockEditor for FabricStockEditor. On save, sizes/inventory remain untouched (orphaned but harmless). Fabric data is created fresh. |
| Operator switches kind from "fabric" → "tailored" | Form swaps back. On save, fabric data remains untouched. Operator adds sizes via SizeStockEditor. |
| Duplicate colourway names | Frontend blocks with inline error. Server validates too — filters to unique names. |
| Hex left empty | Defaults to #000000. |
| Stock left empty | Treated as 0 (out of stock). |
| No colourways added for a fabric | Valid — product exists but has no purchasable colourways. Checkout will reject any order attempt. |
| Concurrent stock decrement (order while operator edits) | Same as tailored — `setFabricColours` does DELETE + INSERT, so operator's save overwrites. This is an intentional stock correction. |
| `stock_meters_total` drifts from sum of colourways | Auto-computed on every save. Also auto-reconciled by `fulfilOrderPaid()` decrementing both. |
| image_dir left blank | Auto-generated: `{slug}/{colourway_name_slugified}` |
| Admin panel edits same fabric concurrently | Last writer wins. Both surfaces write to the same tables. The admin uses `saveFabricColoursAction` (DELETE + INSERT), same pattern. |

---

## What Stays Unchanged

- **Admin panel `/admin/fabrics/[slug]`** — still functional, independent
- **Checkout** — reads `fabric_colours` directly, no cache involved
- **Order fulfilment** — ring-fenced, decrements `stock_meters` atomically
- **Schema** — no DDL changes needed (all tables already exist)
- **`lib/admin/repos/fabrics.ts`** — reuse existing `upsertFabricMeta` and `setFabricColours` as-is

---

## Component Hierarchy (edit mode, fabric product)

```
ProductEditorPage (server component)
  │  fetches: product, meta, images, colours, inventory, fabricMeta, fabricColours
  │
  └── ProductForm (client component)
        │  props: mode, product, meta, categories, filters, inventory,
        │         fabricMeta, fabricColours
        │  state: name, kind, sizeStockRows, fabricColourRows, ...
        │
        ├── "Basic info" card
        ├── "Pricing" card
        ├── CONDITIONAL: kind === "fabric"
        │     ├── "Fabric Specifications" card
        │     │     └── FabricMetaFields (width, gsm, composition, care, origin)
        │     └── "Colourway Stock" card
        │           └── FabricStockEditor (colourway × stock grid)
        │
        ├── CONDITIONAL: kind === "tailored"
        │     ├── "Sizes & stock" card
        │     │     └── SizeStockEditor (size × stock grid)
        │     └── "Details" card (highlights, specs, size guide)
        │
        ├── FilterAttributes
        ├── "Advanced: SEO" card
        └── Sidebar cards (Visibility, Category, etc.)
```

---

## Implementation Order

1. **FabricStockEditor.tsx** — new component (~140 lines)
2. **FabricMetaFields.tsx** — new component (~50 lines)
3. **studio.css** — add `.stu-fabric-stock` + `.stu-fabric-meta` styles (~70 lines)
4. **ProductForm.tsx** — make `kind` controlled, conditional render, add fabricColourRows state + hidden inputs
5. **[slug]/page.tsx** — fetch fabricMeta + fabricColours, pass to ProductForm
6. **saveProductAction** — add fabric fields to schema, parse & save fabric data on `kind === "fabric"`
7. **Verify** — `npx tsc --noEmit`, manual test (create fabric + edit fabric round trip)

---

## Effort Estimate

| File | Change Type | Complexity |
|---|---|---|
| `FabricStockEditor.tsx` | New (~140 lines) | Medium |
| `FabricMetaFields.tsx` | New (~50 lines) | Low |
| `ProductForm.tsx` | Modify (conditional kind, new state, hidden inputs) | Medium |
| `[slug]/page.tsx` | Modify (4 lines — fetch + pass) | Trivial |
| `saveProductAction` | Modify (~30 lines — schema + save logic) | Low-medium |
| `studio.css` | Add (~70 lines) | Low |

**Total:** ~3 hours. No schema migration. No new dependencies.

---

## Sync Verification Checklist

After implementation, verify these integration points:

- [ ] Studio edit: fabric product shows colourway editor (not size editor)
- [ ] Save: `fabric_colours` rows update in DB
- [ ] Save: `fabric_meta.stock_meters_total` = sum of colourway stock
- [ ] Storefront checkout: fabric with stock=0 is rejected at cart pricing
- [ ] Storefront checkout: fabric with sufficient stock passes pricing
- [ ] Order fulfilment: `stock_meters` decrements on payment
- [ ] `/studio/inventory` page: fabric products show (still via `inventory` table — separate concern)
- [ ] Admin panel: `/admin/fabrics/[slug]` still works independently
- [ ] Switching kind from tailored↔fabric in the form shows correct editor
