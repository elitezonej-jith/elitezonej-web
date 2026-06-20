"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useModalA11y } from "./useModalA11y";

export type PromoModalProps = {
  stickerLabel?: string;
  heading?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export default function PromoModal({
  stickerLabel = "15% OFF",
  heading = "15% off your first order",
  ctaLabel = "Shop the Collection",
  ctaHref = "/collection?c=men",
}: PromoModalProps = {}) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

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

  const sticker = !dismissed && (
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
  );

  return (
    <>
      {mounted && sticker && createPortal(sticker, document.body)}

      {mounted && createPortal(
        <>
          <div
            className="promo-overlay"
            data-open={open}
            aria-hidden={!open}
            onClick={() => setOpen(false)}
          />

          <div ref={modalRef} className="promo-modal" data-open={open} aria-hidden={!open} role="dialog" aria-modal="true" aria-label="15% off first order" tabIndex={-1}>
            <button
              className="promo-modal-close"
              onClick={() => setOpen(false)}
              aria-label="Close offer"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            <div className="promo-body">
              <h2>{heading}</h2>
              <p className="promo-deck">Automatically applied at checkout on your first order.</p>
              <Link href={ctaHref} className="promo-cta" onClick={() => setOpen(false)}>
                {ctaLabel} →
              </Link>
            </div>
          </div>
        </>,
        document.body
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .promo-body { text-align: center; padding: 32px 24px; }
        .promo-body h2 { font-family: var(--font-display); font-size: clamp(22px, 4vw, 28px); font-weight: 500; margin: 0 0 12px; }
        .promo-deck { color: var(--ink-3); margin: 0 0 24px; font-size: 14px; }
        .promo-cta { display: inline-block; padding: 14px 36px; background: var(--ink); color: var(--paper); font-family: var(--font-mono); font-size: 12px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; text-decoration: none; transition: opacity 180ms; }
        .promo-cta:hover { opacity: 0.85; }
      `}} />
    </>
  );
}
