"use client";
import { useState } from "react";
import { addBlockAction } from "../actions/homepage";
import { useModalA11y } from "../../components/useModalA11y";
import { IconPlus } from "../components/Icons";

const OPTIONS: Array<{ value: string; label: string; sub: string }> = [
  { value: "announce_bar", label: "Announce bar", sub: "Scrolling ticker above the header" },
  { value: "hero_grid", label: "Hero grid", sub: "Three image tiles, top of page" },
  { value: "hero_banner", label: "Hero banner", sub: "Single full-width image with text" },
  { value: "banner_carousel", label: "Banner carousel", sub: "Rotating banners from /studio/banners" },
  { value: "product_carousel", label: "Product carousel", sub: "Auto from filter (e.g. featured, new)" },
  { value: "editorial_split", label: "Editorial split", sub: "Image on one side, text on the other" },
  { value: "service_cards", label: "Service cards", sub: "Three cards (e.g. Bespoke, Sherwani, Shirts)" },
  { value: "process_strip", label: "Process strip", sub: "Step 1 / 2 / 3 illustration" },
  { value: "full_banner", label: "Full-width banner", sub: "Cinematic image + headline + button" },
  { value: "wedding_editorial", label: "Wedding editorial", sub: "Festive feature block" },
  { value: "bespoke_teaser", label: "Bespoke teaser", sub: "Quiet text block with CTA" },
  { value: "trust_strip", label: "Trust strip", sub: "Free shipping / mending / etc." },
  { value: "category_grid", label: "Category grid", sub: "Browse by category" },
  { value: "promo_modal", label: "Promo modal", sub: "15%-off sticker + popup form" },
  { value: "custom_html", label: "Custom HTML", sub: "Free-form markup" },
];

export default function AddBlockMenu() {
  const [open, setOpen] = useState(false);
  const dialogRef = useModalA11y<HTMLDivElement>(open, () => setOpen(false));
  return (
    <>
      <button type="button" className="stu-btn stu-btn--primary" onClick={() => setOpen(true)}>
        <IconPlus width={16} height={16}/> Add section
      </button>
      {open && (
        <div className="stu-dialog-overlay" onClick={() => setOpen(false)}>
          <div
            ref={dialogRef}
            className="stu-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 540 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="stu-addblock-title"
          >
            <h3 id="stu-addblock-title" className="stu-dialog__title" style={{ marginBottom: 14 }}>Pick a section type</h3>
            <div style={{ maxHeight: "60vh", overflow: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
              {OPTIONS.map((o) => (
                <form key={o.value} action={addBlockAction}>
                  <input type="hidden" name="type" value={o.value} />
                  <input type="hidden" name="title" value={o.label} />
                  <button type="submit" className="stu-btn stu-btn--ghost"
                          style={{ width: "100%", justifyContent: "flex-start", padding: "10px 14px", textAlign: "left" }}>
                    <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                      <strong style={{ fontSize: 14, color: "var(--stu-text)" }}>{o.label}</strong>
                      <span style={{ fontSize: 12.5, color: "var(--stu-text-3)", fontWeight: 400 }}>{o.sub}</span>
                    </span>
                  </button>
                </form>
              ))}
            </div>
            <div className="stu-dialog__row" style={{ marginTop: 16 }}>
              <button type="button" className="stu-btn stu-btn--ghost" onClick={() => setOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
