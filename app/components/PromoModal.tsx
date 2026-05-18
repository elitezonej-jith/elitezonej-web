"use client";

import { useCallback, useEffect, useState } from "react";
import { useModalA11y } from "./useModalA11y";

const DEFAULT_COUNTRIES = [
  "India", "United Kingdom", "United States", "United Arab Emirates",
  "Canada", "Australia", "Singapore", "Germany", "France", "Other",
];

export type PromoModalProps = {
  stickerLabel?: string;
  heading?: string;
  deck?: string;
  submitLabel?: string;
  finePrint?: string;
  successHeading?: string;
  successBody?: string;
  countries?: string[];
};

// Split a multi-line string into React nodes joined by <br/>, preserving the
// original markup (the static homepage used literal <br/> between lines).
function withBreaks(text: string): React.ReactNode {
  const parts = text.split("\n");
  return parts.map((p, i) => (
    <span key={i}>
      {p}
      {i < parts.length - 1 ? <br /> : null}
    </span>
  ));
}

export default function PromoModal({
  stickerLabel = "15% OFF",
  heading = "Take 15% off\nyour first order",
  deck = "Join the Elite Zone J mailing list\nfor exclusive VIP offers and more.",
  submitLabel = "Subscribe and save 15%",
  finePrint = "*15% off your first order is valid on full-priced items only and cannot be used in conjunction with sale items or any other promotional codes.",
  successHeading = "Welcome.",
  successBody = "Thanks for joining — we'll email your 15% code to {email} shortly.",
  countries = DEFAULT_COUNTRIES,
}: PromoModalProps = {}) {
  const COUNTRIES = countries.length ? countries : DEFAULT_COUNTRIES;
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Restore dismissal across page loads
  useEffect(() => {
    if (typeof window !== "undefined") {
      setDismissed(localStorage.getItem("promo-dismissed") === "1");
    }
  }, []);

  const close = useCallback(() => setOpen(false), []);
  const modalRef = useModalA11y(open, close);

  const dismissSticker = () => {
    setDismissed(true);
    if (typeof window !== "undefined") localStorage.setItem("promo-dismissed", "1");
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setOpen(false);
      setSubmitted(false);
    }, 1800);
  };

  return (
    <>
      {!dismissed && (
        <div className="promo-sticker-wrap">
          <button
            className="promo-sticker"
            onClick={() => setOpen(true)}
            aria-label="Open 15% off offer"
          >
            {stickerLabel}
          </button>
          <button
            className="promo-sticker-dismiss"
            onClick={dismissSticker}
            aria-label="Dismiss offer"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="12" cy="12" r="10" />
              <path d="M9 9l6 6M15 9l-6 6" />
            </svg>
          </button>
        </div>
      )}

      <div
        className="promo-overlay"
        data-open={open}
        aria-hidden={!open}
        onClick={() => setOpen(false)}
      />

      <div ref={modalRef} className="promo-modal" data-open={open} inert={!open} role="dialog" aria-modal="true" aria-label="15% off first order" tabIndex={-1}>
        <button
          className="promo-modal-close"
          onClick={() => setOpen(false)}
          aria-label="Close offer"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {submitted ? (
          <div className="promo-thanks">
            <h2>{successHeading}</h2>
            <p>
              {successBody.split("{email}").map((seg, i, arr) => (
                <span key={i}>
                  {seg}
                  {i < arr.length - 1 ? email : null}
                </span>
              ))}
            </p>
          </div>
        ) : (
          <form className="promo-form" onSubmit={onSubmit}>
            <h2>{withBreaks(heading)}</h2>
            <p className="promo-deck">
              {withBreaks(deck)}
            </p>
            <input
              type="email" required placeholder="Email"
              value={email} onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
            <select required value={country} onChange={e => setCountry(e.target.value)}>
              <option value="" disabled>Country</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="promo-row">
              <input
                type="text" placeholder="Name"
                value={name} onChange={e => setName(e.target.value)}
                autoComplete="given-name"
              />
              <input
                type="text" placeholder="Birthday"
                value={birthday} onChange={e => setBirthday(e.target.value)}
                onFocus={e => (e.target.type = "date")}
                onBlur={e => { if (!e.target.value) e.target.type = "text"; }}
              />
            </div>
            <button type="submit" className="promo-submit">{submitLabel}</button>
            <p className="promo-fineprint">
              {finePrint}
            </p>
          </form>
        )}
      </div>
    </>
  );
}
