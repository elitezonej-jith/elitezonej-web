"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Product } from "@/lib/products";
import { fmtINR } from "@/lib/format";
import WishlistButton from "./WishlistButton";
import QuickAddButton from "./QuickAddButton";

const FALLBACK_VARIANTS = ["01-front", "02-overview", "05-detail"] as const;
const CLS = ["primary", "alt", "alt-2"] as const;

const SLIDE_MS = 3500;

export default function ProductCard({ p, priority = false }: { p: Product; priority?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // Prefer uploaded images (product_images via Studio); fall back to the
  // legacy /generated/<slug>/<angle>.webp filesystem layout when none exist.
  const uploaded = p.images ?? [];
  const cardSrcs: string[] = uploaded.length > 0
    ? uploaded.slice(0, 3)
    : FALLBACK_VARIANTS.map((s) => `/generated/${p.slug}/${s}.webp`);
  const VARIANTS = cardSrcs.map((src, i) => ({
    src,
    cls: CLS[i] ?? "alt-2",
  }));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window === "undefined") return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    if (reduced || !isTouch) return;

    // Stable per-card start offset derived from slug — neighbours don't
    // crossfade in lockstep, page reads as a quiet, breathing rhythm.
    const hash = p.slug.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const startIdx = hash % VARIANTS.length;
    setActive(startIdx);

    const inViewRef = { current: false };
    const visibleRef = { current: !document.hidden };

    const io = new IntersectionObserver(
      ([e]) => {
        inViewRef.current = e.isIntersecting && e.intersectionRatio > 0.25;
      },
      { threshold: [0, 0.25, 0.5, 1] }
    );
    io.observe(el);

    const onVis = () => { visibleRef.current = !document.hidden; };
    document.addEventListener("visibilitychange", onVis);

    let raf = 0;
    let last = performance.now();
    // Offset the starting accumulator so each card lands its first
    // crossfade at a slightly different time even after sync-pause/resume.
    let acc = (hash % SLIDE_MS);

    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      if (inViewRef.current && visibleRef.current) {
        acc += dt;
        const pct = Math.min(1, (acc % SLIDE_MS) / SLIDE_MS);
        // Write progress directly to a CSS var — avoids 60fps React re-renders.
        el.style.setProperty("--p", String(pct));
        if (acc >= SLIDE_MS) {
          acc = 0;
          el.style.setProperty("--p", "0");
          setActive(prev => (prev + 1) % VARIANTS.length);
        }
      } else {
        el.style.setProperty("--p", "0");
        acc = 0;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [p.slug]);

  return (
    <div className="pcard qa-host" ref={ref} data-active={active}>
      <div className="plate">
        <Link href={`/products/${p.slug}`} aria-label={p.name}>
          {VARIANTS.map((v, i) => (
            <Image
              key={`${v.src}-${i}`}
              className={v.cls}
              src={v.src}
              alt={i === 0 ? p.name : ""}
              fill
              sizes="(max-width: 720px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={priority && i === 0}
              loading={priority && i === 0 ? "eager" : "lazy"}
            />
          ))}
        </Link>
        {(p.badge || p.salePrice) && (
          <div className="badge-stack">
            {p.salePrice && <span className="badge badge-sale t-mono-xs">Sale</span>}
            {p.badge && p.badge !== "Sale" && <span className="badge badge-new t-mono-xs">{p.badge}</span>}
          </div>
        )}
        <WishlistButton slug={p.slug} name={p.name} />
        <QuickAddButton product={p} />
        {/* Mobile-only autoplay progress hairline — width driven by --p (0–1).
            Hidden on desktop and when reduced-motion is set (CSS). */}
        <span className="pcard-progress" aria-hidden="true" />
      </div>
      <Link href={`/products/${p.slug}`} className="meta-link">
        <div className="meta">
          <h3 className="name">{p.name}</h3>
          <div className="row">
            {p.salePrice ? (
              <span className="price-group">
                <span className="price price-sale">{fmtINR(p.salePrice)}</span>
                <span className="price price-orig">{fmtINR(p.price)}</span>
              </span>
            ) : (
              <span className="price">{fmtINR(p.price)}</span>
            )}
            <span className="tag">{p.fabric} · {p.fit}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
