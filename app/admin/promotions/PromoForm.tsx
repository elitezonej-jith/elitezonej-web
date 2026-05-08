"use client";
import { useActionState } from "react";
import { savePromoAction, type PromoState } from "../actions/promotions";
import type { Promotion } from "../../../lib/admin/types";

const initial: PromoState = {};

function dateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export default function PromoForm({ initial: p }: { initial?: Promotion }) {
  const [state, action, pending] = useActionState(savePromoAction, initial);
  return (
    <form action={action} className="adm-form">
      <div className="adm-field__row--3">
        <label className="adm-field">
          <span className="adm-field__label">Code · uppercase, no spaces</span>
          <input name="code" required defaultValue={p?.code ?? ""} pattern="[A-Z0-9_-]+"
                 className="adm-field__input"
                 style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase" }}
                 placeholder="WEDDING25"
                 readOnly={!!p} />
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Type</span>
          <select name="type" defaultValue={p?.type ?? "percent"} className="adm-field__select">
            <option value="percent">Percent</option>
            <option value="flat">Flat ₹</option>
            <option value="free_ship">Free shipping</option>
          </select>
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Value</span>
          <input name="value" type="number" min={0} required defaultValue={p?.value ?? 0} className="adm-field__input" />
        </label>
      </div>

      <label className="adm-field">
        <span className="adm-field__label">Description (internal)</span>
        <input name="description" defaultValue={p?.description ?? ""} className="adm-field__input"
               placeholder="Wedding-season 10% off, min cart ₹25,000" />
      </label>

      <div className="adm-field__row--3">
        <label className="adm-field">
          <span className="adm-field__label">Min. cart total · ₹</span>
          <input name="min_total" type="number" min={0} defaultValue={p?.min_total ?? 0} className="adm-field__input" />
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Usage limit (blank for none)</span>
          <input name="usage_limit" type="number" min={0} defaultValue={p?.usage_limit ?? ""} className="adm-field__input" />
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Status</span>
          <select name="status" defaultValue={p?.status ?? "active"} className="adm-field__select">
            <option value="active">Active</option>
            <option value="scheduled">Scheduled</option>
            <option value="expired">Expired</option>
            <option value="disabled">Disabled</option>
          </select>
        </label>
      </div>

      <div className="adm-field__row">
        <label className="adm-field">
          <span className="adm-field__label">Starts at</span>
          <input name="starts_at" type="date" defaultValue={dateInput(p?.starts_at)} className="adm-field__input" />
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Ends at</span>
          <input name="ends_at" type="date" defaultValue={dateInput(p?.ends_at)} className="adm-field__input" />
        </label>
      </div>

      {state.error && <p className="adm-form__error">{state.error}</p>}

      <div>
        <button type="submit" className="adm-btn adm-btn--primary" disabled={pending}>
          {pending ? "Saving…" : (p ? "Save promotion" : "Inscribe promotion")}
        </button>
      </div>
    </form>
  );
}
