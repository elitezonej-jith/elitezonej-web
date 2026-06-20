"use client";
import { useActionState, useState, useEffect } from "react";
import { saveFilterAction, removeFilterAction, saveOptionAction, removeOptionAction } from "../../actions/categories";
import type { FilterSaveState, OptionSaveState } from "../../actions/categories";

type FilterOption = { id: number; filter_id: number; value: string; label: string | null; color_hex: string | null; sort_order: number };
type CategoryFilter = { id: number; category_id: number; name: string; field_key: string; filter_type: string; sort_order: number; options: FilterOption[] };

const FIELD_KEYS = [
  { value: "fit", label: "Fit" },
  { value: "fabric", label: "Fabric" },
  { value: "occasion", label: "Occasion" },
  { value: "gender", label: "Gender" },
  { value: "kind", label: "Kind/Type" },
  { value: "category", label: "Category" },
  { value: "sizes_json", label: "Sizes" },
  { value: "color", label: "Color" },
];

export default function FilterEditor({ categoryId, filters }: { categoryId: number; filters: CategoryFilter[] }) {
  const [showAdd, setShowAdd] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <section className="stu-card">
      <header className="stu-card__head">
        <h3>Filters</h3>
        <button type="button" className="stu-btn stu-btn--primary stu-btn--sm" onClick={() => setShowAdd(true)}>
          + Add filter
        </button>
      </header>
      <div className="stu-card__body">
        {filters.length === 0 && !showAdd && (
          <p style={{ color: "var(--stu-muted)", fontSize: 14 }}>No filters configured. Storefront will inherit from parent category or show no filters.</p>
        )}

        {showAdd && <AddFilterForm categoryId={categoryId} nextOrder={filters.length} onDone={() => setShowAdd(false)} />}

        <div className="fe-list">
          {filters.map((f) => (
            <div key={f.id} className="fe-item">
              <div className="fe-item__head" onClick={() => setExpanded(expanded === f.id ? null : f.id)}>
                <span className="fe-item__name">{f.name}</span>
                <span className="fe-item__meta">{f.filter_type} · {f.field_key} · {f.options.length} option{f.options.length !== 1 ? "s" : ""}</span>
                <span className="fe-item__chevron">{expanded === f.id ? "▾" : "▸"}</span>
              </div>
              {expanded === f.id && (
                <FilterDetail filter={f} categoryId={categoryId} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AddFilterForm({ categoryId, nextOrder, onDone }: { categoryId: number; nextOrder: number; onDone: () => void }) {
  const [state, action, pending] = useActionState(saveFilterAction, {} as FilterSaveState);

  useEffect(() => { if (state.success) onDone(); }, [state.success, onDone]);

  return (
    <form action={action} className="fe-add-form">
      <input type="hidden" name="category_id" value={categoryId} />
      <input type="hidden" name="sort_order" value={nextOrder} />
      <div className="stu-row">
        <label className="stu-field">
          <span className="stu-field__label">Filter name</span>
          <input name="name" required className="stu-input" placeholder="e.g. Collar" />
        </label>
        <label className="stu-field">
          <span className="stu-field__label">Product field</span>
          <select name="field_key" required className="stu-select">
            {FIELD_KEYS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
        </label>
        <label className="stu-field">
          <span className="stu-field__label">Type</span>
          <select name="filter_type" required className="stu-select">
            <option value="checkbox">Checkbox</option>
            <option value="color">Color</option>
            <option value="size">Size</option>
            <option value="range">Price range</option>
          </select>
        </label>
      </div>
      {state.error && <p className="stu-form__error">{state.error}</p>}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button type="submit" className="stu-btn stu-btn--primary stu-btn--sm" disabled={pending}>
          {pending ? "Saving…" : "Add"}
        </button>
        <button type="button" className="stu-btn stu-btn--ghost stu-btn--sm" onClick={onDone}>Cancel</button>
      </div>
    </form>
  );
}

function FilterDetail({ filter, categoryId }: { filter: CategoryFilter; categoryId: number }) {
  const [showAddOpt, setShowAddOpt] = useState(false);
  void categoryId;

  return (
    <div className="fe-detail">
      <div className="fe-detail__actions">
        <form action={removeFilterAction}>
          <input type="hidden" name="filter_id" value={filter.id} />
          <button type="submit" className="stu-btn stu-btn--ghost stu-btn--sm" style={{ color: "var(--stu-danger, #c00)" }}>
            Remove filter
          </button>
        </form>
      </div>

      <div className="fe-options">
        {filter.options.length === 0 && (
          <p style={{ color: "var(--stu-muted)", fontSize: 13 }}>No options yet — filter won't appear on storefront.</p>
        )}
        {filter.options.map((opt) => (
          <div key={opt.id} className="fe-opt">
            {filter.filter_type === "color" && opt.color_hex && (
              <span className="fe-opt__swatch" style={{ background: opt.color_hex }} />
            )}
            <span className="fe-opt__value">{opt.label || opt.value}</span>
            <form action={removeOptionAction} style={{ marginLeft: "auto" }}>
              <input type="hidden" name="option_id" value={opt.id} />
              <button type="submit" className="fe-opt__remove" title="Remove option">×</button>
            </form>
          </div>
        ))}
      </div>

      {showAddOpt ? (
        <AddOptionForm filterId={filter.id} filterType={filter.filter_type} nextOrder={filter.options.length} onDone={() => setShowAddOpt(false)} />
      ) : (
        <button type="button" className="stu-btn stu-btn--ghost stu-btn--sm" onClick={() => setShowAddOpt(true)}>
          + Add option
        </button>
      )}
    </div>
  );
}

function AddOptionForm({ filterId, filterType, nextOrder, onDone }: { filterId: number; filterType: string; nextOrder: number; onDone: () => void }) {
  const [state, action, pending] = useActionState(saveOptionAction, {} as OptionSaveState);

  useEffect(() => { if (state.success) onDone(); }, [state.success, onDone]);

  return (
    <form action={action} className="fe-add-form">
      <input type="hidden" name="filter_id" value={filterId} />
      <input type="hidden" name="sort_order" value={nextOrder} />
      <div className="stu-row">
        <label className="stu-field">
          <span className="stu-field__label">Value</span>
          <input name="value" required className="stu-input" placeholder="e.g. Slim Fit" />
        </label>
        <label className="stu-field">
          <span className="stu-field__label">Label (optional)</span>
          <input name="label" className="stu-input" placeholder="Display name" />
        </label>
        {filterType === "color" && (
          <label className="stu-field">
            <span className="stu-field__label">Color hex</span>
            <input name="color_hex" type="color" className="stu-input" style={{ width: 60, padding: 2 }} />
          </label>
        )}
      </div>
      {state.error && <p className="stu-form__error">{state.error}</p>}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button type="submit" className="stu-btn stu-btn--primary stu-btn--sm" disabled={pending}>
          {pending ? "Saving…" : "Add"}
        </button>
        <button type="button" className="stu-btn stu-btn--ghost stu-btn--sm" onClick={onDone}>Cancel</button>
      </div>
    </form>
  );
}
