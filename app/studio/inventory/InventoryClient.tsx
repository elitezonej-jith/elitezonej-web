"use client";
import { useState, useMemo, useCallback, useEffect } from "react";
import UndoToast, { type UndoEntry } from "./UndoToast";
import InventoryCard from "./InventoryCard";
import StockCell from "./StockCell";
import FabricCell from "./FabricCell";
import { IconBox } from "../components/Icons";

// ─── Types ─────────────────────────────────────────────────────────────
export type ClothingItem = {
  _type: "clothing";
  slug: string;
  name: string;
  kind: "tailored";
  status: "healthy" | "low" | "oos";
  sizes: Array<{ size: string; stock: number }>;
  total: number;
  hasLow: boolean;
  hasOos: boolean;
};

export type FabricItem = {
  _type: "fabric";
  slug: string;
  name: string;
  kind: "fabric";
  status: "healthy" | "low" | "oos";
  colours: Array<{ id: number; name: string; hex: string; stock_meters: number }>;
  total: number;
  hasLow: boolean;
  hasOos: boolean;
};

export type UnifiedItem = ClothingItem | FabricItem;

type Density = "compact" | "comfortable" | "spacious";

type Props = {
  items: UnifiedItem[];
  threshold: number;
  fabricLow: number;
  totalOos: number;
  totalLow: number;
  initialView: string;
  initialSort: string;
  initialKind: string;
  initialQuery: string;
};

const PAGE_SIZE = 20;

export default function InventoryClient({
  items, threshold, fabricLow, totalOos, totalLow,
  initialView, initialSort, initialKind, initialQuery,
}: Props) {
  // ─── Client state ───────────────────────────────────────────────────
  const [query, setQuery] = useState(initialQuery);
  const [view, setView] = useState(initialView);
  const [sort, setSort] = useState(initialSort);
  const [kind, setKind] = useState(initialKind);
  const [density, setDensity] = useState<Density>("comfortable");
  const [page, setPage] = useState(1);
  const [undoEntry, setUndoEntry] = useState<UndoEntry | null>(null);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [query, view, sort, kind]);

  // ─── Filter / Sort / Paginate (all client-side) ─────────────────────
  const filtered = useMemo(() => {
    let result = [...items];

    // View filter
    if (view === "low") result = result.filter(r => r.hasLow);
    else if (view === "oos") result = result.filter(r => r.hasOos);

    // Kind filter
    if (kind === "tailored") result = result.filter(r => r._type === "clothing");
    else if (kind === "fabric") result = result.filter(r => r._type === "fabric");

    // Search filter (fuzzy: name, sizes, colourways)
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(r => {
        if (r.name.toLowerCase().includes(q)) return true;
        if (r._type === "clothing") {
          return r.sizes.some(s => s.size.toLowerCase().includes(q));
        } else {
          return r.colours.some(c => c.name.toLowerCase().includes(q));
        }
      });
    }

    // Sort
    if (sort === "name") result.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "lowest") result.sort((a, b) => {
      const aMin = a._type === "clothing" ? (a.sizes.length ? Math.min(...a.sizes.map(s => s.stock)) : 0) : a.total;
      const bMin = b._type === "clothing" ? (b.sizes.length ? Math.min(...b.sizes.map(s => s.stock)) : 0) : b.total;
      return aMin - bMin;
    });
    else if (sort === "total") result.sort((a, b) => a.total - b.total);

    return result;
  }, [items, query, view, sort, kind]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, filtered.length);

  const dismiss = useCallback(() => setUndoEntry(null), []);

  // ─── Density class ──────────────────────────────────────────────────
  const densityClass = `inv2--${density}`;

  return (
    <div className={densityClass}>
      {/* Alert banner */}
      {(totalOos > 0 || totalLow > 0) && (
        <div className={`inv2-alert ${totalOos > 0 ? "inv2-alert--critical" : "inv2-alert--warn"}`}>
          <span className="inv2-alert__icon">{totalOos > 0 ? "⚠" : "📉"}</span>
          <span className="inv2-alert__msg">
            {totalOos > 0 && <>{totalOos} item{totalOos !== 1 ? "s" : ""} out of stock</>}
            {totalOos > 0 && totalLow > 0 && " · "}
            {totalLow > 0 && <>{totalLow} running low</>}
          </span>
          {totalOos > 0 && (
            <button type="button" className="inv2-alert__action" onClick={() => setView("oos")}>
              View OOS →
            </button>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="inv2-toolbar">
        {/* Search — instant client-side, no form */}
        <div className="inv2-toolbar__search">
          <svg className="inv2-toolbar__search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="inv2-toolbar__search-input"
            placeholder="Search products, sizes, colours…"
            aria-label="Search inventory"
          />
          {query && (
            <button type="button" className="inv2-toolbar__search-clear" onClick={() => setQuery("")} aria-label="Clear search">×</button>
          )}
          {!query && <kbd className="inv2-toolbar__kbd">/</kbd>}
        </div>

        {/* Filter pills */}
        <div className="inv2-toolbar__filters">
          <button type="button" onClick={() => setView("all")} className={`inv2-toolbar__pill ${view === "all" ? "inv2-toolbar__pill--on" : ""}`}>All</button>
          <button type="button" onClick={() => setView("low")} className={`inv2-toolbar__pill inv2-toolbar__pill--warn ${view === "low" ? "inv2-toolbar__pill--on" : ""}`}>Low stock</button>
          <button type="button" onClick={() => setView("oos")} className={`inv2-toolbar__pill inv2-toolbar__pill--danger ${view === "oos" ? "inv2-toolbar__pill--on" : ""}`}>Out of stock</button>

          <span className="inv2-toolbar__sep" />

          <button type="button" onClick={() => setKind("")} className={`inv2-toolbar__pill ${!kind ? "inv2-toolbar__pill--on" : ""}`}>All types</button>
          <button type="button" onClick={() => setKind("tailored")} className={`inv2-toolbar__pill ${kind === "tailored" ? "inv2-toolbar__pill--on" : ""}`}>Clothing</button>
          <button type="button" onClick={() => setKind("fabric")} className={`inv2-toolbar__pill ${kind === "fabric" ? "inv2-toolbar__pill--on" : ""}`}>Fabrics</button>
        </div>

        {/* Sort */}
        <div className="inv2-toolbar__sort">
          <label className="inv2-toolbar__sort-label">Sort</label>
          <select
            className="inv2-toolbar__sort-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="name">Name A–Z</option>
            <option value="lowest">Lowest first</option>
            <option value="total">Total stock</option>
          </select>
        </div>

        {/* Density toggle */}
        <div className="inv2-toolbar__density">
          <button type="button" onClick={() => setDensity("compact")} className={`inv2-toolbar__density-btn ${density === "compact" ? "inv2-toolbar__density-btn--on" : ""}`} title="Compact" aria-label="Compact density">
            <svg width="14" height="14" viewBox="0 0 14 14"><rect x="1" y="2" width="12" height="2" rx="1" fill="currentColor"/><rect x="1" y="6" width="12" height="2" rx="1" fill="currentColor"/><rect x="1" y="10" width="12" height="2" rx="1" fill="currentColor"/></svg>
          </button>
          <button type="button" onClick={() => setDensity("comfortable")} className={`inv2-toolbar__density-btn ${density === "comfortable" ? "inv2-toolbar__density-btn--on" : ""}`} title="Comfortable" aria-label="Comfortable density">
            <svg width="14" height="14" viewBox="0 0 14 14"><rect x="1" y="1" width="12" height="3" rx="1" fill="currentColor"/><rect x="1" y="5.5" width="12" height="3" rx="1" fill="currentColor"/><rect x="1" y="10" width="12" height="3" rx="1" fill="currentColor"/></svg>
          </button>
          <button type="button" onClick={() => setDensity("spacious")} className={`inv2-toolbar__density-btn ${density === "spacious" ? "inv2-toolbar__density-btn--on" : ""}`} title="Spacious" aria-label="Spacious density">
            <svg width="14" height="14" viewBox="0 0 14 14"><rect x="1" y="0" width="12" height="4" rx="1" fill="currentColor"/><rect x="1" y="5" width="12" height="4" rx="1" fill="currentColor"/><rect x="1" y="10" width="12" height="4" rx="1" fill="currentColor"/></svg>
          </button>
        </div>

        {/* Pagination */}
        <div className="inv2-toolbar__pages">
          <span className="inv2-toolbar__pages-info">{filtered.length > 0 ? `${from}–${to} of ${filtered.length}` : "0 results"}</span>
          <button type="button" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="inv2-toolbar__page-btn" aria-label="Previous page">‹</button>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="inv2-toolbar__page-btn" aria-label="Next page">›</button>
        </div>
      </div>

      {/* Product List */}
      <div className="inv2-list-wrap">
        {paged.length === 0 ? (
          <div className="inv2-empty">
            <IconBox width={32} height={32} />
            <p className="inv2-empty__title">
              {query ? `No products match "${query}"` : "No products match your filters"}
            </p>
            <p className="inv2-empty__sub">Try adjusting your search or filter criteria</p>
            {(query || view !== "all" || kind) && (
              <button type="button" className="stu-btn stu-btn--ghost stu-btn--sm" onClick={() => { setQuery(""); setView("all"); setKind(""); }}>
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <div className="inv2-list">
            {paged.map(row => {
              if (row._type === "clothing") {
                return (
                  <InventoryCard
                    key={row.slug}
                    slug={row.slug}
                    name={row.name}
                    kind="tailored"
                    status={row.status}
                    total={row.total}
                    unit="units"
                  >
                    {row.sizes.map(s => (
                      <StockCell
                        key={s.size}
                        slug={row.slug}
                        size={s.size}
                        stock={s.stock}
                        threshold={threshold}
                      />
                    ))}
                  </InventoryCard>
                );
              } else {
                return (
                  <InventoryCard
                    key={row.slug}
                    slug={row.slug}
                    name={row.name}
                    kind="fabric"
                    status={row.status}
                    total={row.total}
                    unit="m"
                    colourCount={row.colours.length}
                  >
                    {row.colours.map(c => (
                      <FabricCell
                        key={c.id}
                        slug={row.slug}
                        colourId={c.id}
                        colourName={c.name}
                        hex={c.hex}
                        stockMeters={c.stock_meters}
                      />
                    ))}
                  </InventoryCard>
                );
              }
            })}
          </div>
        )}
      </div>

      <UndoToast entry={undoEntry} onDismiss={dismiss} />
    </div>
  );
}
