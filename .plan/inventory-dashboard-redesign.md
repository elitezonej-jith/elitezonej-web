# Inventory Operations Dashboard — Complete Redesign

## Vision

Transform `/studio/inventory` from a passive stock-viewing page into a **keyboard-driven, speed-optimised operations workbench** where an operator can update hundreds of stock values with near-zero cognitive load. Every pixel earns its place. Every interaction shaves a second off the daily routine.

---

## 1. Complete UX Redesign Rationale

### What's wrong today (and why it matters for someone updating stock 2+ hours daily)

| Current Friction | Impact | Redesign Solution |
|---|---|---|
| Summary cards are passive (click only filters view) | No quick drill-down; no context on *why* numbers changed | Interactive KPI cards with trend, delta, and direct action |
| Search is basic text match on name only | Operator can't find products by size, colourway, or SKU | Fuzzy search across all dimensions, with highlighted matches |
| Sort is 3 static chips (name, lowest, total) | Can't sort by recently updated, most-edited, or category | Rich sort dropdown with 8+ options |
| No density control | Wastes vertical space for power users | 3 density modes: Compact (show 40+ per view), Comfortable (default), Spacious |
| No keyboard navigation between items | Every edit requires a mouse click on the next cell | Full Tab/Arrow grid navigation — never leave the keyboard |
| No bulk operations | Restocking 20 products = 20 individual edits | Multi-select + bulk set/increase/decrease/mark OOS |
| No undo on auto-save | Accidental change = permanent | Toast with "Undo" action for every save (5s window) |
| Clothing and fabric are separate scrolling sections | Mental context switch; fabric buried below fold | Unified list with type badges, or tabbed view toggle |
| No visual stock health indicator beyond colour coding | Must read every number to assess | Mini progress bars + severity colour on every cell |
| Pagination forces scrolling back to top | Breaks flow during sequential editing | Sticky toolbar + scroll-aware navigation; virtual scroll for 100+ |
| "Start Tracking" is a separate bottom section | Feels like an afterthought; easily missed | Onboarding card that collapses after first use; accessible from toolbar |
| No product detail without page navigation | Every deep check = full navigation away | Slide-in drawer with stock history, images, notes |
| Hint text occupies permanent space | Only helpful on first visit | Auto-dismiss after first interaction; show via `?` shortcut |

---

## 2. Information Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│ INVENTORY OPERATIONS DASHBOARD                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ ┌─ Header ──────────────────────────────────────────────────────────┐   │
│ │ Title: "Inventory"                                                │   │
│ │ Subtitle: contextual (e.g. "3 items need attention")              │   │
│ │ Actions: [⌘K Search] [? Shortcuts] [+ Track new]                 │   │
│ └───────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│ ┌─ KPI Bar (sticky on scroll) ──────────────────────────────────────┐   │
│ │ [Tracked: 189] [Low Stock: 14 ↑4] [OOS: 6 ↑2] [Total: 4,218]   │   │
│ │ Each card: clickable filter, trend indicator, action arrow        │   │
│ └───────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│ ┌─ Alert Bar (conditional) ─────────────────────────────────────────┐   │
│ │ ⚠ 6 items are completely out of stock · View →                    │   │
│ └───────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│ ┌─ Toolbar (sticky) ────────────────────────────────────────────────┐   │
│ │ [🔍 Search...] [Type ▾] [Status ▾] [Sort ▾] [Density ▾]         │   │
│ │ Active filters: [Low stock ×] [Clothing ×] [Reset all]           │   │
│ │ Right: [1–15 of 189] [◀ ▶] [Bulk edit] [⌨ Shortcuts]            │   │
│ └───────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│ ┌─ Product List ────────────────────────────────────────────────────┐   │
│ │                                                                   │   │
│ │ ┌─ InventoryCard ───────────────────────────────────────────────┐ │   │
│ │ │ [☐] [IMG] Title                    [●Low] [Total: 24] [⋯]   │ │   │
│ │ │           SKU · Category · Updated 2h ago                     │ │   │
│ │ │                                                               │ │   │
│ │ │  ┌─StockCell─┐ ┌─StockCell─┐ ┌─StockCell─┐ ┌─StockCell─┐   │ │   │
│ │ │  │ 36   [12] │ │ 38   [ 8] │ │ 40   [ 0] │ │ 42   [15] │   │ │   │
│ │ │  │ █████░░░░ │ │ ████░░░░░ │ │ ░░░░░░░░░ │ │ ███████░░ │   │ │   │
│ │ │  └───────────┘ └───────────┘ └───────────┘ └───────────┘   │ │   │
│ │ └───────────────────────────────────────────────────────────────┘ │   │
│ │                                                                   │   │
│ │ ┌─ InventoryCard (Fabric) ──────────────────────────────────────┐ │   │
│ │ │ [☐] [IMG] Deep Plum Jacquard       [●OK] [Total: 72m] [⋯]   │ │   │
│ │ │           Fabric · 2 colourways · Updated 5h ago              │ │   │
│ │ │                                                               │ │   │
│ │ │  ┌──FabricCell──┐ ┌──FabricCell──┐                           │ │   │
│ │ │  │ ● Deep Plum  │ │ ● Ivory Gold │                           │ │   │
│ │ │  │   [30] m     │ │   [42] m     │                           │ │   │
│ │ │  │ ████████░░░  │ │ ██████████░  │                           │ │   │
│ │ │  └──────────────┘ └──────────────┘                           │ │   │
│ │ └───────────────────────────────────────────────────────────────┘ │   │
│ │                                                                   │   │
│ └───────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│ ┌─ Untracked (collapsed) ───────────────────────────────────────────┐   │
│ │ ▸ 12 products not tracked yet · Set up →                          │   │
│ └───────────────────────────────────────────────────────────────────┘   │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│ ┌─ Detail Drawer (slides from right when card clicked) ─────────────┐   │
│ │ Product images · Stock history · Movement log · Notes · Links     │   │
│ └───────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Progressive Disclosure Layers

1. **Glance** — KPI bar tells you if anything needs attention (< 1 second)
2. **Scan** — Alert bar highlights the most urgent issue
3. **Find** — Toolbar filters/searches to the exact subset
4. **Act** — Inline cells edit without navigation; Tab moves to next
5. **Verify** — Optimistic update + success animation confirms change
6. **Undo** — Toast with undo if mistake was made (5s window)
7. **Deep dive** — Drawer opens for full product context without leaving

---

## 3. Component Hierarchy

```
InventoryDashboard (page.tsx — Server Component)
├── InventoryShell (Client — wraps keyboard context + selection state)
│   ├── DashboardHeader
│   │   └── QuickActions (Track new, Shortcuts, Command Palette)
│   │
│   ├── KPIBar (sticky)
│   │   ├── StatCard (tracked)
│   │   ├── StatCard (low stock) — with trend badge
│   │   ├── StatCard (OOS) — with trend badge
│   │   ├── StatCard (total units)
│   │   └── StatCard (pending tracking)
│   │
│   ├── AlertBanner (conditional: only if OOS > 0 or critical)
│   │
│   ├── Toolbar (sticky below KPI)
│   │   ├── SearchInput (fuzzy, with shortcut hint)
│   │   ├── FilterDropdown (type, status, category)
│   │   ├── SortDropdown (8 options)
│   │   ├── DensityToggle (compact/comfortable/spacious)
│   │   ├── ActiveFilters (pills with × dismiss)
│   │   ├── PaginationInfo ("1–15 of 189")
│   │   ├── PageControls (◀ ▶)
│   │   └── BulkActions (shown when items selected)
│   │
│   ├── ProductList
│   │   ├── InventoryCard (clothing)
│   │   │   ├── SelectCheckbox
│   │   │   ├── ProductThumb (40×40 rounded)
│   │   │   ├── ProductInfo (name, meta line, updated time)
│   │   │   ├── StatusPill (healthy/low/oos/critical)
│   │   │   ├── TotalBadge (aggregate stock)
│   │   │   ├── OverflowMenu (view on store, edit product, history)
│   │   │   └── StockGrid
│   │   │       └── StockCell × N (size label, input, mini bar, severity)
│   │   │
│   │   ├── InventoryCard (fabric)
│   │   │   ├── SelectCheckbox
│   │   │   ├── ProductThumb
│   │   │   ├── ProductInfo
│   │   │   ├── StatusPill
│   │   │   ├── TotalBadge (metres)
│   │   │   ├── OverflowMenu
│   │   │   └── FabricGrid
│   │   │       └── FabricCell × N (swatch, name, input, bar, unit)
│   │   │
│   │   └── EmptyState (when no results match filter)
│   │
│   ├── UntrackedSection (collapsed by default)
│   │   └── StartTrackingCard
│   │
│   ├── DetailDrawer (slide-in from right)
│   │   ├── ProductImages
│   │   ├── StockHistoryTimeline
│   │   ├── QuickEdit (inline from drawer)
│   │   └── ProductLinks
│   │
│   ├── ToastStack (bottom-right)
│   │   └── Toast (message, undo action, auto-dismiss)
│   │
│   └── KeyboardShortcutModal (triggered by `?`)
│
└── (Server data props passed down)
```

---

## 4. User Journey — Daily Inventory Update Workflow

### Scenario: Operator arrives to update stock from physical count (150 products)

**Step 1: Landing (0s)**
- Page loads → KPI bar shows: "6 OOS ↑2 today" in red. Operator knows severity instantly.
- Alert banner: "⚠ 6 items are completely out of stock · View →"

**Step 2: Focus (2s)**
- Operator presses `/` → search input focuses immediately
- Types "vest" → fuzzy match shows 4 results highlighted
- Or clicks "Low Stock" KPI card → filters to only low-stock items

**Step 3: Edit First Item (5s)**
- Presses `↓` to focus first card, then `Tab` to enter the stock grid
- Cursor lands on first size cell (e.g. "36")
- Types `12` → `Tab` → moves to size "38" → types `8` → `Tab` → next size
- Each blur auto-saves. Success micro-animation (brief green pulse on cell)

**Step 4: Rapid Sequential Editing (1–30 min)**
- `Tab` moves through all sizes within a card
- At end of a card's sizes, `Tab` jumps to first size of next card
- Never touches mouse. Flow state maintained.
- If mistake: toast appears bottom-right → click "Undo" within 5s

**Step 5: Bulk Restock (if applicable)**
- `Shift+Click` to multi-select 8 products that all got the same restock
- Bulk action bar appears: "8 selected · [Set to...] [+Add] [-Reduce] [Mark OOS]"
- Clicks "+ Add 10" → all 8 products get +10 on all sizes → saves in batch

**Step 6: Fabric Check (2 min)**
- All fabrics are inline in the same list (sorted by name or filtered by type)
- Colourway cells show swatches + metres. Same Tab flow.
- Mini bars instantly show "Ivory Gold is 90% stocked, Deep Plum is at 60%"

**Step 7: Deep Dive (optional)**
- Clicks a product name → drawer slides from right
- Shows: thumbnail, last 10 stock movements, sales velocity, days-to-depletion
- Can edit stock directly from drawer without closing

**Step 8: Track New Product (rare)**
- Notices "12 products not tracked" collapsed at bottom
- Expands → searches → selects product → enters sizes → clicks Track
- Product appears in main list immediately

**Total time: ~15 min for 150 products (vs ~40 min today)**

---

## 5. High-Fidelity Layout Description

### Design Tokens (extending existing `--stu-*` system)

```css
:root {
  /* New inventory-specific tokens */
  --inv-cell-size: 88px;          /* width of each stock cell */
  --inv-cell-size-compact: 72px;
  --inv-cell-size-spacious: 104px;
  --inv-bar-height: 4px;          /* stock mini bar */
  --inv-card-gap: 8px;            /* between inventory cards */
  --inv-card-pad: 20px 24px;
  --inv-kpi-height: 80px;
  --inv-toolbar-height: 56px;
  --inv-drawer-width: 420px;

  /* Severity scale (unified) */
  --inv-healthy: #1F7A4F;
  --inv-healthy-soft: #E8F5EE;
  --inv-low: #B07A1A;
  --inv-low-soft: #FDF4E6;
  --inv-critical: #C43333;
  --inv-critical-soft: #FDECEC;
  --inv-empty: #8E8377;
  --inv-empty-soft: #F5F3F0;
}
```

### KPI Bar

```
Height: 80px
Background: var(--stu-surface)
Border-bottom: 1px solid var(--stu-border)
Sticky: top 0 (z-index 10)
Padding: 16px 32px
Display: flex, gap 16px, align center

Each StatCard:
  Padding: 12px 20px
  Border-radius: var(--stu-radius)
  Border: 1px solid var(--stu-border)
  Min-width: 140px
  Hover: translateY(-1px), shadow var(--stu-shadow-sm)
  Active (filtered to this view): border-color: var(--inv-healthy|low|critical), background: var(--inv-*-soft)

  Layout:
    Row 1: [Icon 16px (opacity 0.6)] [Label 11px uppercase tracking 0.04em var(--stu-text-3)]
    Row 2: [Number 28px weight 700 var(--stu-text)] [Trend badge: "+4" 11px, rounded-full, bg soft, color strong]
    Click → sets ?view= param
```

### Toolbar

```
Height: 56px
Background: var(--stu-surface)
Border-bottom: 1px solid var(--stu-border)
Sticky: top 80px (below KPI bar)
Padding: 10px 32px
Display: flex, align center, gap 12px
z-index: 9

SearchInput:
  Width: 240px (expands to 360px on focus)
  Height: 36px
  Background: var(--stu-surface-2)
  Border: 1px solid transparent → var(--stu-border) on focus
  Border-radius: var(--stu-radius-sm)
  Padding-left: 36px (icon space)
  Font: 13px
  Placeholder: "Search products, sizes, colours…  /"
  Transition: width 200ms var(--stu-ease)

FilterDropdown, SortDropdown:
  Height: 36px
  Border-radius: var(--stu-radius-sm)
  Background: var(--stu-surface-2) when closed
  Font: 13px weight 500
  Chevron icon right-aligned
  Dropdown panel: white, shadow-lg, radius-lg, max-height 320px, overflow-y auto

DensityToggle:
  3-segment: [≡ compact] [☰ comfortable] [▤ spacious]
  Active segment: bg var(--stu-surface), shadow-sm, weight 600
  Height: 32px

Pagination (right side):
  "1–15 of 189" in var(--stu-text-3), 12px
  ◀ ▶ buttons: 28×28, radius-sm, ghost hover
```

### InventoryCard

```
Background: var(--stu-surface)
Border: 1px solid var(--stu-border)
Border-radius: var(--stu-radius)
Padding: var(--inv-card-pad)
Margin-bottom: var(--inv-card-gap)
Transition: box-shadow 150ms, border-color 150ms
Hover: border-color var(--stu-border-strong), shadow var(--stu-shadow-sm)
Focus-within: ring 2px var(--stu-brand) offset 2px

Layout:
  Row 1 (header): flex, align-center, gap 12px
    [Checkbox 18×18, radius 4px, opacity 0 → 1 on card hover or bulk mode]
    [Thumbnail 36×36, radius 6px, object-fit cover, bg var(--stu-surface-2)]
    [ProductInfo: flex-col]
      Name: 14px weight 600 var(--stu-text), truncate 1 line
      Meta: 12px var(--stu-text-3) "Clothing · Suits · Updated 2h ago"
    [StatusPill: right-aligned, 11px uppercase tracking 0.03em, padding 3px 8px, radius-full]
      Healthy: bg var(--inv-healthy-soft), color var(--inv-healthy)
      Low: bg var(--inv-low-soft), color var(--inv-low)
      OOS: bg var(--inv-critical-soft), color var(--inv-critical)
    [TotalBadge: 13px weight 700 var(--stu-text-2), min-width 48px, text-right]
    [OverflowBtn: "⋯" 24×24, radius-full, opacity 0 → 1 on hover]

  Row 2 (stock grid): flex, flex-wrap, gap 6px, margin-top 12px, padding-left 66px (aligned under name)
```

### StockCell

```
Width: var(--inv-cell-size)
Padding: 8px 10px
Border-radius: var(--stu-radius-sm)
Border: 1px solid var(--stu-border)
Background: var(--stu-surface)
Transition: all 120ms var(--stu-ease)
Cursor: default → text on input focus

Layout:
  Row 1: flex, justify-between
    [Size label: 11px weight 600 uppercase var(--stu-text-3)]
    [Save indicator: ✓ 10px green, opacity animated]
  Row 2:
    [Input: 20px weight 700 var(--stu-text), width 100%, border none, bg transparent, text-center]
      Focus: outline none, cell gets border-color var(--stu-brand)
  Row 3:
    [Mini bar: height var(--inv-bar-height), radius 2px, margin-top 6px]
      Background track: var(--stu-surface-2)
      Fill: width = min(stock/max_stock*100%, 100%), bg = severity colour
      Severity: 0 → var(--inv-critical), 1-threshold → var(--inv-low), above → var(--inv-healthy)

Severity states:
  --oos: border-color var(--inv-critical), input color var(--inv-critical)
  --low: border-color var(--inv-low), input color var(--inv-low)
  --healthy: border remains neutral, input color var(--stu-text)

Hover: translateY(-1px), shadow var(--stu-shadow-sm)
Focus: border-color var(--stu-brand), shadow 0 0 0 3px rgba(122,28,28,0.08)
```

### FabricCell

```
Same dimensions as StockCell but adds:
  [Swatch: 12×12 circle, border 1px var(--stu-border-strong), top-left of cell]
  [Name: below swatch, 11px truncate, var(--stu-text-2)]
  [Input + "m" suffix]
  [Availability bar: same as mini bar but labelled "42m / 80m" tooltip]
```

---

## 6. Improved Interaction Model

### Keyboard Navigation

| Key | Context | Action |
|---|---|---|
| `/` | Anywhere | Focus search input |
| `Esc` | Search focused | Clear search and blur |
| `Esc` | Cell focused | Revert to original value, blur |
| `↓` / `↑` | Card focused | Move to next/previous card |
| `Tab` | Cell focused | Move to next cell (same card → next card) |
| `Shift+Tab` | Cell focused | Move to previous cell |
| `Enter` | Cell focused | Save current value |
| `Ctrl+S` / `⌘S` | Anywhere | Save all pending changes |
| `Shift+Click` | Card checkbox | Range-select between last selected and this |
| `Ctrl+Click` / `⌘+Click` | Card checkbox | Toggle individual selection |
| `Ctrl+A` / `⌘A` | List focused | Select all visible |
| `?` | Anywhere | Show keyboard shortcuts modal |
| `g then i` | Anywhere | Go to inventory (vim-style navigation) |

### Tab Order Within a Card

```
[Checkbox] → [First StockCell input] → [Second StockCell input] → ... → [Last StockCell input] → [Next card Checkbox]
```

Within StockGrid, Arrow keys (←→) move between cells horizontally.

### Auto-Save with Undo

1. User changes value → blur or Enter fires
2. **Optimistic update**: cell immediately shows new value + brief green pulse
3. Server action fires in background
4. Toast appears: "Updated size 38 → 12 · [Undo]" (5s timeout)
5. If Undo clicked: revert optimistic update, fire reverse server action
6. If server fails: cell shows brief red shake, reverts to old value, toast shows error

### Bulk Paste

- User focuses a cell → pastes multi-value clipboard (e.g. "10\t8\t15\t5")
- System distributes values left-to-right across cells starting from focused cell
- Shows confirmation toast: "Pasted 4 values across sizes 36–42"
- Tab-separated and newline-separated values both supported

### Bulk Edit Mode

- Triggered by: selecting 2+ items via checkbox
- Toolbar transforms: filter/sort section replaced by bulk action bar
- Actions: `[Set all to: ___]` `[+ Add: ___]` `[- Reduce: ___]` `[Mark OOS]` `[Cancel]`
- Preview: shows affected count "Apply to 8 products, 32 size variants"
- Confirmation: single click → batch server action → toast with undo

---

## 7. Accessibility Considerations

### WCAG AA Compliance

- All text meets 4.5:1 contrast ratio against backgrounds
- Interactive elements meet 3:1 against adjacent colours
- Focus indicators: 2px ring, offset 2px, colour var(--stu-brand) — visible in all themes
- Touch targets: minimum 44×44px for all interactive elements (cells, buttons)
- No information conveyed by colour alone: severity also has text labels + bar position

### Screen Reader Support

- Cards use `role="article"` with `aria-label="Product Name, status, total stock"`
- StockCells: `aria-label="Size 38, current stock 12, low stock"` on input
- KPI cards: `aria-label="Low stock: 14 items, increased by 4 today"`
- Live regions: `aria-live="polite"` on toast container and save confirmations
- Status changes announced: "Saved. Size 38 updated to 12."

### Focus Management

- On page load: focus lands on search input (unless deep-linked to a filter)
- After save: focus remains on the edited cell (no jump)
- After bulk action: focus returns to first selected item
- Drawer open: focus trapped inside drawer, Escape closes
- Modal (shortcuts): focus trapped, Escape closes

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .inv-cell, .inv-card, .inv-kpi { transition: none; }
  .inv-save-pulse { animation: none; opacity: 1; }
  .inv-bar-fill { transition: none; }
}
```

---

## 8. Performance Strategy

### Architecture for 10,000+ Products

**Server-side (stays Server Component for data fetching):**
- Single SQL query with JOINs (no N+1)
- Pagination: only fetch the visible page (15/30/60/100 per page)
- Fabric colours fetched in one bulk query with Map-based grouping

**Client-side hydration:**
- `InventoryShell` is the single Client Component boundary
- Receives serialised data as props (no client fetching)
- Stock cells are individual Client Components (micro-forms) — only re-render on their own value change
- `React.memo` on InventoryCard — prevents cascade re-renders when one cell saves

**Optimistic Updates:**
- `useOptimistic` (React 19) for instant UI feedback
- Pending state tracked per-cell (not per-card)
- Server action result reconciles: if success → noop; if failure → revert + error toast

**Virtual Scrolling (Phase 2, for catalogs > 100 items):**
- Implement with `@tanstack/virtual` or native IntersectionObserver
- Render only visible cards + 3 buffer above/below
- Maintain scroll position across filter/sort changes

**Batched Saves:**
- Debounce: if user tabs through 10 cells in 2 seconds, batch into single request
- Server action accepts array: `updateStockBatch([{slug, size, stock}, ...])`
- Reduces network requests 10× during rapid editing

**Caching:**
- Server Component data: fresh on every load (force-dynamic)
- Client state: optimistic until confirmed
- Drawer data: lazy-loaded on open, cached until drawer closes

---

## 9. New Reusable Component Architecture

### Design System Components

```typescript
// ─── StatCard ───────────────────────────────────────────────
type StatCardProps = {
  icon: ReactNode;
  label: string;
  value: number;
  trend?: { delta: number; direction: "up" | "down" };
  variant: "default" | "warning" | "danger" | "success";
  active?: boolean;
  onClick?: () => void;
};

// ─── AlertBanner ────────────────────────────────────────────
type AlertBannerProps = {
  severity: "info" | "warning" | "critical";
  message: string;
  action?: { label: string; onClick: () => void };
  dismissable?: boolean;
};

// ─── SearchInput ────────────────────────────────────────────
type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  shortcutHint?: string; // e.g. "/"
  onClear?: () => void;
};

// ─── FilterDropdown ─────────────────────────────────────────
type FilterDropdownProps = {
  label: string;
  options: Array<{ value: string; label: string; count?: number }>;
  selected: string[];
  onChange: (selected: string[]) => void;
  multi?: boolean;
};

// ─── SortDropdown ───────────────────────────────────────────
type SortDropdownProps = {
  options: Array<{ value: string; label: string; icon?: ReactNode }>;
  selected: string;
  onChange: (value: string) => void;
};

// ─── DensityToggle ──────────────────────────────────────────
type DensityToggleProps = {
  value: "compact" | "comfortable" | "spacious";
  onChange: (value: DensityToggleProps["value"]) => void;
};

// ─── InventoryCard ──────────────────────────────────────────
type InventoryCardProps = {
  product: {
    slug: string;
    name: string;
    kind: "tailored" | "fabric";
    category?: string;
    thumbnail?: string;
    updatedAt?: string;
  };
  status: "healthy" | "low" | "oos" | "critical";
  totalStock: number;
  unit: "units" | "m";
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
  onOpenDrawer?: () => void;
  density: "compact" | "comfortable" | "spacious";
  children: ReactNode; // StockGrid or FabricGrid
};

// ─── StockCell ──────────────────────────────────────────────
type StockCellProps = {
  slug: string;
  size: string;
  stock: number;
  maxStock?: number; // for bar percentage (default 30)
  threshold: number;
  density: "compact" | "comfortable" | "spacious";
  onSaved?: (newValue: number, oldValue: number) => void;
};

// ─── FabricCell ─────────────────────────────────────────────
type FabricCellProps = {
  slug: string;
  colourId: number;
  colourName: string;
  hex: string;
  stockMeters: number;
  maxMeters?: number; // for bar (default 50)
  density: "compact" | "comfortable" | "spacious";
  onSaved?: (newValue: number, oldValue: number) => void;
};

// ─── StatusPill ─────────────────────────────────────────────
type StatusPillProps = {
  status: "healthy" | "low" | "oos" | "critical" | "new" | "archived";
  size?: "sm" | "md";
};

// ─── StockBar ───────────────────────────────────────────────
type StockBarProps = {
  current: number;
  max: number;
  severity: "healthy" | "low" | "critical" | "empty";
  height?: number; // default 4px
};

// ─── QuantityBadge ──────────────────────────────────────────
type QuantityBadgeProps = {
  value: number;
  unit?: string;
  size?: "sm" | "md" | "lg";
};

// ─── DetailDrawer ───────────────────────────────────────────
type DetailDrawerProps = {
  open: boolean;
  onClose: () => void;
  productSlug: string;
  children?: ReactNode;
};

// ─── Toast ──────────────────────────────────────────────────
type ToastProps = {
  id: string;
  message: string;
  variant: "success" | "error" | "info";
  action?: { label: string; onClick: () => void }; // e.g. "Undo"
  duration?: number; // default 5000ms
};

// ─── SectionHeader ──────────────────────────────────────────
type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  collapsed?: boolean;
  onToggle?: () => void;
  action?: ReactNode;
};

// ─── InlineEditor ───────────────────────────────────────────
type InlineEditorProps = {
  value: number;
  min?: number;
  max?: number;
  onCommit: (newValue: number) => Promise<void>;
  onRevert?: () => void;
  formatDisplay?: (value: number) => string;
  size?: "sm" | "md";
};

// ─── QuickFilter ────────────────────────────────────────────
type QuickFilterProps = {
  label: string;
  active: boolean;
  count?: number;
  onClick: () => void;
  onDismiss?: () => void; // shown when active
};
```

---

## 10. Implementation Plan — Prioritized by Impact

### Phase 1: Core Experience Upgrade (Week 1 — highest impact)

| Task | Impact | Effort | Files |
|---|---|---|---|
| **StockCell with mini bar** — replace StockEditor with severity-coloured bars | Very High | 3h | StockCell.tsx, styles |
| **FabricCell with availability bar** — replace FabricStockCell | Very High | 2h | FabricCell.tsx, styles |
| **Unified product list** — merge clothing + fabric into one list with type badges | High | 3h | page.tsx |
| **Keyboard Tab navigation** between cells (within and across cards) | Very High | 4h | InventoryShell.tsx (context), StockCell |
| **Undo on auto-save** — toast with revert action | High | 3h | Toast, StockCell, server action |
| **Enhanced toolbar** — proper search + sort dropdown + filter chips | High | 4h | Toolbar.tsx, FilterDropdown, SortDropdown |

**Phase 1 total: ~19h**

### Phase 2: Speed & Power Features (Week 2)

| Task | Impact | Effort | Files |
|---|---|---|---|
| **KPI bar redesign** — interactive stat cards with trends | Medium-High | 3h | KPIBar.tsx, StatCard.tsx, styles |
| **Alert banner** — conditional warnings | Medium | 2h | AlertBanner.tsx |
| **Density toggle** (compact/comfortable/spacious) | Medium | 3h | DensityToggle.tsx, CSS vars, context |
| **Bulk paste support** — paste multiple values across cells | High | 3h | StockCell paste handler |
| **Batched saves** — debounce rapid edits into single request | High | 3h | useStockBatch hook, server action |
| **Bulk select + bulk edit** — multi-select with action bar | High | 5h | BulkBar, selection context, batch action |

**Phase 2 total: ~19h**

### Phase 3: Polish & Advanced (Week 3)

| Task | Impact | Effort | Files |
|---|---|---|---|
| **Detail drawer** — slide-in panel with product context | Medium | 5h | DetailDrawer.tsx, history fetch |
| **Fuzzy search** across name, size, colourway | Medium | 3h | search logic in page.tsx |
| **Start Tracking redesign** — collapsed onboarding section | Low-Medium | 2h | UntrackedSection.tsx |
| **Keyboard shortcuts modal** (`?` key) | Low-Medium | 2h | ShortcutModal.tsx |
| **Empty states** — beautiful illustrations + CTAs | Low | 2h | EmptyState.tsx |
| **Microinteractions** — save pulse, hover elevation, number transitions | Medium | 3h | CSS animations |
| **Dark mode support** — add `--inv-*` tokens for dark scheme | Low-Medium | 3h | CSS prefers-color-scheme |
| **Optimistic updates** — useOptimistic for instant feedback | Medium | 3h | StockCell refactor |

**Phase 3 total: ~23h**

### Phase 4: Scale (Week 4, only if catalog > 200 products)

| Task | Impact | Effort | Files |
|---|---|---|---|
| **Virtual scrolling** — render only visible cards | High (at scale) | 5h | VirtualList wrapper |
| **Pagination improvements** — rows per page selector (15/30/60/100) | Medium | 2h | page.tsx, Toolbar |
| **Server-side search** — move fuzzy search to SQL for large catalogs | Medium | 3h | page.tsx queries |
| **Background sync** — poll for external stock changes | Low | 3h | useInterval + diff |

**Phase 4 total: ~13h**

---

### Grand Total: ~74 hours (≈ 2 weeks of focused work)

### Recommended MVP (ship in 3 days):
1. StockCell with mini bar ✓
2. Unified list ✓
3. Tab keyboard navigation ✓
4. Enhanced toolbar with proper search ✓
5. Undo toast ✓

This alone transforms the daily workflow from "click-heavy passive page" to "keyboard-driven speed workbench."
