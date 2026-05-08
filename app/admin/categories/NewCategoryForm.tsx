"use client";
import { createCategoryAction } from "../actions/categories";
import type { Category } from "../../../lib/admin/types";

export default function NewCategoryForm({ tops }: { tops: Category[] }) {
  return (
    <form action={createCategoryAction} className="adm-panel">
      <div className="adm-field__row--3">
        <label className="adm-field">
          <span className="adm-field__label">Name</span>
          <input name="name" required className="adm-field__input" placeholder="Wedding Suits" />
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Slug</span>
          <input name="slug" required pattern="[a-z0-9-]+" className="adm-field__input"
                 placeholder="wedding-suits" style={{ fontFamily: "JetBrains Mono, monospace" }} />
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Parent</span>
          <select name="parent_id" defaultValue="" className="adm-field__select">
            <option value="">— Top-level —</option>
            {tops.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="adm-field__row--3">
        <label className="adm-field">
          <span className="adm-field__label">Gender (optional)</span>
          <select name="gender" defaultValue="" className="adm-field__select">
            <option value="">—</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
          </select>
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Kind</span>
          <input name="kind" placeholder="suits, shirts, accessories…" className="adm-field__input" />
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Sort order</span>
          <input name="sort_order" type="number" min={0} defaultValue={0} className="adm-field__input" />
        </label>
      </div>
      <div style={{ marginTop: 12 }}>
        <button type="submit" className="adm-btn adm-btn--primary">Inscribe category</button>
      </div>
    </form>
  );
}
