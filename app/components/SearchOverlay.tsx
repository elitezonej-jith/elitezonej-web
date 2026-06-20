"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import { useModalA11y } from "./useModalA11y";

const STORAGE_KEY = "ezj-search-q";

type Props = { open: boolean; onClose: () => void };

export default function SearchOverlay({ open, onClose }: Props) {
  const [q, setQ] = useState("");
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useModalA11y(open, onClose);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => { setMounted(true); }, []);

  // Task 6: Restore persisted query on open
  useEffect(() => {
    if (!open) return;
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) setQ(saved);
    } catch {}
  }, [open]);

  // Task 2: Focus input with delay to avoid inert/React timing race
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 100);
    return () => clearTimeout(t);
  }, [open]);

  // Task 6: Persist query on change
  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, q); } catch {}
  }, [q]);

  const handleSubmit = (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    const trimmed = q.trim();
    if (trimmed) {
      // Task 5: Save scroll position before navigating
      try { sessionStorage.setItem(`ezj-scroll-${pathname}`, String(window.scrollY)); } catch {}
      // Task 6: Clear persisted query on successful submit
      try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
      onClose();
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Task 2: removed inert — CSS pointer-events:none is sufficient when closed */}
      <div ref={overlayRef} className="search-overlay" data-open={open} aria-hidden={!open} role="dialog" aria-modal="true" aria-label="Search" tabIndex={-1}>
        <div className="search-inner">
          <form className="search-bar" onSubmit={handleSubmit}>
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
            />
            {q && (
              <button className="search-x" type="button" onClick={() => setQ("")} aria-label="Clear query">×</button>
            )}
            <button className="search-close" type="button" onClick={handleClose} aria-label="Close search">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </form>
          <button type="button" className="search-submit t-mono-xs" onClick={handleSubmit}>Search</button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .search-overlay { position:fixed; inset:0; z-index:10001; isolation:isolate; background:var(--paper); opacity:0; pointer-events:none; transition:opacity 250ms var(--ease); display:flex; align-items:center; justify-content:center; padding-bottom:10vh; }
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
        @media (max-width:720px) { .search-inner { padding:0 var(--pad-x-m); } }
      `}} />
    </>,
    document.body
  );
}
