"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const SLIDES = [
  {
    img: "/generated/_sections/hero.webp",
    imgPos: "25% 20%",
    eyebrow: "Spring · Summer 2026",
    // Fallback copy only — HeroBanner.tsx is not currently rendered (homepage is
    // DB-driven via HomepageRenderer + FullBanner). Lead time should match the
    // admin "lead_time_days" setting when this component is re-enabled.
    h1: "Made for you\nin 7 days",
    cta: "Shop New",
    href: "/collection?c=men",
  },
  {
    img: "/generated/_sections/atelier.webp",
    imgPos: "50% 35%",
    eyebrow: "Bespoke · Made-to-measure",
    h1: "Your measurements.\nOur craft.",
    cta: "Book a Fitting",
    href: "/bespoke",
  },
  {
    img: "/generated/_sections/hero-sale.webp",
    imgPos: "50% 10%",
    eyebrow: "Sale · Up to 50% off",
    h1: "Season's finest,\nnow reduced",
    cta: "Shop Sale",
    href: "/collection?c=festive",
  },
];

const CSS = `
.hb { position: relative; min-height: 80vh; overflow: hidden; border-bottom: var(--rule); }
.hb-track { display: flex; height: 100%; transition: transform 700ms cubic-bezier(.645,.045,.355,1); }
.hb-slide { flex: 0 0 100%; min-height: 80vh; position: relative; }
.hb-img {
  position: absolute; inset: 0;
  background-size: cover;
}
.hb-img::after {
  content: "";
  position: absolute; inset: 0;
  background: linear-gradient(90deg, rgba(0,0,0,0) 20%, rgba(0,0,0,.22) 55%, rgba(0,0,0,.65) 100%);
}
.hb-overlay {
  position: relative; z-index: 2;
  max-width: 1440px; margin: 0 auto; height: 100%;
  display: flex; flex-direction: column; justify-content: center;
  align-items: flex-end;
  padding: 80px 64px;
  min-height: 80vh;
}
.hb-eyebrow {
  font-family: var(--font-body);
  font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
  color: #ffffff; margin-bottom: 16px;
}
.hb-h1 {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(36px, 5vw, 64px);
  line-height: 1.1; letter-spacing: -0.005em;
  color: #ffffff;
  text-align: right; margin: 0 0 32px;
  max-width: 520px;
  white-space: pre-line;
}
.hb-cta {
  color: var(--ink) !important;
  border-color: #ffffff !important;
  padding: 16px 36px;
  font-size: 13px;
}
.hb-cta::before { background: #ffffff !important; }
.hb-cta:hover { color: #ffffff !important; }

.hb-arrow {
  position: absolute; top: 50%; z-index: 10;
  transform: translateY(-50%);
  width: 48px; height: 48px;
  border: 1px solid rgba(255,255,255,0.45);
  background: transparent;
  color: #ffffff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: background 200ms;
}
.hb-arrow:hover { background: rgba(255,255,255,0.15); }
.hb-prev { left: 24px; }
.hb-next { right: 24px; }

.hb-dots {
  position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 8px; z-index: 10;
}
.hb-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: rgba(255,255,255,0.35);
  border: 0; cursor: pointer; padding: 0;
  transition: background 300ms, transform 300ms;
}
.hb-dot.on { background: #ffffff; transform: scale(1.35); }

@media (max-width: 900px) {
  .hb { min-height: 70vh; }
  .hb-slide { min-height: 70vh; }
  .hb-overlay { align-items: center; padding: 32px 16px; min-height: 70vh; }
  .hb-h1 { text-align: center; }
  .hb-img::after {
    background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.4) 100%);
  }
  .hb-prev { left: 12px; }
  .hb-next { right: 12px; }
}
@media (prefers-reduced-motion: reduce) {
  .hb-track { transition: none; }
}
`;

export default function HeroBanner() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const prev = useCallback(() => setIdx(i => (i - 1 + SLIDES.length) % SLIDES.length), []);
  const next = useCallback(() => setIdx(i => (i + 1) % SLIDES.length), []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [next, paused, reducedMotion]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <section
        className="hb"
        role="banner"
        aria-label="Hero banner"
        aria-roledescription="carousel"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <div className="hb-track" style={{ transform: `translateX(-${idx * 100}%)` }}>
          {SLIDES.map((s, i) => (
            <div key={i} className="hb-slide">
              <div
                className="hb-img"
                aria-hidden="true"
                style={{ backgroundImage: `url(${s.img})`, backgroundPosition: s.imgPos }}
              />
              <div className="hb-overlay">
                <div className="hb-eyebrow">{s.eyebrow}</div>
                <h1 className="hb-h1">{s.h1}</h1>
                <Link className="btn btn-primary hb-cta" href={s.href}>{s.cta}</Link>
              </div>
            </div>
          ))}
        </div>

        <button className="hb-arrow hb-prev" onClick={prev} aria-label="Previous slide">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button className="hb-arrow hb-next" onClick={next} aria-label="Next slide">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        <div className="hb-dots" role="tablist" aria-label="Slide indicators">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`hb-dot${i === idx ? " on" : ""}`}
              onClick={() => setIdx(i)}
              role="tab"
              aria-selected={i === idx}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
          {!reducedMotion && (
            <button
              type="button"
              className="hb-dot"
              onClick={() => setPaused(p => !p)}
              aria-pressed={paused}
              aria-label={paused ? "Play slideshow" : "Pause slideshow"}
              style={{ width: "auto", borderRadius: 999, padding: "2px 10px", fontSize: 10, letterSpacing: "0.1em", color: "#fff" }}
            >
              {paused ? "▶" : "❚❚"}
            </button>
          )}
        </div>
      </section>
    </>
  );
}
