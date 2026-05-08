"use client";
import { saveFabricMetaAction } from "../../actions/fabrics";
import type { FabricMetaRow } from "../../../../lib/admin/types";

export default function FabricMetaForm({ slug, meta }: { slug: string; meta: FabricMetaRow | null }) {
  return (
    <form action={saveFabricMetaAction} className="adm-form adm-panel" style={{ padding: 28 }}>
      <input type="hidden" name="slug" value={slug} />
      <div className="adm-field__row--3">
        <label className="adm-field">
          <span className="adm-field__label">Width (inches)</span>
          <input name="width_inches" type="number" min={0} max={120} defaultValue={meta?.width_inches ?? 58} className="adm-field__input" />
        </label>
        <label className="adm-field">
          <span className="adm-field__label">GSM</span>
          <input name="gsm" type="number" min={0} max={2000} defaultValue={meta?.gsm ?? 0} className="adm-field__input" />
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Stock total · metres</span>
          <input name="stock_meters_total" type="number" min={0} defaultValue={meta?.stock_meters_total ?? 0} className="adm-field__input" />
        </label>
      </div>
      <label className="adm-field">
        <span className="adm-field__label">Composition</span>
        <input name="composition" defaultValue={meta?.composition ?? ""} placeholder="100% Super 120s Wool" className="adm-field__input" />
      </label>
      <label className="adm-field">
        <span className="adm-field__label">Care</span>
        <input name="care" defaultValue={meta?.care ?? ""} placeholder="Dry clean only · Steam between wears" className="adm-field__input" />
      </label>
      <label className="adm-field">
        <span className="adm-field__label">Origin / mill</span>
        <input name="origin" defaultValue={meta?.origin ?? ""} placeholder="Vitale Barberis Canonico · Biella, Italy" className="adm-field__input" />
      </label>
      <div>
        <button type="submit" className="adm-btn adm-btn--primary">Save cloth meta</button>
      </div>
    </form>
  );
}
