"use client";
import { useState, useRef, useEffect } from "react";

type Product = {
  slug: string;
  name: string;
  price: number;
  sale_price: number | null;
  kind: string;
  sizes_json: string;
};

type Props = {
  products: Product[];
  onSelect: (product: Product) => void;
};

export default function ProductSearch({ products, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? products.filter(p => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];

  useEffect(() => { setFocused(0); }, [query]);

  function handleSelect(product: Product) {
    onSelect(product);
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || filtered.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocused(f => Math.min(f + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocused(f => Math.max(f - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[focused]) handleSelect(filtered[focused]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="pos-search">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => { if (query) setOpen(true); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={handleKeyDown}
        className="stu-input pos-search__input"
        placeholder="Search products to add…"
        autoComplete="off"
        aria-label="Search products"
        aria-expanded={open && filtered.length > 0}
        role="combobox"
      />
      {open && filtered.length > 0 && (
        <div ref={listRef} className="pos-search__dropdown" role="listbox">
          {filtered.map((p, i) => (
            <button
              key={p.slug}
              type="button"
              className={`pos-search__item ${i === focused ? "pos-search__item--focused" : ""}`}
              onClick={() => handleSelect(p)}
              role="option"
              aria-selected={i === focused}
            >
              <span className="pos-search__item-name">{p.name}</span>
              <span className="pos-search__item-price">₹{(p.sale_price ?? p.price).toLocaleString()}</span>
              <span className="pos-search__item-kind">{p.kind === "fabric" ? "Fabric" : "Clothing"}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
