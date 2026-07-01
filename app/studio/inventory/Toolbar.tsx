"use client";
import { useRef, useEffect } from "react";

type Props = {
  query: string;
  view: string;
  sort: string;
  kind: string;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function buildHref(params: Record<string, string | undefined>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) u.set(k, v);
  return "/studio/inventory" + (u.toString() ? `?${u}` : "");
}

export default function Toolbar({ query, view, sort, kind, total, page, pageSize, totalPages }: Props) {
  const searchRef = useRef<HTMLInputElement>(null);

  // Global "/" shortcut to focus search
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="inv2-toolbar">
      {/* Search */}
      <form method="GET" action="/studio/inventory" className="inv2-toolbar__search">
        {view && view !== "all" && <input type="hidden" name="view" value={view} />}
        {sort && sort !== "name" && <input type="hidden" name="sort" value={sort} />}
        {kind && <input type="hidden" name="kind" value={kind} />}
        <svg className="inv2-toolbar__search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input
          ref={searchRef}
          name="q"
          defaultValue={query}
          className="inv2-toolbar__search-input"
          placeholder="Search products, sizes, colours…"
          aria-label="Search inventory"
        />
        <kbd className="inv2-toolbar__kbd">/</kbd>
      </form>

      {/* Filter pills */}
      <div className="inv2-toolbar__filters">
        <a href={buildHref({ q: query || undefined, sort: sort !== "name" ? sort : undefined, kind: kind || undefined })}
           className={`inv2-toolbar__pill ${view === "all" || !view ? "inv2-toolbar__pill--on" : ""}`}>All</a>
        <a href={buildHref({ view: "low", q: query || undefined, sort: sort !== "name" ? sort : undefined, kind: kind || undefined })}
           className={`inv2-toolbar__pill inv2-toolbar__pill--warn ${view === "low" ? "inv2-toolbar__pill--on" : ""}`}>Low stock</a>
        <a href={buildHref({ view: "oos", q: query || undefined, sort: sort !== "name" ? sort : undefined, kind: kind || undefined })}
           className={`inv2-toolbar__pill inv2-toolbar__pill--danger ${view === "oos" ? "inv2-toolbar__pill--on" : ""}`}>Out of stock</a>

        <span className="inv2-toolbar__sep" />

        <a href={buildHref({ view: view !== "all" ? view : undefined, q: query || undefined, sort: sort !== "name" ? sort : undefined })}
           className={`inv2-toolbar__pill ${!kind ? "inv2-toolbar__pill--on" : ""}`}>All types</a>
        <a href={buildHref({ view: view !== "all" ? view : undefined, q: query || undefined, sort: sort !== "name" ? sort : undefined, kind: "tailored" })}
           className={`inv2-toolbar__pill ${kind === "tailored" ? "inv2-toolbar__pill--on" : ""}`}>Clothing</a>
        <a href={buildHref({ view: view !== "all" ? view : undefined, q: query || undefined, sort: sort !== "name" ? sort : undefined, kind: "fabric" })}
           className={`inv2-toolbar__pill ${kind === "fabric" ? "inv2-toolbar__pill--on" : ""}`}>Fabrics</a>
      </div>

      {/* Sort */}
      <div className="inv2-toolbar__sort">
        <label className="inv2-toolbar__sort-label">Sort</label>
        <select
          className="inv2-toolbar__sort-select"
          defaultValue={sort}
          onChange={(e) => { window.location.href = buildHref({ view: view !== "all" ? view : undefined, q: query || undefined, sort: e.target.value !== "name" ? e.target.value : undefined, kind: kind || undefined }); }}
        >
          <option value="name">Name A–Z</option>
          <option value="lowest">Lowest first</option>
          <option value="total">Total stock</option>
          <option value="updated">Recently updated</option>
        </select>
      </div>

      {/* Pagination info */}
      <div className="inv2-toolbar__pages">
        <span className="inv2-toolbar__pages-info">{from}–{to} of {total}</span>
        {page > 1 && <a href={buildHref({ view: view !== "all" ? view : undefined, q: query || undefined, sort: sort !== "name" ? sort : undefined, kind: kind || undefined, page: String(page - 1) })} className="inv2-toolbar__page-btn" aria-label="Previous page">‹</a>}
        {page < totalPages && <a href={buildHref({ view: view !== "all" ? view : undefined, q: query || undefined, sort: sort !== "name" ? sort : undefined, kind: kind || undefined, page: String(page + 1) })} className="inv2-toolbar__page-btn" aria-label="Next page">›</a>}
      </div>
    </div>
  );
}
