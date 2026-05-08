"use client";
import { useActionState, useState } from "react";
import { saveNoticeAction, type NoticeSaveState } from "../../actions/notices";
import Switch from "../../components/Switch";
import type { Notice } from "../../../../lib/admin/repos/notices";

const initial: NoticeSaveState = {};

function dateLocalForInput(iso: string | null): string {
  if (!iso) return "";
  return iso.replace(" ", "T").slice(0, 16);
}

export default function NoticeForm({ notice }: { notice?: Notice }) {
  const [state, action, pending] = useActionState(saveNoticeAction, initial);
  const [type, setType] = useState<"scroll" | "popup" | "festive">((notice?.type as "scroll" | "popup" | "festive") ?? "scroll");
  const [body, setBody] = useState(notice?.body ?? "");
  const [bg, setBg] = useState(notice?.color_bg ?? "");
  const [fg, setFg] = useState(notice?.color_fg ?? "");

  return (
    <form action={action} className="stu-form">
      {notice?.id ? <input type="hidden" name="id" value={notice.id} /> : null}

      {/* Preview */}
      <section className="stu-card">
        <header className="stu-card__head"><h3>Preview</h3></header>
        <div className="stu-card__body">
          <div className="stu-notice-preview" style={bg || fg ? { background: bg || undefined, color: fg || undefined } : undefined}>
            {body || "Your notice text will appear here."}
            {(notice?.link_href || notice?.link_text) && (
              <a href={notice.link_href}>{notice.link_text || "Learn more"}</a>
            )}
          </div>
        </div>
      </section>

      <section className="stu-card">
        <header className="stu-card__head"><h3>Content</h3></header>
        <div className="stu-card__body">
          <label className="stu-field">
            <span className="stu-field__label">Type</span>
            <select name="type" value={type} onChange={(e) => setType(e.target.value as typeof type)} className="stu-select">
              <option value="scroll">Scrolling ticker · top of every page</option>
              <option value="popup">Popup · shown on first visit</option>
              <option value="festive">Festive bar · soft, dismissable</option>
            </select>
          </label>
          <label className="stu-field" style={{ marginTop: 16 }}>
            <span className="stu-field__label">Message</span>
            <textarea name="body" value={body} onChange={(e) => setBody(e.target.value)} required minLength={2}
                      className="stu-textarea" rows={3}
                      placeholder="Free shipping over ₹5,000 · Made-to-measure in seven days" />
          </label>
          <div className="stu-row" style={{ marginTop: 16 }}>
            <label className="stu-field">
              <span className="stu-field__label">Link label <span className="stu-field__hint">(optional)</span></span>
              <input name="link_text" defaultValue={notice?.link_text ?? ""} className="stu-input" placeholder="Learn more" />
            </label>
            <label className="stu-field">
              <span className="stu-field__label">Link URL</span>
              <input name="link_href" defaultValue={notice?.link_href ?? ""} className="stu-input" placeholder="/bespoke" />
            </label>
          </div>
        </div>
      </section>

      <section className="stu-card">
        <header className="stu-card__head"><h3>Style & priority</h3></header>
        <div className="stu-card__body">
          <div className="stu-row--3">
            <label className="stu-field">
              <span className="stu-field__label">Background color <span className="stu-field__hint">(optional)</span></span>
              <input name="color_bg" value={bg} onChange={(e) => setBg(e.target.value)} className="stu-input" placeholder="#1A1612" />
            </label>
            <label className="stu-field">
              <span className="stu-field__label">Text color <span className="stu-field__hint">(optional)</span></span>
              <input name="color_fg" value={fg} onChange={(e) => setFg(e.target.value)} className="stu-input" placeholder="#FFFFFF" />
            </label>
            <label className="stu-field">
              <span className="stu-field__label">Priority <span className="stu-field__hint">(higher shows first)</span></span>
              <input name="priority" type="number" min={0} max={999} defaultValue={notice?.priority ?? 0} className="stu-input" />
            </label>
          </div>
        </div>
      </section>

      <section className="stu-card">
        <header className="stu-card__head"><h3>Schedule & visibility</h3></header>
        <div className="stu-card__body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Switch name="enabled" label="Live on store" defaultChecked={(notice?.enabled ?? 1) === 1} />
          <Switch name="dismissable" label="Customer can dismiss"
                  hint="Adds a small × on the notice. Recommended for popups."
                  defaultChecked={(notice?.dismissable ?? 1) === 1} />
          <div className="stu-row">
            <label className="stu-field">
              <span className="stu-field__label">Start at</span>
              <input name="starts_at" type="datetime-local"
                     defaultValue={dateLocalForInput(notice?.starts_at ?? null)} className="stu-input" />
            </label>
            <label className="stu-field">
              <span className="stu-field__label">End at</span>
              <input name="ends_at" type="datetime-local"
                     defaultValue={dateLocalForInput(notice?.ends_at ?? null)} className="stu-input" />
            </label>
          </div>
          <label className="stu-field">
            <span className="stu-field__label">Show on pages
              <span className="stu-field__hint">(comma-separated path prefixes — &ldquo;*&rdquo; for everywhere)</span>
            </span>
            <input name="target_paths" defaultValue={notice?.target_paths ?? "*"} className="stu-input"
                   placeholder="*  or  /collection,/products" />
          </label>
        </div>
      </section>

      {state.error && <p className="stu-form__error">{state.error}</p>}

      <div className="stu-btn-row" style={{ justifyContent: "flex-end" }}>
        <button type="submit" className="stu-btn stu-btn--primary stu-btn--lg" disabled={pending}>
          {pending ? "Saving…" : (notice ? "Save notice" : "Create notice")}
        </button>
      </div>
    </form>
  );
}
