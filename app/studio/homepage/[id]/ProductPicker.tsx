"use client";
import { useState, useRef, useEffect, useMemo } from "react";

export type PickerProduct = {
  slug: string;
  name: string;
  thumbnail: string | null;
  gender: string;
  category: string;
  isPremium: boolean;
};

export type PickerFilter = {
  gender?: string;
  category?: string;
  premium?: boolean;
};

type Props = {
  slugs: string[];
  onChange: (slugs: string[]) => void;
  products: PickerProduct[];
  limit: number;
  filter?: PickerFilter;
};

export default function ProductPicker({ slugs, onChange, products, limit, filter }: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  // Pre-filter products based on section context
  const contextProducts = useMemo(() => {
    if (showAll || !filter) return products;
    let filtered = products;
    if (filter.gender) filtered = filtered.filter((p) => p.gender === filter.gender);
    if (filter.category) filtered = filtered.filter((p) => p.category === filter.category);
    if (filter.premium) filtered = filtered.filter((p) => p.isPremium);
    // If filter produces nothing, show all (graceful fallback)
    return filtered.length > 0 ? filtered : products;
  }, [products, filter, showAll]);

  const hasActiveFilter = !!(filter?.gender || filter?.category || filter?.premium);
  const filterLabel = filter?.premium
    ? "premium"
    : filter?.category
      ? filter.category
      : filter?.gender
        ? `${filter.gender}'s`
        : "";

  const pickedSet = new Set(slugs);
  const available = contextProducts.filter(
    (p) => !pickedSet.has(p.slug) && p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const CAP = 50;

  const remove = (slug: string) => onChange(slugs.filter((s) => s !== slug));
  const add = (slug: string) => {
    if (slugs.length < limit) onChange([...slugs, slug]);
    setSearch("");
  };
  const moveUp = (i: number) => {
    if (i === 0) return;
    const next = [...slugs];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    onChange(next);
  };
  const moveDown = (i: number) => {
    if (i >= slugs.length - 1) return;
    const next = [...slugs];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    onChange(next);
  };

  const productMap = new Map(products.map((p) => [p.slug, p]));

  return (
    <div className="stu-picker">
      <div className="stu-picker__count">
        {slugs.length} of {limit} picked · remaining will auto-fill from filter
      </div>

      {slugs.length > 0 && (
        <ul className="stu-picker__list">
          {slugs.map((slug, i) => {
            const p = productMap.get(slug);
            return (
              <li key={slug} className="stu-picker__item">
                <span className="stu-picker__item__order">
                  <button type="button" className="stu-picker__arrow" disabled={i === 0} onClick={() => moveUp(i)} aria-label="Move up">↑</button>
                  <button type="button" className="stu-picker__arrow" disabled={i === slugs.length - 1} onClick={() => moveDown(i)} aria-label="Move down">↓</button>
                </span>
                {p?.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.thumbnail} alt="" className="stu-picker__thumb" />
                ) : (
                  <span className="stu-picker__thumb stu-picker__thumb--empty" />
                )}
                <span className="stu-picker__name">{p?.name ?? slug}</span>
                <button type="button" className="stu-picker__remove" onClick={() => remove(slug)} aria-label={`Remove ${p?.name ?? slug}`}>✕</button>
              </li>
            );
          })}
        </ul>
      )}

      {slugs.length < limit && (
        <div className="stu-picker__add-wrap" ref={dropdownRef}>
          <button type="button" className="stu-btn stu-btn--ghost stu-btn--sm" onClick={() => setDropdownOpen(!dropdownOpen)}>
            + Add product
          </button>
          {dropdownOpen && (
            <div className="stu-picker__dropdown">
              <input
                type="text"
                className="stu-input stu-picker__search"
                placeholder={hasActiveFilter && !showAll ? `Search ${filterLabel} products…` : "Search all products…"}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
              {hasActiveFilter && (
                <div className="stu-picker__filter-bar">
                  <span className="stu-picker__filter-label">
                    {showAll ? `All products (${available.length})` : `Showing ${filterLabel} products (${available.length})`}
                  </span>
                  <button type="button" className="stu-picker__filter-toggle" onClick={() => setShowAll(!showAll)}>
                    {showAll ? "Show only relevant" : "Show all"}
                  </button>
                </div>
              )}
              <ul className="stu-picker__dropdown-list">
                {available.length === 0 && (
                  <li className="stu-picker__dropdown-empty">No matching products</li>
                )}
                {available.slice(0, CAP).map((p) => (
                  <li key={p.slug}>
                    <button type="button" className="stu-picker__dropdown-item" onClick={() => { add(p.slug); setDropdownOpen(false); }}>
                      {p.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.thumbnail} alt="" className="stu-picker__thumb stu-picker__thumb--sm" />
                      ) : (
                        <span className="stu-picker__thumb stu-picker__thumb--sm stu-picker__thumb--empty" />
                      )}
                      <span>{p.name}</span>
                    </button>
                  </li>
                ))}
                {available.length > CAP && (
                  <li className="stu-picker__dropdown-empty">
                    Showing {CAP} of {available.length} — type to narrow
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
