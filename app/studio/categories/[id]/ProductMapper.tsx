"use client";
import { useState } from "react";
import { assignProductsToCategoryAction } from "../../actions/categories";

type Product = { slug: string; name: string; category: string | null; sub: string | null };

export default function ProductMapper({
  categoryId,
  categoryName,
  mapped,
  available,
}: {
  categoryId: number;
  categoryName: string;
  mapped: Product[];
  available: Product[];
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = available.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 20);

  function toggle(slug: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  }

  return (
    <section className="stu-card" style={{ marginTop: 24 }}>
      <header className="stu-card__head">
        <h3>Products in this category</h3>
        <span className="stu-card__count">{mapped.length} mapped</span>
      </header>
      <div className="stu-card__body">
        {/* Currently mapped */}
        {mapped.length > 0 ? (
          <div className="pm-mapped">
            {mapped.map(p => (
              <div key={p.slug} className="pm-mapped__item">
                <span className="pm-mapped__check">✓</span>
                <span className="pm-mapped__name">{p.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="pm-empty">No products assigned to {categoryName} yet.</p>
        )}

        {/* Add products */}
        <div className="pm-add">
          <h4 className="pm-add__title">Add products to {categoryName}</h4>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="stu-input"
            placeholder="Search products by name…"
            style={{ marginBottom: 12 }}
          />

          {filtered.length === 0 ? (
            <p className="pm-empty">No unassigned products match.</p>
          ) : (
            <form action={assignProductsToCategoryAction}>
              <input type="hidden" name="category_id" value={categoryId} />
              <input type="hidden" name="slugs" value={Array.from(selected).join(",")} />

              <div className="pm-list">
                {filtered.map(p => (
                  <label key={p.slug} className={`pm-list__item ${selected.has(p.slug) ? "pm-list__item--on" : ""}`}>
                    <input
                      type="checkbox"
                      checked={selected.has(p.slug)}
                      onChange={() => toggle(p.slug)}
                      className="pm-list__check"
                    />
                    <span className="pm-list__name">{p.name}</span>
                    <span className="pm-list__current">
                      {p.sub || p.category || "uncategorized"}
                    </span>
                  </label>
                ))}
              </div>

              {selected.size > 0 && (
                <button type="submit" className="stu-btn stu-btn--primary" style={{ marginTop: 14 }}>
                  Assign {selected.size} product{selected.size > 1 ? "s" : ""} to {categoryName}
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
