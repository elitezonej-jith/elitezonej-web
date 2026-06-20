"use client";
import { useState } from "react";
import { startTrackingAction } from "../actions/inventory";

export default function StartTracking({ products }: { products: Array<{ slug: string; name: string }> }) {
  const [selected, setSelected] = useState("");
  const [sizes, setSizes] = useState("");

  return (
    <form action={startTrackingAction} className="inv-track-form">
      <div className="inv-track-form__row">
        <label className="stu-field">
          <span className="stu-field__label">Product</span>
          <select name="slug" value={selected} onChange={(e) => setSelected(e.target.value)} className="stu-select" required>
            <option value="">— Select a product —</option>
            {products.map(p => <option key={p.slug} value={p.slug}>{p.name}</option>)}
          </select>
        </label>
        <label className="stu-field">
          <span className="stu-field__label">Sizes <span className="stu-field__hint">(comma-separated)</span></span>
          <input name="sizes" value={sizes} onChange={(e) => setSizes(e.target.value)} className="stu-input" placeholder="S, M, L, XL or 36, 38, 40, 42" required />
        </label>
        <label className="stu-field" style={{ maxWidth: 100 }}>
          <span className="stu-field__label">Initial qty</span>
          <input name="initial_stock" type="number" min={0} defaultValue={0} className="stu-input" />
        </label>
      </div>
      <button type="submit" className="stu-btn stu-btn--primary stu-btn--sm" disabled={!selected || !sizes}>
        Start tracking
      </button>
    </form>
  );
}
