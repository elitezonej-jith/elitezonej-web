"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { NAV } from "./nav-data";
import { useModalA11y } from "./useModalA11y";

// Hamburger glyph — three hairlines morph to an X via stroke transforms
function HamburgerGlyph({ open }: { open: boolean }) {
  return (
    <svg
      className="hb-svg"
      data-open={open}
      viewBox="0 0 28 22"
      width="22"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="square"
      aria-hidden="true"
    >
      <line className="hb-top" x1="2"  y1="4"  x2="22" y2="4"  />
      <line className="hb-mid" x1="6"  y1="11" x2="26" y2="11" />
      <line className="hb-bot" x1="2"  y1="18" x2="22" y2="18" />
    </svg>
  );
}

// Down-chevron — rotates 180° when its container is open
function ChevronDown() {
  return (
    <svg viewBox="0 0 18 18" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7 L9 12 L14 7" />
    </svg>
  );
}

// Right-arrow used on shop-all CTA and atelier card
function ArrowRight() {
  return (
    <svg viewBox="0 0 24 16" width="20" height="13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 8 H20" />
      <path d="M14 3 L20 8 L14 13" />
    </svg>
  );
}

// Close — typographic X
function CloseGlyph() {
  return (
    <svg viewBox="0 0 22 22" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
      <path d="M4 4 L18 18" />
      <path d="M18 4 L4 18" />
    </svg>
  );
}

function GlyphAccount() {
  return (
    <svg viewBox="0 0 22 22" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="8" r="3.5" />
      <path d="M3 19c1.5-3.5 5-5.5 8-5.5s6.5 2 8 5.5" />
    </svg>
  );
}
function GlyphHeart() {
  return (
    <svg viewBox="0 0 22 22" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 18s-7-4.2-7-9.2A4 4 0 0 1 11 6a4 4 0 0 1 7 2.8c0 5-7 9.2-7 9.2z" />
    </svg>
  );
}
function GlyphBag() {
  return (
    <svg viewBox="0 0 22 22" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 7h12l-1 12H6L5 7z" />
      <path d="M8 7V5a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const [openCats, setOpenCats] = useState<Set<number>>(new Set());

  const close = useCallback(() => setOpen(false), []);
  const drawerRef = useModalA11y<HTMLElement>(open, close);

  // Reset accordion state when drawer closes (so next open starts collapsed)
  useEffect(() => {
    if (!open) setOpenCats(new Set());
  }, [open]);

  const toggleCat = (idx: number) => {
    setOpenCats(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <>
      <button
        className="hamburger"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
      >
        <HamburgerGlyph open={open} />
      </button>

      <div
        className="mobile-backdrop"
        data-open={open}
        aria-hidden="true"
        onClick={close}
      />

      <nav ref={drawerRef} className="mobile-drawer" data-open={open} inert={!open} role="dialog" aria-modal="true" aria-label="Main menu" tabIndex={-1}>
        <div className="mobile-drawer__head">
          <span className="mobile-drawer__title">
            <span className="mobile-drawer__title-rule" aria-hidden="true" />
            <span>Menu</span>
            <span className="mobile-drawer__title-dot" aria-hidden="true" />
          </span>
          <button className="mobile-drawer__close" aria-label="Close menu" onClick={close}>
            <CloseGlyph />
          </button>
        </div>

        <div className="mobile-drawer__scroll">
          <ul className="mobile-drawer__list">
            {NAV.map((cat, i) => {
              const isOpen = openCats.has(i);
              if (!cat.groups) {
                // Flat link — no expansion
                return (
                  <li key={cat.label} className="mobile-drawer__cat mobile-drawer__cat--flat">
                    <Link href={cat.href} onClick={close} className="mobile-drawer__row">
                      <span className={`mobile-drawer__row-label ${cat.sale ? "is-sale" : ""}`}>
                        {cat.label}
                      </span>
                      <span className="mobile-drawer__row-arrow" aria-hidden="true"><ArrowRight /></span>
                    </Link>
                  </li>
                );
              }
              return (
                <li
                  key={cat.label}
                  className="mobile-drawer__cat"
                  data-open={isOpen}
                >
                  <button
                    className="mobile-drawer__row"
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`mn-panel-${i}`}
                    onClick={() => toggleCat(i)}
                  >
                    <span className="mobile-drawer__row-label">{cat.label}</span>
                    <span className="mobile-drawer__row-chev" aria-hidden="true">
                      <ChevronDown />
                    </span>
                  </button>

                  <div
                    id={`mn-panel-${i}`}
                    className="mobile-drawer__panel"
                    role="region"
                    aria-label={`${cat.label} categories`}
                  >
                    <div className="mobile-drawer__panel-inner">
                      <Link
                        href={cat.href}
                        onClick={close}
                        className="mobile-drawer__shopall"
                      >
                        <span>Shop all {cat.label}</span>
                        <ArrowRight />
                      </Link>
                      {cat.groups.map((g) => (
                        <div key={g.title} className="mobile-drawer__sub">
                          <span className="mobile-drawer__sub-eyebrow" aria-hidden="true">
                            <span className="mobile-drawer__sub-rule" />
                            {g.title}
                            <span className="mobile-drawer__sub-rule" />
                          </span>
                          <ul>
                            {g.items.map((it) => (
                              <li key={it.href}>
                                <Link href={it.href} onClick={close}>
                                  {it.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <Link href="/bespoke" onClick={close} className="mobile-drawer__atelier">
            <div
              className="mobile-drawer__atelier-img"
              aria-hidden="true"
              style={{ backgroundImage: "url(/generated/_sections/atelier.webp)" }}
            />
            <div className="mobile-drawer__atelier-copy">
              <span className="mobile-drawer__atelier-ix">Inside the studio</span>
              <h4>The atelier, in detail</h4>
              <p>How a piece moves from sketch to fitting room.</p>
              <span className="mobile-drawer__atelier-cta">Read the story <ArrowRight /></span>
            </div>
          </Link>
        </div>

        <div className="mobile-drawer__tail">
          <Link href="/account" onClick={close} className="mobile-drawer__tail-row">
            <GlyphAccount /> <span>My Account</span>
          </Link>
          <Link href="/wishlist" onClick={close} className="mobile-drawer__tail-row">
            <GlyphHeart /> <span>Wishlist</span>
          </Link>
          <Link href="/cart" onClick={close} className="mobile-drawer__tail-row">
            <GlyphBag /> <span>Bag</span>
          </Link>
          <span className="mobile-drawer__region">India · INR ₹</span>
        </div>
      </nav>
    </>
  );
}
