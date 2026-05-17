"use client";
import { useActionState, useState } from "react";
import { saveCategoryAction, type CatSaveState } from "../../actions/categories";
import ImageUploader from "../../components/ImageUploader";
import Switch from "../../components/Switch";

const initial: CatSaveState = {};

type CatRow = {
  id: number; parent_id: number | null; name: string; slug: string;
  gender: string | null; kind: string | null; sort_order: number;
  image_path: string; enabled: number;
};

export default function CategoryForm({ tops, category }: {
  tops: Array<{ id: number; name: string; parent_id: number | null }>;
  category?: CatRow;
}) {
  const [state, action, pending] = useActionState(saveCategoryAction, initial);
  const [name, setName] = useState(category?.name ?? "");
  const [image, setImage] = useState(category?.image_path ?? "");
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  return (
    <form action={action} className="stu-form">
      {category?.id ? <input type="hidden" name="id" value={category.id} /> : null}
      <input type="hidden" name="image_path" value={image} />

      <section className="stu-card">
        <header className="stu-card__head"><h3>Details</h3></header>
        <div className="stu-card__body">
          <div className="stu-row">
            <label className="stu-field">
              <span className="stu-field__label">Name</span>
              <input name="name" value={name} onChange={(e) => setName(e.target.value)} required className="stu-input" placeholder="Wedding suits" />
            </label>
            <label className="stu-field">
              <span className="stu-field__label">URL handle <span className="stu-field__hint">(lowercase, no spaces)</span></span>
              <input name="slug" defaultValue={category?.slug ?? slug} key={slug} required pattern="[a-z0-9-]+"
                     className="stu-input" placeholder="wedding-suits" style={{ fontFamily: "ui-monospace, monospace" }} />
            </label>
          </div>

          <div className="stu-row" style={{ marginTop: 16 }}>
            <label className="stu-field">
              <span className="stu-field__label">Parent <span className="stu-field__hint">(blank for top-level)</span></span>
              <select name="parent_id" defaultValue={category?.parent_id ?? ""} className="stu-select">
                <option value="">— Top-level —</option>
                {tops.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
            <label className="stu-field">
              <span className="stu-field__label">Sort order</span>
              <input name="sort_order" type="number" min={0} defaultValue={category?.sort_order ?? 0} className="stu-input" />
            </label>
          </div>

          <div className="stu-row" style={{ marginTop: 16 }}>
            <label className="stu-field">
              <span className="stu-field__label">Audience</span>
              <select name="gender" defaultValue={category?.gender ?? ""} className="stu-select">
                <option value="">—</option>
                <option value="men">Men</option>
                <option value="women">Women</option>
              </select>
            </label>
            <label className="stu-field">
              <span className="stu-field__label">Type tag</span>
              <input name="kind" defaultValue={category?.kind ?? ""} className="stu-input" placeholder="suits, shirts…" />
            </label>
          </div>
        </div>
      </section>

      <section className="stu-card">
        <header className="stu-card__head"><h3>Image & visibility</h3></header>
        <div className="stu-card__body">
          {image ? (
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="" style={{ width: 140, height: 100, objectFit: "cover", borderRadius: 8, border: "1px solid var(--stu-border)" }} />
              <button type="button" className="stu-btn stu-btn--ghost stu-btn--sm" onClick={() => setImage("")}>Remove image</button>
            </div>
          ) : (
            <ImageUploader folder="categories" multiple={false} onUploaded={({ path }) => setImage(path)} hint="Optional. 1200×900 ideal." />
          )}
          <div style={{ marginTop: 18 }}>
            <Switch name="enabled" label="Show in storefront" defaultChecked={(category?.enabled ?? 1) === 1} />
          </div>
        </div>
      </section>

      {state.error && <p role="alert" className="stu-form__error">{state.error}</p>}

      <div className="stu-btn-row" style={{ justifyContent: "flex-end" }}>
        <button type="submit" className="stu-btn stu-btn--primary stu-btn--lg" disabled={pending}>
          {pending ? "Saving…" : (category ? "Save category" : "Create category")}
        </button>
      </div>
    </form>
  );
}
