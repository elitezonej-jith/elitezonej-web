"use client";
import { useState } from "react";
import { saveHomeSectionAction } from "../actions/content";
import type { HomeSection } from "../../../lib/admin/types";

export default function HomeSectionForm({ section }: { section: HomeSection }) {
  const [enabled, setEnabled] = useState<boolean>(section.enabled === 1);
  return (
    <form action={saveHomeSectionAction} className="adm-panel">
      <input type="hidden" name="key" value={section.key} />
      <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18, gap: 16, flexWrap: "wrap" }}>
        <div>
          <span className="adm-mono" style={{ color: "var(--adm-accent)" }}>{section.key}</span>
          <h3 style={{ margin: "4px 0 0", fontFamily: "Cormorant Garamond, serif", fontWeight: 500, fontStyle: "italic", fontSize: 22, color: "var(--adm-ink)" }}>
            {section.title || "(untitled)"}
          </h3>
        </div>
        <label className="adm-switch">
          <input type="checkbox" name="enabled" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          <span className="adm-switch__track" />
          <span className="adm-switch__label">{enabled ? "Live on site" : "Hidden"}</span>
        </label>
      </header>

      <div className="adm-field__row">
        <label className="adm-field">
          <span className="adm-field__label">Title</span>
          <input name="title" defaultValue={section.title} className="adm-field__input"
                 style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", fontSize: 18 }} />
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Kicker</span>
          <input name="kicker" defaultValue={section.kicker ?? ""} className="adm-field__input"
                 style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase" }} />
        </label>
      </div>

      <label className="adm-field">
        <span className="adm-field__label">Body</span>
        <textarea name="body" defaultValue={section.body ?? ""} className="adm-field__textarea" rows={3} />
      </label>

      <div className="adm-field__row">
        <label className="adm-field">
          <span className="adm-field__label">Image path</span>
          <input
            name="image_path"
            defaultValue={section.image_path ?? ""}
            className="adm-field__input"
            placeholder="/generated/_hero/premium.webp"
            style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12 }}
          />
        </label>
        <div className="adm-field" style={{ alignSelf: "end" }}>
          {section.image_path ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={section.image_path}
              alt={section.title}
              style={{ width: 120, height: 80, objectFit: "cover", border: "1px solid var(--adm-rule)" }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          ) : <span className="adm-italic">No preview</span>}
        </div>
      </div>

      <div className="adm-field__row">
        <label className="adm-field">
          <span className="adm-field__label">Link label</span>
          <input name="link_text" defaultValue={section.link_text ?? ""} className="adm-field__input" />
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Link href</span>
          <input name="link_href" defaultValue={section.link_href ?? ""} className="adm-field__input"
                 placeholder="/collection?c=men" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12 }} />
        </label>
      </div>

      <div style={{ marginTop: 16 }}>
        <button type="submit" className="adm-btn adm-btn--primary adm-btn--sm">Save surface</button>
      </div>
    </form>
  );
}
