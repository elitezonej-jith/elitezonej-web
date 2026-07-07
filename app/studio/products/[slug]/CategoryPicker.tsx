"use client";
import { useState, useEffect, useRef } from "react";

type Cat = { id: number; name: string; slug: string; parent_id: number | null };

export type CategoryDerived = { category: string; sub: string; cat_link: string; cat: string };

export default function CategoryPicker({
  categories,
  initialCategory,
  initialSub,
  onCategoryChange,
}: {
  categories: Cat[];
  initialCategory?: string;
  initialSub?: string;
  onCategoryChange?: (derived: CategoryDerived) => void;
}) {
  const tops = categories.filter(c => c.parent_id === null);

  // Resolve initial selection from existing product data
  function resolveInitial(): number[] {
    if (!initialCategory && !initialSub) return [];
    // Try to match sub first (most specific)
    if (initialSub) {
      const sub = categories.find(c => c.slug === initialSub || c.name.toLowerCase() === initialSub.toLowerCase());
      if (sub) return buildPath(sub.id);
    }
    // Try category
    if (initialCategory) {
      const cat = categories.find(c => c.slug === initialCategory.toLowerCase() || c.name.toLowerCase() === initialCategory.toLowerCase());
      if (cat) return buildPath(cat.id);
    }
    return [];
  }

  function buildPath(id: number): number[] {
    const path: number[] = [];
    let cur: number | null = id;
    while (cur !== null) {
      path.unshift(cur);
      const node = categories.find(c => c.id === cur);
      cur = node?.parent_id ?? null;
    }
    return path;
  }

  const [path, setPath] = useState<number[]>(resolveInitial);
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState(0);

  const selectedCat = path.length > 0 ? categories.find(c => c.id === path[path.length - 1]) : null;
  const unmatched = (initialCategory || initialSub) && path.length === 0;

  // Derive values for form submission
  function deriveValues() {
    if (path.length === 0) return { category: initialCategory || "", sub: initialSub || "", cat_link: "", cat: "" };
    const topNode = categories.find(c => c.id === path[0]);
    const catLink = topNode?.name || "";
    const names = path.map(id => categories.find(c => c.id === id)?.name || "");
    const catDisplay = names.slice(1).join(" · ") || names[0] || "";

    // The storefront URL model is: /collection?c=<gender>&sub=<subcollection>
    // Products have: gender (men/women/unisex), category (product type), sub (subcollection slug)
    //
    // Tree structure vs product fields:
    //   1-level: [Women]           → category = "", sub = "" (just gender)
    //   2-level: [Women > Office Wear] → category = "", sub = "office-wear"
    //   3-level: [Women > Skirts > A-line] → category = "skirts", sub = "a-line-skirts"
    //
    // The top-level gender nodes (Women/Men) map to the gender field (handled
    // separately via onCategoryChange). The child node is always the `sub`.

    const isGenderTop = ["women", "men"].includes(topNode?.slug?.toLowerCase() || topNode?.name?.toLowerCase() || "");

    let category = "";
    let sub = "";

    if (path.length === 1) {
      // Just a top-level selected (e.g. "Women" or "Accessories")
      if (!isGenderTop) {
        category = topNode?.slug || "";
      }
    } else if (path.length === 2) {
      if (isGenderTop) {
        // Women > Office Wear → sub = "office-wear"
        const childNode = categories.find(c => c.id === path[1]);
        sub = childNode?.slug || childNode?.name.toLowerCase() || "";
      } else {
        // Accessories > Brooches → category = "accessories", sub = "brooches"
        category = topNode?.slug || "";
        const childNode = categories.find(c => c.id === path[1]);
        sub = childNode?.slug || childNode?.name.toLowerCase() || "";
      }
    } else if (path.length >= 3) {
      if (isGenderTop) {
        // Women > Skirts > A-line → category = "skirts", sub = "a-line-skirts"
        const midNode = categories.find(c => c.id === path[1]);
        category = midNode?.slug || midNode?.name.toLowerCase() || "";
        const leafNode = categories.find(c => c.id === path[path.length - 1]);
        sub = leafNode?.slug || "";
      } else {
        // Accessories > Type > Subtype → category = "type", sub = "subtype"
        const midNode = categories.find(c => c.id === path[1]);
        category = midNode?.slug || midNode?.name.toLowerCase() || "";
        const leafNode = categories.find(c => c.id === path[path.length - 1]);
        sub = leafNode?.slug || "";
      }
    }

    return { category, sub, cat_link: catLink, cat: catDisplay };
  }

  const derived = deriveValues();

  // Notify parent when the category path changes (skip the initial mount to
  // avoid overriding the existing gender on first render of an edit form).
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    onCategoryChange?.(derived);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path.join(",")]);

  // Get children of a given parent
  function childrenOf(parentId: number | null) {
    return categories.filter(c => c.parent_id === parentId);
  }

  // Current level's parent
  const navParent = level === 0 ? null : (path[level - 1] ?? null);
  const currentItems = childrenOf(navParent);

  function select(cat: Cat) {
    const children = childrenOf(cat.id);
    const newPath = [...path.slice(0, level), cat.id];
    setPath(newPath);
    if (children.length > 0) {
      setLevel(level + 1);
    } else {
      setOpen(false);
      setLevel(0);
    }
  }

  function selectAtLevel(cat: Cat) {
    // Select this as final (don't drill deeper)
    const newPath = [...path.slice(0, level), cat.id];
    setPath(newPath);
    setOpen(false);
    setLevel(0);
  }

  function goBack() {
    if (level > 0) {
      setLevel(level - 1);
      setPath(path.slice(0, level));
    }
  }

  function clear() {
    setPath([]);
    setOpen(false);
    setLevel(0);
  }

  function openPicker() {
    setOpen(true);
    setLevel(0);
  }

  // Breadcrumb for current nav position
  const navBreadcrumb = path.slice(0, level).map(id => categories.find(c => c.id === id)?.name || "");

  return (
    <div className="cat-picker">
      {/* Hidden inputs for form submission */}
      <input type="hidden" name="category" value={derived.category} />
      <input type="hidden" name="sub" value={derived.sub} />
      <input type="hidden" name="cat_link" value={derived.cat_link} />
      <input type="hidden" name="cat" value={derived.cat} />

      <span className="stu-field__label">Category</span>

      {!open && (
        <div className="cat-picker__display">
          {path.length > 0 ? (
            <div className="cat-picker__path">
              {path.map((id, i) => {
                const node = categories.find(c => c.id === id);
                return (
                  <span key={id}>
                    {i > 0 && <span className="cat-picker__sep">›</span>}
                    <span className="cat-picker__crumb">{node?.name}</span>
                  </span>
                );
              })}
              <button type="button" className="cat-picker__change" onClick={openPicker}>Change</button>
              <button type="button" className="cat-picker__clear" onClick={clear}>✕</button>
            </div>
          ) : (
            <div>
              {unmatched && (
                <div className="cat-picker__unmatched">
                  Current: <em>{initialSub || initialCategory}</em> (not in category tree)
                </div>
              )}
              <button type="button" className="stu-btn stu-btn--ghost stu-btn--sm" onClick={openPicker}>
                {unmatched ? "Reassign category" : "Pick a category"}
              </button>
            </div>
          )}
        </div>
      )}

      {open && (
        <div className="cat-picker__dropdown">
          {level > 0 && (
            <button type="button" className="cat-picker__back" onClick={goBack}>
              ← {navBreadcrumb.length > 0 ? navBreadcrumb[navBreadcrumb.length - 1] : "Back"}
            </button>
          )}
          {level > 0 && (
            <button type="button" className="cat-picker__item cat-picker__item--select" onClick={() => {
              // Select parent without going deeper
              setOpen(false);
              setLevel(0);
            }}>
              ✓ Select "{categories.find(c => c.id === path[level - 1])?.name}"
            </button>
          )}
          {currentItems.map(cat => {
            const hasChildren = childrenOf(cat.id).length > 0;
            return (
              <div key={cat.id} className="cat-picker__item">
                <button type="button" className="cat-picker__item-btn" onClick={() => select(cat)}>
                  {cat.name}
                  {hasChildren && <span className="cat-picker__arrow">›</span>}
                </button>
                {hasChildren && (
                  <button type="button" className="cat-picker__item-select" onClick={() => selectAtLevel(cat)} title="Select this level">
                    ✓
                  </button>
                )}
              </div>
            );
          })}
          <button type="button" className="cat-picker__cancel" onClick={() => { setOpen(false); setLevel(0); }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
