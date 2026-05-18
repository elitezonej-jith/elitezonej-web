"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export type HeroTile = {
  eyebrow: string;
  title: string;
  sub: string;
  cta: string;
  href: string;
  img: string;
  pos: string;
  veil: string;
};

const DEFAULT_TILES: HeroTile[] = [
  {
    eyebrow: "House · 2026",
    title: "Premium\nCollection",
    sub: "Discover our finest selection",
    cta: "Shop Now",
    href: "/collection?c=men",
    img: "/generated/_hero/premium.webp",
    pos: "center top",
    veil: "left",
  },
  {
    eyebrow: "New Arrivals",
    title: "New\nArrivals",
    sub: "Fresh styles for the season",
    cta: "Explore",
    href: "/collection?c=new",
    img: "/generated/_hero/new-arrivals.webp",
    pos: "center 25%",
    veil: "up",
  },
  {
    eyebrow: "Bespoke · Made-to-measure",
    title: "Made to\nMeasure",
    sub: "Tailored perfection",
    cta: "Customize",
    href: "/bespoke",
    img: "/generated/_hero/made-to-measure.webp",
    pos: "center center",
    veil: "right",
  },
];

const SLIDE_MS = 5000;
const RESUME_AFTER_MS = 8000;

export default function HeroGrid({ tiles = DEFAULT_TILES }: { tiles?: HeroTile[] }) {
  const TILES = tiles.length ? tiles : DEFAULT_TILES;
  const railRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0); // 0–1, fills active dot
  const interactedAt = useRef<number>(0);
  const inViewRef = useRef<boolean>(true);
  const visibleRef = useRef<boolean>(true);
  const userScrollingRef = useRef<boolean>(false);
  const programmaticScrollRef = useRef<boolean>(false);
  const isMobileRef = useRef<boolean>(false);
  const reducedMotionRef = useRef<boolean>(false);

  // Track which tile is centered in the rail (mobile carousel mode).
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const tiles = rail.querySelectorAll<HTMLAnchorElement>(".hg-tile");
      if (!tiles.length) return;
      const r = rail.getBoundingClientRect();
      const center = r.left + r.width / 2;
      let bestIdx = 0;
      let bestDist = Infinity;
      tiles.forEach((t, i) => {
        const tr = t.getBoundingClientRect();
        const c = tr.left + tr.width / 2;
        const d = Math.abs(c - center);
        if (d < bestDist) { bestDist = d; bestIdx = i; }
      });
      setActive(bestIdx);
    };

    const onScroll = () => {
      if (!programmaticScrollRef.current) {
        userScrollingRef.current = true;
        interactedAt.current = performance.now();
      }
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    update();
    rail.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      rail.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const goTo = useCallback((i: number, smooth = true) => {
    const rail = railRef.current;
    if (!rail) return;
    const tile = rail.querySelectorAll<HTMLAnchorElement>(".hg-tile")[i];
    if (!tile) return;
    programmaticScrollRef.current = true;
    tile.scrollIntoView({ behavior: smooth ? "smooth" : "auto", inline: "center", block: "nearest" });
    // Release the programmatic-flag after scroll settles
    window.setTimeout(() => { programmaticScrollRef.current = false; }, 700);
  }, []);

  const userInteract = useCallback(() => {
    interactedAt.current = performance.now();
  }, []);

  // Autoplay engine — runs only when carousel is mobile, in-view, tab visible,
  // user hasn't interacted recently, and reduced-motion is not set.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 720px)");
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    isMobileRef.current = mq.matches;
    reducedMotionRef.current = rm.matches;
    const onMq = () => { isMobileRef.current = mq.matches; };
    const onRm = () => { reducedMotionRef.current = rm.matches; };
    mq.addEventListener("change", onMq);
    rm.addEventListener("change", onRm);

    // Tab visibility
    const onVis = () => { visibleRef.current = !document.hidden; };
    document.addEventListener("visibilitychange", onVis);
    visibleRef.current = !document.hidden;

    // In-view detection on the section
    const sec = railRef.current?.parentElement ?? null;
    let io: IntersectionObserver | null = null;
    if (sec) {
      io = new IntersectionObserver(
        ([e]) => { inViewRef.current = e.isIntersecting && e.intersectionRatio > 0.35; },
        { threshold: [0, 0.35, 0.6, 1] }
      );
      io.observe(sec);
    }

    // Pause on direct rail interaction
    const rail = railRef.current;
    const onTouch = () => { interactedAt.current = performance.now(); };
    const onPointer = () => { interactedAt.current = performance.now(); };
    rail?.addEventListener("touchstart", onTouch, { passive: true });
    rail?.addEventListener("pointerdown", onPointer, { passive: true });

    // Driver: rAF loop computes progress; advances at SLIDE_MS
    let raf = 0;
    let last = performance.now();
    let acc = 0;

    const tick = (now: number) => {
      const dt = now - last;
      last = now;

      const canPlay =
        isMobileRef.current &&
        !reducedMotionRef.current &&
        inViewRef.current &&
        visibleRef.current &&
        (now - interactedAt.current > RESUME_AFTER_MS) &&
        !userScrollingRef.current;

      if (canPlay) {
        acc += dt;
        const pct = Math.min(1, acc / SLIDE_MS);
        setProgress(pct);
        if (acc >= SLIDE_MS) {
          acc = 0;
          setProgress(0);
          // advance
          setActive(prev => {
            const next = (prev + 1) % TILES.length;
            goTo(next);
            return prev; // active is updated by scroll-listener; keep state coherent
          });
        }
      } else {
        // not playing — reset progress unless mid-slide
        if (progress !== 0) setProgress(0);
        acc = 0;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // Mark user-scrolling false shortly after the rail goes quiet
    let scrollIdleTimer: number | undefined;
    const onScrollEnd = () => {
      if (scrollIdleTimer) window.clearTimeout(scrollIdleTimer);
      scrollIdleTimer = window.setTimeout(() => {
        userScrollingRef.current = false;
      }, 250);
    };
    rail?.addEventListener("scroll", onScrollEnd, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      mq.removeEventListener("change", onMq);
      rm.removeEventListener("change", onRm);
      document.removeEventListener("visibilitychange", onVis);
      io?.disconnect();
      rail?.removeEventListener("touchstart", onTouch);
      rail?.removeEventListener("pointerdown", onPointer);
      rail?.removeEventListener("scroll", onScrollEnd);
      if (scrollIdleTimer) window.clearTimeout(scrollIdleTimer);
    };
    // We deliberately exclude `progress` from deps so the rAF doesn't restart
    // each frame; it reads progress via closure and that's fine here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goTo]);

  return (
    <section className="hg" aria-label="Featured collections">
      <div className="hg-grain" aria-hidden="true" />
      <div className="hg-rail" ref={railRef}>
        {TILES.map((t, i) => (
          <Link
            key={t.title}
            href={t.href}
            className={`hg-tile hg-tile-${i + 1}`}
            aria-label={`${t.title.replace("\n", " ")} — ${t.sub}`}
            style={{ ["--idx" as string]: i }}
          >
            <div
              className="hg-img"
              role="img"
              aria-hidden="true"
              style={{ backgroundImage: `url(${t.img})`, backgroundPosition: t.pos }}
            />
            <div className={`hg-veil hg-veil-${t.veil}`} aria-hidden="true" />
            <div className="hg-shade" aria-hidden="true" />
            <div className="hg-copy">
              <span className="hg-eyebrow">{t.eyebrow}</span>
              <h2 className="hg-title">{t.title}</h2>
              <span className="hg-rule" aria-hidden="true" />
              <p className="hg-sub">{t.sub}</p>
              <span className="hg-cta">
                <span className="hg-cta-label">{t.cta}</span>
                <span className="hg-cta-arrow" aria-hidden="true">→</span>
                <span className="hg-cta-line" aria-hidden="true" />
              </span>
            </div>
            <span className="hg-foot-rule" aria-hidden="true" />
          </Link>
        ))}
      </div>
      <div className="hg-dots" role="tablist" aria-label="Slide navigation">
        {TILES.map((t, i) => (
          <button
            key={t.title}
            type="button"
            role="tab"
            aria-selected={active === i}
            aria-label={`Go to ${t.title.replace("\n", " ")}`}
            data-active={active === i}
            className="hg-dot"
            style={active === i ? { ["--p" as string]: progress } : undefined}
            onClick={() => { userInteract(); goTo(i); }}
          >
            <span className="hg-dot-track" aria-hidden="true">
              <span className="hg-dot-fill" aria-hidden="true" />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
