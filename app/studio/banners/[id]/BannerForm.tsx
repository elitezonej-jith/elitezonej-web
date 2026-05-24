"use client";
import { useActionState, useState } from "react";
import { saveBannerAction, type BannerSaveState } from "../../actions/banners";
import ImageUploader from "../../components/ImageUploader";
import Switch from "../../components/Switch";
import type { Banner } from "../../../../lib/admin/repos/banners";

const initial: BannerSaveState = {};

function dateLocalForInput(value: string | Date | null): string {
  if (value == null) return "";
  // SQLite returns TEXT ("2026-05-22 10:38:00"); postgres.js returns a JS Date
  // for timestamptz. <input type="datetime-local"> wants "YYYY-MM-DDTHH:mm" in
  // local time. Normalise both cases through a Date first.
  const d = value instanceof Date ? value : new Date(String(value).replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function BannerForm({ banner }: { banner?: Banner }) {
  const [state, action, pending] = useActionState(saveBannerAction, initial);
  const [image, setImage] = useState(banner?.image_path ?? "");
  const [mobile, setMobile] = useState(banner?.mobile_image_path ?? "");
  const [title, setTitle] = useState(banner?.title ?? "");
  const [subtitle, setSubtitle] = useState(banner?.subtitle ?? "");
  const [buttonText, setButtonText] = useState(banner?.button_text ?? "Shop now");
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">(banner?.text_align ?? "left");
  const [textColor, setTextColor] = useState<"light" | "dark">(banner?.text_color ?? "light");

  return (
    <form action={action} className="stu-form">
      {banner?.id ? <input type="hidden" name="id" value={banner.id} /> : null}

      {/* Live preview */}
      <section className="stu-card">
        <header className="stu-card__head">
          <h3>Preview</h3>
          <span className="stu-card__head__sub">This is how customers will see the banner.</span>
        </header>
        <div className="stu-card__body">
          <div className="stu-banner-preview">
            <div className="stu-banner-preview__hero">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt="" className="stu-banner-preview__img" />
              ) : null}
              <div className={`stu-banner-preview__content text-${textColor} align-${textAlign}`}>
                <div className="stu-banner-preview__title">{title || "Banner title"}</div>
                <div className="stu-banner-preview__sub">{subtitle || "Subtitle text appears here."}</div>
                <span className="stu-banner-preview__btn">{buttonText || "Shop now"}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="stu-cols">
        <div className="stu-stack">
          {/* Content */}
          <section className="stu-card">
            <header className="stu-card__head"><h3>Content</h3></header>
            <div className="stu-card__body">
              <label className="stu-field">
                <span className="stu-field__label">Title</span>
                <input name="title" value={title} onChange={(e) => setTitle(e.target.value)}
                       className="stu-input" placeholder="The Heritage Three-Piece" />
              </label>
              <label className="stu-field" style={{ marginTop: 16 }}>
                <span className="stu-field__label">Subtitle</span>
                <textarea name="subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)}
                          className="stu-textarea" rows={2}
                          placeholder="Wedding-day tailoring, eight hours on the body." />
              </label>
              <div className="stu-row" style={{ marginTop: 16 }}>
                <label className="stu-field">
                  <span className="stu-field__label">Button label</span>
                  <input name="button_text" value={buttonText} onChange={(e) => setButtonText(e.target.value)} className="stu-input" />
                </label>
                <label className="stu-field">
                  <span className="stu-field__label">Button link <span className="stu-field__hint">(where it goes)</span></span>
                  <input name="button_href" defaultValue={banner?.button_href ?? ""} className="stu-input"
                         placeholder="/collection?c=men" style={{ fontFamily: "ui-monospace, monospace" }} />
                </label>
              </div>
            </div>
          </section>

          {/* Images */}
          <section className="stu-card">
            <header className="stu-card__head"><h3>Images</h3></header>
            <div className="stu-card__body">
              <p className="stu-section-help">Desktop image (wide) — required</p>
              {image ? (
                <div className="stu-image-tile" style={{ marginBottom: 12, maxWidth: 320 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="stu-image-tile__img" src={image} alt="" style={{ aspectRatio: "21/9" }} />
                  <div className="stu-image-tile__bar">
                    <button type="button" className="stu-image-tile__btn stu-image-tile__btn--danger"
                            onClick={() => setImage("")}>Remove</button>
                  </div>
                </div>
              ) : (
                <ImageUploader folder="banners" multiple={false}
                               onUploaded={({ path }) => setImage(path)}
                               hint="Wide hero image, 2400×1000 ideal" />
              )}
              <input type="hidden" name="image_path" value={image} />

              <p className="stu-section-help" style={{ marginTop: 22 }}>
                Mobile image (portrait or square) — optional. We'll use the desktop image if blank.
              </p>
              {mobile ? (
                <div className="stu-image-tile" style={{ marginBottom: 12, maxWidth: 200 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="stu-image-tile__img" src={mobile} alt="" />
                  <div className="stu-image-tile__bar">
                    <button type="button" className="stu-image-tile__btn stu-image-tile__btn--danger"
                            onClick={() => setMobile("")}>Remove</button>
                  </div>
                </div>
              ) : (
                <ImageUploader folder="banners" multiple={false}
                               onUploaded={({ path }) => setMobile(path)}
                               hint="Mobile-friendly crop, 800×1000 ideal" />
              )}
              <input type="hidden" name="mobile_image_path" value={mobile} />
            </div>
          </section>
        </div>

        <div className="stu-stack">
          {/* Style + Schedule + Status */}
          <section className="stu-card">
            <header className="stu-card__head"><h3>Style</h3></header>
            <div className="stu-card__body">
              <label className="stu-field">
                <span className="stu-field__label">Text alignment</span>
                <select name="text_align" value={textAlign} onChange={(e) => setTextAlign(e.target.value as "left" | "center" | "right")} className="stu-select">
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </label>
              <label className="stu-field" style={{ marginTop: 16 }}>
                <span className="stu-field__label">Text color</span>
                <select name="text_color" value={textColor} onChange={(e) => setTextColor(e.target.value as "light" | "dark")} className="stu-select">
                  <option value="light">Light · for dark photos</option>
                  <option value="dark">Dark · for light photos</option>
                </select>
              </label>
            </div>
          </section>

          <section className="stu-card">
            <header className="stu-card__head"><h3>Schedule & visibility</h3></header>
            <div className="stu-card__body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label className="stu-field">
                <span className="stu-field__label">Status</span>
                <select name="status" defaultValue={banner?.status ?? "draft"} className="stu-select">
                  <option value="draft">Draft — only you can see it</option>
                  <option value="scheduled">Scheduled — go live in the window</option>
                  <option value="published">Published — live now</option>
                </select>
              </label>
              <Switch name="enabled" label="Enabled" hint="Off hides the banner everywhere."
                      defaultChecked={(banner?.enabled ?? 1) === 1} />
              <div className="stu-row">
                <label className="stu-field">
                  <span className="stu-field__label">Start at</span>
                  <input name="starts_at" type="datetime-local"
                         defaultValue={dateLocalForInput(banner?.starts_at ?? null)} className="stu-input" />
                </label>
                <label className="stu-field">
                  <span className="stu-field__label">End at</span>
                  <input name="ends_at" type="datetime-local"
                         defaultValue={dateLocalForInput(banner?.ends_at ?? null)} className="stu-input" />
                </label>
              </div>
            </div>
          </section>
        </div>
      </div>

      {state.error && <p role="alert" className="stu-form__error">{state.error}</p>}

      <div className="stu-btn-row" style={{ justifyContent: "flex-end" }}>
        <button type="submit" className="stu-btn stu-btn--primary stu-btn--lg" disabled={pending}>
          {pending ? "Saving…" : (banner ? "Save banner" : "Create banner")}
        </button>
      </div>
    </form>
  );
}
