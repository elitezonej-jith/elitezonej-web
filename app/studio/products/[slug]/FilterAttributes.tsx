"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type Cat = { id: number; name: string; slug: string; parent_id: number | null };

type FilterOption = {
  id: number;
  value: string;
  label: string | null;
  color_hex: string | null;
};

type Filter = {
  id: number;
  name: string;
  field_key: string;
  filter_type: string;
  sort_order: number;
  options: FilterOption[];
};

type TagEntry = { filter_id: number; option_id: number };

export default function FilterAttributes({
  categories,
  initialCategory,
  initialSub,
  productSlug,
}: {
  categories: Cat[];
  initialCategory?: string;
  initialSub?: string;
  productSlug?: string;
}) {
  const [filters, setFilters] = useState<Filter[]>([]);
  const [selectedTags, setSelectedTags] = useState<TagEntry[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(() => resolveCategoryId(categories, initialSub, initialCategory));
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Resolve a category ID from the categories array by matching slug or name
  function resolveCategoryId(cats: Cat[], sub?: string, category?: string): number | null {
    if (sub) {
      const match = cats.find(c => c.slug === sub || c.name.toLowerCase() === sub.toLowerCase());
      if (match) return match.id;
    }
    if (category) {
      const match = cats.find(c => c.slug === category || c.name.toLowerCase() === category.toLowerCase());
      if (match) return match.id;
    }
    return null;
  }

  // Fetch filters and tags from the API
  const fetchFilters = useCallback(async (catId: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ id: String(catId) });
      if (productSlug) params.set("slug", productSlug);
      const res = await fetch(`/api/studio/category-filters?${params.toString()}`);
      if (!res.ok) {
        setFilters([]);
        setSelectedTags([]);
        return;
      }
      const data: { filters: Filter[]; tags: TagEntry[] } = await res.json();
      setFilters(data.filters);
      setSelectedTags(data.tags);
    } catch {
      setFilters([]);
      setSelectedTags([]);
    } finally {
      setLoading(false);
    }
  }, [productSlug]);

  // Initial fetch
  useEffect(() => {
    if (categoryId) fetchFilters(categoryId);
  }, [categoryId, fetchFilters]);

  // Watch for category changes via MutationObserver on the hidden `category` and `sub` inputs
  useEffect(() => {
    const form = containerRef.current?.closest("form");
    if (!form) return;

    const catInput = form.querySelector<HTMLInputElement>('input[name="category"]');
    const subInput = form.querySelector<HTMLInputElement>('input[name="sub"]');
    if (!catInput && !subInput) return;

    const observer = new MutationObserver(() => {
      const subVal = subInput?.value || "";
      const catVal = catInput?.value || "";
      const newId = resolveCategoryId(categories, subVal, catVal);
      setCategoryId(prev => {
        if (prev !== newId) return newId;
        return prev;
      });
    });

    if (catInput) observer.observe(catInput, { attributes: true, attributeFilter: ["value"] });
    if (subInput) observer.observe(subInput, { attributes: true, attributeFilter: ["value"] });

    // Also listen for value property changes via polling (React sets value via property, not attribute)
    let lastCat = catInput?.value || "";
    let lastSub = subInput?.value || "";
    const interval = setInterval(() => {
      const curCat = catInput?.value || "";
      const curSub = subInput?.value || "";
      if (curCat !== lastCat || curSub !== lastSub) {
        lastCat = curCat;
        lastSub = curSub;
        const newId = resolveCategoryId(categories, curSub, curCat);
        setCategoryId(prev => (prev !== newId ? newId : prev));
      }
    }, 500);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, [categories]);

  // Toggle a tag selection
  function toggle(filterId: number, optionId: number) {
    setSelectedTags(prev => {
      const exists = prev.some(t => t.filter_id === filterId && t.option_id === optionId);
      if (exists) return prev.filter(t => !(t.filter_id === filterId && t.option_id === optionId));
      return [...prev, { filter_id: filterId, option_id: optionId }];
    });
  }

  function isSelected(filterId: number, optionId: number): boolean {
    return selectedTags.some(t => t.filter_id === filterId && t.option_id === optionId);
  }

  // Legacy compat: first selected value for a given field_key
  function firstValueFor(fieldKey: string): string {
    const filter = filters.find(f => f.field_key === fieldKey);
    if (!filter) return "";
    for (const tag of selectedTags) {
      if (tag.filter_id === filter.id) {
        const opt = filter.options.find(o => o.id === tag.option_id);
        if (opt) return opt.value;
      }
    }
    return "";
  }

  return (
    <section className="stu-card" ref={containerRef}>
      <header className="stu-card__head"><h3>Filter tags</h3></header>
      <div className="stu-card__body">
        <p className="stu-hint">Select which filter values apply. Customers find this product when filtering by these.</p>

        {loading && <p className="fa-loading">Loading filters…</p>}

        {!loading && !categoryId && (
          <p className="fa-empty">Pick a category to see available filters.</p>
        )}

        {!loading && categoryId && filters.length === 0 && (
          <p className="fa-empty">No filters configured for this category.</p>
        )}

        {!loading && filters.map(filter => (
          <div key={filter.id} className="fa-group">
            <h4 className="fa-group__title">{filter.name}</h4>
            <div className={`fa-chips ${filter.filter_type === "size" ? "fa-chips--pills" : ""}`}>
              {filter.options.map(opt => {
                const checked = isSelected(filter.id, opt.id);
                return (
                  <label
                    key={opt.id}
                    className={`fa-chip ${checked ? "fa-chip--on" : ""} ${filter.filter_type === "color" ? "fa-chip--color" : ""} ${filter.filter_type === "size" ? "fa-chip--size" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(filter.id, opt.id)}
                      className="fa-chip__input"
                    />
                    {filter.filter_type === "color" && opt.color_hex && (
                      <span
                        className="fa-chip__swatch"
                        style={{ background: opt.color_hex }}
                      >
                        {checked && <span className="fa-chip__check">✓</span>}
                      </span>
                    )}
                    <span className="fa-chip__label">{opt.label || opt.value}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        {/* Serialized tag selections for form submission */}
        <input type="hidden" name="filter_tags_json" value={JSON.stringify(selectedTags)} />

        {/* Legacy compat hidden inputs */}
        <input type="hidden" name="fit" value={firstValueFor("fit")} />
        <input type="hidden" name="fabric" value={firstValueFor("fabric")} />
        <input type="hidden" name="occasion" value={firstValueFor("occasion")} />
      </div>
    </section>
  );
}
