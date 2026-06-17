"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useModalA11y } from "./useModalA11y";

type Props = { open: boolean; onClose: () => void; products?: unknown[] };

export default function SearchOverlay({ open, onClose }: Props) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useModalA11y(open, onClose);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = q.trim();
    if (trimmed) {
      onClose();
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <>
      <div ref={overlayRef} className="search-overlay" data-open={open} inert={!open} role="dialog" aria-modal="true" aria-label="Search" tabIndex={-1}>
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
            <button className="search-close" type="button" onClick={onClose} aria-label="Close search">Close <span aria-hidden="true">⌫</span></button>
          </form>
          <button type="submit" className="search-submit t-mono-xs">Search</button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .search-overlay { position:fixed; inset:0; z-index:200; background:var(--paper); opacity:0; pointer-events:none; transition:opacity 250ms var(--ease); display:flex; align-items:flex-start; justify-content:center; padding-top:20vh; }
        .search-overlay[data-open="true"] { opacity:1; pointer-events:auto; }
        .search-inner { width:100%; max-width:600px; padding:0 var(--pad-x-d); }
        .search-bar { display:flex; align-items:center; gap:var(--s-3); padding:var(--s-3) 0; border-bottom:2px solid var(--ink); }
        .search-bar svg { color:var(--ink-3); flex:0 0 auto; }
        .search-bar input { flex:1; min-width:0; border:0; background:transparent; outline:none; font-family:var(--font-display); font-weight:500; font-size:clamp(20px, 3vw, 28px); letter-spacing:-.005em; color:var(--ink); padding:6px 0; }
        .search-bar input::placeholder { color:var(--ink-4); }
        .search-bar input::-webkit-search-cancel-button { display:none; }
        .search-x { background:transparent; border:0; color:var(--ink-3); font-size:24px; cursor:pointer; padding:0 6px; line-height:1; }
        .search-x:hover { color:var(--ink); }
        .search-close { background:transparent; border:1px solid var(--paper-3); color:var(--ink-2); font-family:var(--font-mono); font-weight:500; font-size:11px; letter-spacing:.16em; text-transform:uppercase; padding:8px 14px; cursor:pointer; transition:all var(--d-fast) var(--ease); }
        .search-close:hover { border-color:var(--ink); color:var(--ink); }
        .search-submit { display:block; width:100%; margin-top:var(--s-4); padding:14px 0; background:var(--ink); color:var(--paper); border:none; font-family:var(--font-mono); font-size:12px; font-weight:500; letter-spacing:.12em; text-transform:uppercase; cursor:pointer; transition:opacity 180ms; }
        .search-submit:hover { opacity:0.85; }
        @media (max-width:720px) { .search-inner { padding:0 var(--pad-x-m); } .search-overlay { padding-top:12vh; } }
      `}} />
    </>
  );
}
