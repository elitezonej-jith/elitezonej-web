"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PRODUCTS, Product } from "@/lib/products";
import { fmtINR } from "@/lib/format";
import { imgFabric } from "@/lib/images";
import WishlistButton from "./WishlistButton";
import { useModalA11y } from "./useModalA11y";

type Props = { open: boolean; onClose: () => void };

type CatChip = "all" | "men" | "women" | "fabrics" | "festive";
type FabricChip = "Wool" | "Linen" | "Cotton" | "Silk" | "Velvet";

const CAT_CHIPS: { value: CatChip; label: string }[] = [
  { value: "all",      label: "All" },
  { value: "men",      label: "Men" },
  { value: "women",    label: "Women" },
  { value: "fabrics",  label: "Fabrics" },
  { value: "festive",  label: "Festive" },
];
const FABRIC_CHIPS: FabricChip[] = ["Wool", "Linen", "Cotton", "Silk", "Velvet"];

// Build a flat haystack per product, lowercased, for substring matching.
function haystack(p: Product) {
  return [
    p.name, p.cat, p.fabric, p.fit, p.occasion, p.colour ?? "",
    p.description ?? "", p.line, p.gender, p.category,
    ...(p.colourVariants ?? []).map(c => c.name),
  ].join(" ").toLowerCase();
}

function matchesQuery(p: Product, tokens: string[]) {
  if (tokens.length === 0) return true;
  const hs = haystack(p);
  return tokens.every(t => hs.includes(t));
}

function matchesCat(p: Product, cat: CatChip) {
  switch (cat) {
    case "all":     return true;
    case "men":     return p.gender === "men";
    case "women":   return p.gender === "women";
    case "fabrics": return p.kind === "fabric";
    case "festive": return p.occasion === "Festive" || p.category === "festive";
  }
}

export default function SearchOverlay({ open, onClose }: Props) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<CatChip>("all");
  const [fabFilter, setFabFilter] = useState<Set<FabricChip>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useModalA11y(open, onClose);

  // Prefer focusing the search input specifically.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  // Reset on close
  useEffect(() => {
    if (open) return;
    setQ("");
  }, [open]);

  const tokens = useMemo(
    () => q.trim().toLowerCase().split(/\s+/).filter(Boolean),
    [q]
  );

  const results = useMemo(() => {
    return PRODUCTS.filter(p => {
      if (!matchesQuery(p, tokens)) return false;
      if (!matchesCat(p, cat)) return false;
      if (fabFilter.size > 0 && !fabFilter.has(p.fabric as FabricChip)) return false;
      return true;
    }).slice(0, 24);
  }, [tokens, cat, fabFilter]);

  const toggleFab = (f: FabricChip) => {
    setFabFilter(prev => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f); else next.add(f);
      return next;
    });
  };

  const clearAll = () => { setQ(""); setCat("all"); setFabFilter(new Set()); };

  return (
    <>
      <div ref={overlayRef} className="search-overlay" data-open={open} inert={!open} role="dialog" aria-modal="true" aria-label="Search" tabIndex={-1}>
        <div className="search-inner">
          <header className="search-head">
            <div className="search-bar">
              <svg viewBox="0 0 512 512" width="22" height="22" fill="currentColor" aria-hidden="true">
                <path d="M508.5 481.6l-129-129c-2.3-2.3-5.3-3.5-8.5-3.5h-10.3C395 312 416 262.5 416 208 416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c54.5 0 104-21 141.1-55.2V371c0 3.2 1.3 6.2 3.5 8.5l129 129c4.7 4.7 12.3 4.7 17 0l9.9-9.9c4.7-4.7 4.7-12.3 0-17zM208 384c-97.3 0-176-78.7-176-176S110.7 32 208 32s176 78.7 176 176-78.7 176-176 176z"/>
              </svg>
              <input
                ref={inputRef}
                type="search"
                placeholder="Search suits, sherwanis, fabric, colour, occasion…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                autoComplete="off"
                aria-label="Search query"
              />
              {q && (
                <button className="search-x" type="button" onClick={() => setQ("")} aria-label="Clear query">×</button>
              )}
              <button className="search-close" type="button" onClick={onClose} aria-label="Close search">Close <span aria-hidden="true">⌫</span></button>
            </div>

            <div className="search-chips">
              <div className="chip-group" role="radiogroup" aria-label="Category">
                {CAT_CHIPS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    role="radio"
                    aria-checked={cat === c.value}
                    className={`chip${cat === c.value ? " on" : ""}`}
                    onClick={() => setCat(c.value)}
                  >{c.label}</button>
                ))}
              </div>
              <div className="chip-group" role="group" aria-label="Fabric">
                {FABRIC_CHIPS.map(f => (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={fabFilter.has(f)}
                    className={`chip chip-secondary${fabFilter.has(f) ? " on" : ""}`}
                    onClick={() => toggleFab(f)}
                  >{f}</button>
                ))}
              </div>
              {(q || cat !== "all" || fabFilter.size > 0) && (
                <button className="chip-clear" type="button" onClick={clearAll}>Clear</button>
              )}
            </div>
          </header>

          <div className="search-results" aria-live="polite">
            <div className="search-results-head t-mono-xs">
              {tokens.length === 0 && cat === "all" && fabFilter.size === 0
                ? `Browse · ${PRODUCTS.length} pieces in the catalogue`
                : `${results.length} result${results.length === 1 ? "" : "s"}`}
            </div>

            {results.length === 0 ? (
              <div className="search-empty">
                <p>No matches. Try broader terms — or browse the full collection.</p>
                <Link className="btn btn-secondary" href="/collection?c=men" onClick={onClose}>Browse menswear</Link>
              </div>
            ) : (
              <div className="search-grid">
                {results.map(p => {
                  const isFab = p.kind === "fabric";
                  const src = isFab && p.colour
                    ? imgFabric(p.slug, p.colour, "front")
                    : `/generated/${p.slug}/01-front.webp`;
                  return (
                    <Link key={p.slug} className="search-card" href={`/products/${p.slug}`} onClick={onClose}>
                      <div className="search-card-img" style={isFab && p.colourHex ? { backgroundColor: p.colourHex } : undefined}>
                        <Image src={src} alt={p.name} fill sizes="(max-width: 720px) 50vw, 220px" loading="lazy" />
                        <WishlistButton slug={p.slug} name={p.name} />
                      </div>
                      <div className="search-card-meta">
                        <span className="search-card-cat t-mono-xs">{p.cat}</span>
                        <h4 className="search-card-name">{p.name}</h4>
                        <div className="search-card-row">
                          <span className="search-card-price">{fmtINR(p.salePrice ?? p.price)}{isFab ? " / m" : ""}</span>
                          {isFab
                            ? <span className="search-card-tag">{p.colour}</span>
                            : <span className="search-card-tag">{p.fabric} · {p.fit}</span>}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .search-overlay { position:fixed; inset:0; z-index:200; background:var(--paper); opacity:0; pointer-events:none; transition:opacity 250ms var(--ease); overflow-y:auto; }
        .search-overlay[data-open="true"] { opacity:1; pointer-events:auto; }
        .search-inner { max-width:var(--container); margin:0 auto; padding:var(--s-5) var(--pad-x-d) var(--s-9); }
        .search-head { position:sticky; top:0; padding-top:var(--s-3); padding-bottom:var(--s-4); background:var(--paper); border-bottom:var(--rule); margin-bottom:var(--s-5); z-index:1; }
        .search-bar { display:flex; align-items:center; gap:var(--s-3); padding:var(--s-3) 0; border-bottom:1px solid var(--ink); }
        .search-bar svg { color:var(--ink-3); flex:0 0 auto; }
        .search-bar input { flex:1; min-width:0; border:0; background:transparent; outline:none; font-family:var(--font-display); font-weight:500; font-size:clamp(20px, 3vw, 30px); letter-spacing:-.005em; color:var(--ink); padding:6px 0; }
        .search-bar input::placeholder { color:var(--ink-4); }
        .search-bar input::-webkit-search-cancel-button { display:none; }
        .search-x { background:transparent; border:0; color:var(--ink-3); font-size:24px; cursor:pointer; padding:0 6px; line-height:1; }
        .search-x:hover { color:var(--ink); }
        .search-close { background:transparent; border:1px solid var(--paper-3); color:var(--ink-2); font-family:var(--font-mono); font-weight:500; font-size:11px; letter-spacing:.16em; text-transform:uppercase; padding:8px 14px; cursor:pointer; transition:all var(--d-fast) var(--ease); }
        .search-close:hover { border-color:var(--ink); color:var(--ink); }

        .search-chips { display:flex; flex-wrap:wrap; gap:var(--s-3) var(--s-4); align-items:center; padding-top:var(--s-3); }
        .chip-group { display:flex; flex-wrap:wrap; gap:6px; }
        .chip { background:transparent; border:1px solid var(--paper-3); color:var(--ink-2); padding:8px 14px; font-family:var(--font-mono); font-size:11px; letter-spacing:.06em; cursor:pointer; transition:all var(--d-fast) var(--ease); }
        .chip:hover { border-color:var(--ink); color:var(--ink); }
        .chip.on { background:var(--ink); color:var(--paper); border-color:var(--ink); }
        .chip-secondary.on { background:var(--accent); border-color:var(--accent); color:var(--paper); }
        .chip-clear { background:transparent; border:0; color:var(--ink-3); font-size:13px; text-decoration:underline; text-underline-offset:3px; cursor:pointer; padding:4px 8px; }
        .chip-clear:hover { color:var(--accent); }

        .search-results-head { color:var(--ink-3); margin-bottom:var(--s-4); }
        .search-empty { padding:var(--s-7) 0; text-align:center; color:var(--ink-2); }
        .search-empty p { margin:0 0 var(--s-4); }

        .search-grid { display:grid; grid-template-columns:repeat(4, 1fr); gap:var(--s-5); }
        @media (max-width:1024px) { .search-grid { grid-template-columns:repeat(3, 1fr); } }
        @media (max-width:720px)  { .search-grid { grid-template-columns:repeat(2, 1fr); gap:var(--s-3); } }
        @media (max-width:380px)  { .search-grid { grid-template-columns:1fr; } }

        .search-card { display:flex; flex-direction:column; gap:8px; cursor:pointer; color:inherit; text-decoration:none; }
        .search-card-img { aspect-ratio:3/4; position:relative; overflow:hidden; background:var(--paper-2); transition:box-shadow 500ms var(--ease); }
        .search-card-img img { object-fit:cover; transition:transform 500ms var(--ease); }
        .search-card:hover .search-card-img { box-shadow:0 14px 32px -22px rgba(26,22,19,.4); }
        .search-card:hover .search-card-img img { transform:scale(1.04); }
        .search-card-meta { padding:0; display:flex; flex-direction:column; gap:4px; }
        .search-card-cat { color:var(--ink-3); }
        .search-card-name { margin:0; font-family:var(--font-display); font-weight:500; font-size:16px; letter-spacing:-.005em; color:var(--ink); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .search-card-row { display:flex; justify-content:space-between; align-items:baseline; gap:8px; }
        .search-card-price { font-family:var(--font-mono); font-weight:500; font-size:13px; color:var(--ink); }
        .search-card-tag { color:var(--ink-3); font-size:11px; }
      `}} />
    </>
  );
}
