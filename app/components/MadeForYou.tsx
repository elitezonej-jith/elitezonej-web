"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";

export type MadeForYouItem = {
  href: string;
  photo: string;
  alt: string;
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
};

const DEFAULT_ITEMS: MadeForYouItem[] = [
  {
    href: "/bespoke",
    photo: "mfy-1",
    alt: "Master tailor measuring a client",
    eyebrow: "Bespoke",
    title: "The Bespoke Suit",
    body: "Three fittings, paper pattern drafted to your figure, four to six weeks. From ₹45,000.",
    cta: "Begin your suit",
  },
  {
    href: "/bespoke",
    photo: "mfy-2",
    alt: "Festive sherwani in silk",
    eyebrow: "Made to measure",
    title: "Custom Sherwani",
    body: "Choose your cloth, lining, collar, and length. Festive-ready in seven days. From ₹28,000.",
    cta: "Configure yours",
  },
  {
    href: "/bespoke",
    photo: "mfy-3",
    alt: "Tailored shirt detail",
    eyebrow: "Made to measure",
    title: "Tailored Shirts",
    body: "Premium cotton, poplin, and linen. Cut to your measurements, delivered in five days. From ₹2,800.",
    cta: "Order yours",
  },
];

const SLIDE_MS = 5000;
const RESUME_AFTER_MS = 8000;

export default function MadeForYou({
  items,
  heading = "Made for you",
  meta = "Section · 01",
}: {
  items?: MadeForYouItem[];
  heading?: string;
  meta?: string;
}) {
  const ITEMS = items && items.length ? items : DEFAULT_ITEMS;
  const railRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const interactedAt = useRef<number>(0);
  const inViewRef = useRef<boolean>(false);
  const visibleRef = useRef<boolean>(true);
  const userScrollingRef = useRef<boolean>(false);
  const programmaticScrollRef = useRef<boolean>(false);
  const isMobileRef = useRef<boolean>(false);
  const reducedMotionRef = useRef<boolean>(false);

  // Track which card is centered in the rail (mobile carousel mode).
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const cards = rail.querySelectorAll<HTMLElement>(".mfy-card");
      if (!cards.length) return;
      const r = rail.getBoundingClientRect();
      const center = r.left + r.width / 2;
      let bestIdx = 0;
      let bestDist = Infinity;
      cards.forEach((c, i) => {
        const cr = c.getBoundingClientRect();
        const cc = cr.left + cr.width / 2;
        const d = Math.abs(cc - center);
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

    const mq = window.matchMedia("(max-width: 720px)");
    isMobileRef.current = mq.matches;
    setIsMobile(mq.matches);
    const onMq = () => {
      isMobileRef.current = mq.matches;
      setIsMobile(mq.matches);
    };
    mq.addEventListener("change", onMq);

    update();
    rail.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      rail.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      mq.removeEventListener("change", onMq);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const goTo = useCallback((i: number, smooth = true) => {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelectorAll<HTMLElement>(".mfy-card")[i];
    if (!card) return;
    programmaticScrollRef.current = true;
    card.scrollIntoView({ behavior: smooth ? "smooth" : "auto", inline: "center", block: "nearest" });
    window.setTimeout(() => { programmaticScrollRef.current = false; }, 700);
  }, []);

  const userInteract = useCallback(() => {
    interactedAt.current = performance.now();
  }, []);

  // Autoplay engine — only when mobile, in-view, tab visible, and idle.
  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = rm.matches;
    const onRm = () => { reducedMotionRef.current = rm.matches; };
    rm.addEventListener("change", onRm);

    const onVis = () => { visibleRef.current = !document.hidden; };
    document.addEventListener("visibilitychange", onVis);
    visibleRef.current = !document.hidden;

    const sec = railRef.current?.closest("section") ?? null;
    let io: IntersectionObserver | null = null;
    if (sec) {
      io = new IntersectionObserver(
        ([e]) => { inViewRef.current = e.isIntersecting && e.intersectionRatio > 0.4; },
        { threshold: [0, 0.4, 0.7, 1] }
      );
      io.observe(sec);
    }

    const rail = railRef.current;
    const onTouch = () => { interactedAt.current = performance.now(); };
    rail?.addEventListener("touchstart", onTouch, { passive: true });
    rail?.addEventListener("pointerdown", onTouch, { passive: true });
    rail?.addEventListener("mouseenter", onTouch, { passive: true });

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
          setActive(prev => {
            const next = (prev + 1) % ITEMS.length;
            goTo(next);
            return prev;
          });
        }
      } else {
        if (progress !== 0) setProgress(0);
        acc = 0;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

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
      rm.removeEventListener("change", onRm);
      document.removeEventListener("visibilitychange", onVis);
      io?.disconnect();
      rail?.removeEventListener("touchstart", onTouch);
      rail?.removeEventListener("pointerdown", onTouch);
      rail?.removeEventListener("mouseenter", onTouch);
      rail?.removeEventListener("scroll", onScrollEnd);
      if (scrollIdleTimer) window.clearTimeout(scrollIdleTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goTo]);

  return (
    <section className="mfy">
      <div className="container mfy-container">
        <div className="sec-head">
          <Reveal as="h2" className="t-display-lg">{heading}</Reveal>
          <span className="meta t-mono-xs">{meta}</span>
        </div>

        <div className="grid mfy-rail" ref={railRef} role="region" aria-roledescription="carousel" aria-label="Made for you services">
          {ITEMS.map((it, i) => (
            <Reveal
              key={it.title}
              delay={(i + 1) as 0 | 1 | 2 | 3}
              className="mfy-card-wrap"
            >
              <Link className="card mfy-card" href={it.href} aria-roledescription="slide" aria-label={`${i + 1} of ${ITEMS.length}: ${it.title}`}>
                <div className={`photo ${it.photo}`} role="img" aria-label={it.alt} />
                <div className="body">
                  <span className="ix">{it.eyebrow}</span>
                  <h3>{it.title}</h3>
                  <p className="t-body">{it.body}</p>
                  <span className="arrow">{it.cta} <span aria-hidden="true">→</span></span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        <div className="mfy-dots" role="tablist" aria-label="Carousel pagination" aria-hidden={!isMobile}>
          {ITEMS.map((it, i) => (
            <button
              key={it.title}
              type="button"
              role="tab"
              aria-selected={active === i}
              aria-controls={`mfy-card-${i}`}
              aria-label={`Go to slide ${i + 1}: ${it.title}`}
              data-active={active === i}
              className="mfy-dot"
              style={active === i ? { ["--p" as string]: progress } : undefined}
              onClick={() => { userInteract(); goTo(i); }}
            >
              <span className="mfy-dot-track" aria-hidden="true">
                <span className="mfy-dot-fill" aria-hidden="true" />
              </span>
              <span className="mfy-dot-num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
