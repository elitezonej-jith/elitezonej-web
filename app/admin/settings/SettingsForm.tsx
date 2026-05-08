"use client";
import { saveSettingsAction } from "../actions/settings";

export default function SettingsForm({ initial }: { initial: Record<string, string> }) {
  return (
    <form action={saveSettingsAction} className="adm-panel">
      <div className="adm-field__row">
        <label className="adm-field">
          <span className="adm-field__label">Brand name</span>
          <input name="brand_name" defaultValue={initial.brand_name ?? ""} className="adm-field__input" />
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Tagline</span>
          <input name="brand_tagline" defaultValue={initial.brand_tagline ?? ""} className="adm-field__input"
                 style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", fontSize: 17 }} />
        </label>
      </div>
      <div className="adm-field__row--3">
        <label className="adm-field">
          <span className="adm-field__label">Currency code</span>
          <input name="currency" defaultValue={initial.currency ?? "INR"} className="adm-field__input" />
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Currency symbol</span>
          <input name="currency_symbol" defaultValue={initial.currency_symbol ?? "₹"} className="adm-field__input" />
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Lead time · days</span>
          <input name="lead_time_days" type="number" min={1} max={60} defaultValue={initial.lead_time_days ?? "7"} className="adm-field__input" />
        </label>
      </div>
      <div className="adm-field__row">
        <label className="adm-field">
          <span className="adm-field__label">Atelier email</span>
          <input name="contact_email" type="email" defaultValue={initial.contact_email ?? ""} className="adm-field__input" />
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Atelier phone</span>
          <input name="contact_phone" defaultValue={initial.contact_phone ?? ""} className="adm-field__input" />
        </label>
      </div>
      <div className="adm-field__row">
        <label className="adm-field">
          <span className="adm-field__label">Atelier address</span>
          <input name="atelier_address" defaultValue={initial.atelier_address ?? ""} className="adm-field__input" />
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Instagram URL</span>
          <input name="instagram" defaultValue={initial.instagram ?? ""} className="adm-field__input" />
        </label>
      </div>
      <div className="adm-field__row">
        <label className="adm-field">
          <span className="adm-field__label">Low-stock threshold</span>
          <input name="low_stock_threshold" type="number" min={0} max={20}
                 defaultValue={initial.low_stock_threshold ?? "3"}
                 className="adm-field__input" />
        </label>
      </div>
      <div style={{ marginTop: 16 }}>
        <button type="submit" className="adm-btn adm-btn--primary">Save preferences</button>
      </div>
    </form>
  );
}
