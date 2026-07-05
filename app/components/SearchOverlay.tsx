"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import { useModalA11y } from "./useModalA11y";
import { scoreProduct, tokenize } from "@/lib/search";
import { fmtINR } from "@/lib/format";
import type { SearchIndexItem } from "@/lib/storefront/products";

const STORAGE_KEY = "ezj-search-q";
const MAX_RESULTS = 6;
const DEBOUNCE_MS = 200;

type Props = {
  open: boolean;
  onClose: () => void;
  searchIndex: SearchIndexItem[];
};

export default function SearchOverlay({ open, onClose, searchIndex }: Props) {
  const [q, setQ] = useState("");
  const [mounted, setMounted] = useState(false);
  const [results, setResults] = useState<SearchIndexItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLUListElement>(null);
  const overlayRef = useModalA11y(open, onClose);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => { setMounted(true); }, []);

  // Restore persisted query on open
  useEffect(() => {
    if (!open) return;
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) setQ(saved);
    } catch {}
  }, [open]);

  // Focus input with delay to avoid inert/React timing race
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 100);
    return () => clearTimeout(t);
  }, [open]);

  // Persist query on change
  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, q); } catch {}
  }, [q]);

  // Debounced live search scoring
  useEffect(() => {
    const t = setTimeout(() => {
      const tokens = tokenize(q);
      if (tokens.length === 0) {
        setResults([]);
        return;
      }
      const scored = searchIndex
        .map((item) => ({
          item,
          score: scoreProduct(
            {
              name: item.name,
              cat: item.cat,
              category: item.category,
              gender: item.gender,
              fit: item.fit,
              fabric: item.fabric,
              occasion: item.occasion,
              line: item.line,
              colour: item.colour,
              description: item.description,
            },
            tokens,
          ),
        }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_RESULTS);
      setResults(scored.map((x) => x.item));
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [q, searchIndex]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex < 0) return;
    const list = resultsRef.current;
    if (!list) return;
    const item = list.children[activeIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const navigateTo = (slug: string) => {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
    onClose();
    router.push(`/products/${slug}`);
  };

  const handleSubmit = (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    const trimmed = q.trim();
    if (trimmed) {
      try { sessionStorage.setItem(`ezj-scroll-${pathname}`, String(window.scrollY)); } catch {}
      try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
      onClose();
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      navigateTo(results[activeIndex].slug);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!mounted) return null;

  const hasTokens = tokenize(q).length > 0;
  const showResults = hasTokens && results.length > 0;
  const showEmpty = hasTokens && results.length === 0;

  return createPortal(
    <>
      <div
        ref={overlayRef}
        className="search-overlay"
        data-open={open}
        aria-hidden={!open}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        tabIndex={-1}
      >
        <div className="search-inner">
          <form className="search-bar" onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
            <svg viewBox="0 0 512 512" width="22" height="22" fill="currentColor" aria-hidden="true">
              <path d="M508.5 481.6l-129-129c-2.3-2.3-5.3-3.5-8.5-3.5h-10.3C395 312 416 262.5 416 208 416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c54.5 0 104-21 141.1-55.2V371c0 3.2 1.3 6.2 3.5 8.5l129 129c4.7 4.7 12.3 4.7 17 0l9.9-9.9c4.7-4.7 4.7-12.3 0-17zM208 384c-97.3 0-176-78.7-176-176S110.7 32 208 32s176 78.7 176 176-78.7 176-176 176z"/>
            </svg>
            <input
              ref={inputRef}
              type="search"
              placeholder="Search products…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoComplete="off"
              aria-label="Search query"
              aria-expanded={showResults}
              aria-controls="search-results-list"
              aria-activedescendant={activeIndex >= 0 ? `sr-${results[activeIndex]?.slug}` : undefined}
            />
            {q && (
              <button className="search-x" type="button" onClick={() => setQ("")} aria-label="Clear query">×</button>
            )}
            <button className="search-close" type="button" onClick={handleClose} aria-label="Close search">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </form>

          {/* Live search results */}
          {showResults && (
            <>
              <ul
                ref={resultsRef}
                id="search-results-list"
                className="search-results"
                role="listbox"
                aria-label={`${results.length} suggestion${results.length !== 1 ? "s" : ""}`}
              >
                {results.map((item, i) => (
                  <li
                    key={item.slug}
                    id={`sr-${item.slug}`}
                    className="search-result-item"
                    role="option"
                    aria-selected={i === activeIndex}
                    data-active={i === activeIndex || undefined}
                    onClick={() => navigateTo(item.slug)}
                  >
                    <img
                      src={item.thumbnail ?? `/generated/${item.slug}/01-front.webp`}
                      alt=""
                      width={48}
                      height={48}
                      loading="lazy"
                    />
                    <span className="sr-name">{item.name}</span>
                    <span className="sr-price">
                      {item.salePrice ? (
                        <>
                          <del>{fmtINR(item.price)}</del>
                          {fmtINR(item.salePrice)}
                        </>
                      ) : (
                        fmtINR(item.price)
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              <a
                href={`/search?q=${encodeURIComponent(q.trim())}`}
                className="search-view-all"
                onClick={(e) => { e.preventDefault(); handleSubmit(); }}
              >
                View all results →
              </a>
            </>
          )}

          {showEmpty && (
            <p className="search-empty">No results for &ldquo;{q.trim()}&rdquo;</p>
          )}

          {!showResults && !showEmpty && (
            <button type="button" className="search-submit t-mono-xs" onClick={handleSubmit}>Search</button>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .search-overlay { position:fixed; inset:0; z-index:10001; isolation:isolate; background:var(--paper); opacity:0; pointer-events:none; transition:opacity 250ms var(--ease); display:flex; align-items:flex-start; justify-content:center; padding-top:15vh; }
        .search-overlay[data-open="true"] { opacity:1; pointer-events:auto; }
        .search-inner { width:100%; max-width:600px; padding:0 var(--pad-x-d); }
        .search-bar { display:flex; align-items:center; gap:var(--s-3); padding:var(--s-3) 0; border-bottom:2px solid var(--ink); }
        .search-bar svg { color:var(--ink-3); flex:0 0 auto; }
        .search-bar input { flex:1; min-width:0; border:0; background:transparent; outline:none; font-family:var(--font-display); font-weight:500; font-size:clamp(20px, 3vw, 28px); letter-spacing:-.005em; color:var(--ink); padding:6px 0; }
        .search-bar input::placeholder { color:var(--ink-4); }
        .search-bar input::-webkit-search-cancel-button { display:none; }
        .search-x { background:transparent; border:0; color:var(--ink-3); font-size:24px; cursor:pointer; padding:0 6px; line-height:1; }
        .search-x:hover { color:var(--ink); }
        .search-close { background:transparent; border:0; color:var(--ink-3); cursor:pointer; padding:6px; border-radius:50%; transition:all var(--d-fast) var(--ease); display:flex; align-items:center; justify-content:center; }
        .search-close:hover { color:var(--ink); background:var(--paper-2); }
        .search-submit { display:block; width:100%; margin-top:var(--s-4); padding:14px 0; background:var(--ink); color:var(--paper); border:none; font-family:var(--font-mono); font-size:12px; font-weight:500; letter-spacing:.12em; text-transform:uppercase; cursor:pointer; transition:opacity 180ms; }
        .search-submit:hover { opacity:0.85; }
        .search-results { list-style:none; padding:0; margin:var(--s-4) 0 0; max-height:360px; overflow-y:auto; }
        .search-result-item { display:flex; align-items:center; gap:var(--s-3); padding:var(--s-2) var(--s-2); border-bottom:1px solid var(--ink-5, #eee); cursor:pointer; transition:background 150ms; border-radius:4px; }
        .search-result-item:hover, .search-result-item[data-active] { background:var(--paper-2, #f8f8f8); }
        .search-result-item img { width:48px; height:48px; object-fit:cover; border-radius:2px; flex:0 0 auto; }
        .search-result-item .sr-name { flex:1; font-family:var(--font-body); font-size:14px; font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .search-result-item .sr-price { font-family:var(--font-mono); font-size:12px; white-space:nowrap; }
        .search-result-item .sr-price del { color:var(--ink-4); margin-right:4px; }
        .search-view-all { display:block; text-align:center; padding:var(--s-3) 0; font-family:var(--font-mono); font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:var(--ink-3); text-decoration:none; transition:color 150ms; }
        .search-view-all:hover { color:var(--ink); }
        .search-empty { padding:var(--s-4) 0; text-align:center; color:var(--ink-3); font-size:14px; }
        @media (max-width:720px) {
          .search-overlay { padding-top:10vh; }
          .search-inner { padding:0 var(--pad-x-m); }
          .search-results { max-height:280px; }
        }
      `}} />
    </>,
    document.body
  );
}
