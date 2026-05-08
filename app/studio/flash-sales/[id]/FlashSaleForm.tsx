"use client";
import { useActionState, useState } from "react";
import { saveFlashSaleAction, type FlashState } from "../../actions/flash-sales";
import ImageUploader from "../../components/ImageUploader";
import Switch from "../../components/Switch";
import type { FlashSale } from "../../../../lib/admin/repos/flash-sales";
import type { Promotion } from "../../../../lib/admin/types";

const initial: FlashState = {};

function dateLocalForInput(iso: string | null): string {
  if (!iso) return "";
  return iso.replace(" ", "T").slice(0, 16);
}

export default function FlashSaleForm({ sale, promos }: { sale?: FlashSale; promos: Promotion[] }) {
  const [state, action, pending] = useActionState(saveFlashSaleAction, initial);
  const [image, setImage] = useState(sale?.banner_image ?? "");

  return (
    <form action={action} className="stu-form">
      {sale?.id ? <input type="hidden" name="id" value={sale.id} /> : null}
      <input type="hidden" name="banner_image" value={image} />

      <section className="stu-card">
        <header className="stu-card__head"><h3>Sale details</h3></header>
        <div className="stu-card__body">
          <div className="stu-row">
            <label className="stu-field">
              <span className="stu-field__label">Title</span>
              <input name="title" required defaultValue={sale?.title ?? ""} className="stu-input"
                     placeholder="Festive Edit · 30% off" />
            </label>
            <label className="stu-field">
              <span className="stu-field__label">Coupon code (optional)</span>
              <select name="promo_code" defaultValue={sale?.promo_code ?? ""} className="stu-select">
                <option value="">— None —</option>
                {promos.map((p) => <option key={p.code} value={p.code}>{p.code}</option>)}
              </select>
            </label>
          </div>
          <label className="stu-field" style={{ marginTop: 16 }}>
            <span className="stu-field__label">Subtitle</span>
            <input name="subtitle" defaultValue={sale?.subtitle ?? ""} className="stu-input"
                   placeholder="From haldi to reception, in seven days." />
          </label>
        </div>
      </section>

      <section className="stu-card">
        <header className="stu-card__head"><h3>Banner image</h3></header>
        <div className="stu-card__body">
          {image ? (
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="" style={{ width: 240, height: 100, objectFit: "cover", borderRadius: 8, border: "1px solid var(--stu-border)" }} />
              <button type="button" className="stu-btn stu-btn--ghost stu-btn--sm" onClick={() => setImage("")}>Remove</button>
            </div>
          ) : (
            <ImageUploader folder="flash-sales" multiple={false} onUploaded={({ path }) => setImage(path)} hint="Wide cinematic image, 2400×800 ideal." />
          )}
        </div>
      </section>

      <section className="stu-card">
        <header className="stu-card__head"><h3>Schedule</h3></header>
        <div className="stu-card__body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Switch name="enabled" label="Live on storefront" defaultChecked={(sale?.enabled ?? 1) === 1} />
          <div className="stu-row">
            <label className="stu-field">
              <span className="stu-field__label">Start at <span className="stu-field__hint">(blank = now)</span></span>
              <input name="starts_at" type="datetime-local" defaultValue={dateLocalForInput(sale?.starts_at ?? null)} className="stu-input" />
            </label>
            <label className="stu-field">
              <span className="stu-field__label">End at *</span>
              <input name="ends_at" type="datetime-local" required defaultValue={dateLocalForInput(sale?.ends_at ?? null)} className="stu-input" />
            </label>
          </div>
        </div>
      </section>

      {state.error && <p className="stu-form__error">{state.error}</p>}

      <div className="stu-btn-row" style={{ justifyContent: "flex-end" }}>
        <button type="submit" className="stu-btn stu-btn--primary stu-btn--lg" disabled={pending}>
          {pending ? "Saving…" : (sale ? "Save flash sale" : "Create flash sale")}
        </button>
      </div>
    </form>
  );
}
