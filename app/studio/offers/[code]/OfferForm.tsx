"use client";
import { useActionState, useState } from "react";
import { saveOfferAction, type OfferSaveState } from "../../actions/offers";
import Switch from "../../components/Switch";
import { IconPlus, IconTrash } from "../../components/Icons";
import type { Promotion } from "../../../../lib/admin/types";
import type { OfferTarget } from "../../../../lib/admin/repos/offer-targets";
import type { Product } from "../../../../lib/admin/types";

const initial: OfferSaveState = {};

type TargetRow = { target_type: "all" | "category" | "product"; target_id: string };
type Cat = { id: number; name: string; slug: string; parent_id: number | null };

function dateLocalForInput(iso: string | null): string {
  if (!iso) return "";
  return iso.replace(" ", "T").slice(0, 16);
}

export default function OfferForm({
  promo, targets = [], products, categories, isFeatured = false,
}: {
  promo?: Promotion;
  targets?: OfferTarget[];
  products: Product[];
  categories: Cat[];
  isFeatured?: boolean;
}) {
  const [state, action, pending] = useActionState(saveOfferAction, initial);
  const initialRows: TargetRow[] = targets.length
    ? targets.map((t) => ({ target_type: t.target_type, target_id: t.target_id }))
    : [{ target_type: "all", target_id: "" }];
  const [rows, setRows] = useState<TargetRow[]>(initialRows);

  const update = (i: number, patch: Partial<TargetRow>) =>
    setRows((p) => p.map((r, k) => k === i ? { ...r, ...patch } : r));
  const add = () => setRows((p) => [...p, { target_type: "product", target_id: "" }]);
  const remove = (i: number) => setRows((p) => p.length > 1 ? p.filter((_, k) => k !== i) : p);

  return (
    <form action={action} className="stu-form">
      <div className="stu-cols">
        <div className="stu-stack">
          <section className="stu-card">
            <header className="stu-card__head"><h3>The deal</h3></header>
            <div className="stu-card__body">
              <div className="stu-row">
                <label className="stu-field">
                  <span className="stu-field__label">Code <span className="stu-field__hint">(uppercase, no spaces)</span></span>
                  <input name="code" required defaultValue={promo?.code ?? ""} pattern="[A-Z0-9_-]+"
                         readOnly={!!promo} className="stu-input"
                         style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.04em", textTransform: "uppercase" }}
                         placeholder="WEDDING25" />
                </label>
                <label className="stu-field">
                  <span className="stu-field__label">Description (internal)</span>
                  <input name="description" defaultValue={promo?.description ?? ""} className="stu-input"
                         placeholder="Wedding-season 10% off" />
                </label>
              </div>

              <div className="stu-row--3" style={{ marginTop: 16 }}>
                <label className="stu-field">
                  <span className="stu-field__label">Type</span>
                  <select name="type" defaultValue={promo?.type ?? "percent"} className="stu-select">
                    <option value="percent">Percent off</option>
                    <option value="flat">Flat ₹ off</option>
                    <option value="free_ship">Free shipping</option>
                  </select>
                </label>
                <label className="stu-field">
                  <span className="stu-field__label">Value</span>
                  <input name="value" type="number" min={0} required defaultValue={promo?.value ?? 0} className="stu-input" />
                </label>
                <label className="stu-field">
                  <span className="stu-field__label">Min. cart total · ₹</span>
                  <input name="min_total" type="number" min={0} defaultValue={promo?.min_total ?? 0} className="stu-input" />
                </label>
              </div>
            </div>
          </section>

          <section className="stu-card">
            <header className="stu-card__head">
              <h3>Applies to</h3>
              <button type="button" className="stu-btn stu-btn--ghost stu-btn--sm" onClick={add}>
                <IconPlus width={14} height={14}/> Add target
              </button>
            </header>
            <div className="stu-card__body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {rows.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <select value={r.target_type} onChange={(e) => update(i, { target_type: e.target.value as TargetRow["target_type"], target_id: "" })} name="target_type" className="stu-select" style={{ maxWidth: 160 }}>
                    <option value="all">Whole order</option>
                    <option value="category">Category</option>
                    <option value="product">Product</option>
                  </select>
                  {r.target_type === "all" ? (
                    <input type="hidden" name="target_id" value="" />
                  ) : r.target_type === "category" ? (
                    <select name="target_id" value={r.target_id} onChange={(e) => update(i, { target_id: e.target.value })} className="stu-select" style={{ flex: 1 }}>
                      <option value="">— pick a category —</option>
                      {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
                    </select>
                  ) : (
                    <select name="target_id" value={r.target_id} onChange={(e) => update(i, { target_id: e.target.value })} className="stu-select" style={{ flex: 1 }}>
                      <option value="">— pick a product —</option>
                      {products.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
                    </select>
                  )}
                  {rows.length > 1 && (
                    <button type="button" className="stu-btn stu-btn--ghost stu-btn--icon" onClick={() => remove(i)}>
                      <IconTrash width={14} height={14}/>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="stu-stack">
          <section className="stu-card">
            <header className="stu-card__head"><h3>Schedule & state</h3></header>
            <div className="stu-card__body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label className="stu-field">
                <span className="stu-field__label">Status</span>
                <select name="status" defaultValue={promo?.status ?? "active"} className="stu-select">
                  <option value="active">Active</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="expired">Expired</option>
                  <option value="disabled">Disabled</option>
                </select>
              </label>
              <Switch name="is_featured" label="Featured offer" hint="Highlight this on the storefront." defaultChecked={isFeatured} />
              <div className="stu-row">
                <label className="stu-field">
                  <span className="stu-field__label">Start at</span>
                  <input name="starts_at" type="datetime-local" defaultValue={dateLocalForInput(promo?.starts_at ?? null)} className="stu-input" />
                </label>
                <label className="stu-field">
                  <span className="stu-field__label">End at</span>
                  <input name="ends_at" type="datetime-local" defaultValue={dateLocalForInput(promo?.ends_at ?? null)} className="stu-input" />
                </label>
              </div>
              <label className="stu-field">
                <span className="stu-field__label">Usage limit <span className="stu-field__hint">(blank = unlimited)</span></span>
                <input name="usage_limit" type="number" min={0} defaultValue={promo?.usage_limit ?? ""} className="stu-input" />
              </label>
            </div>
          </section>
        </div>
      </div>

      {state.error && <p className="stu-form__error">{state.error}</p>}

      <div className="stu-btn-row" style={{ justifyContent: "flex-end" }}>
        <button type="submit" className="stu-btn stu-btn--primary stu-btn--lg" disabled={pending}>
          {pending ? "Saving…" : (promo ? "Save offer" : "Create offer")}
        </button>
      </div>
    </form>
  );
}
