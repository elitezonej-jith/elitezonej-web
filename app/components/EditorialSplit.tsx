"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ProductCard from "./ProductCard";
import type { ComponentProps } from "react";

type Product = ComponentProps<typeof ProductCard>["p"];

type Props = {
  title: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
  imageMobile?: string;
  imageAlt: string;
  imageSide?: "left" | "right";
  products: Product[];
};

export default function EditorialSplit({
  title,
  ctaLabel,
  ctaHref,
  image,
  imageMobile,
  imageAlt,
  imageSide = "left",
  products,
}: Props) {
  const imgRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;

    // If the image is already in or past the viewport on mount (e.g. user
    // refreshed mid-page), reveal immediately — no point animating something
    // they've already seen.
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) {
      setRevealed(true);
      return;
    }

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setRevealed(true);
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(el);

    // Safety net: if for some reason IO never fires (browser quirks,
    // detached frames, etc.), fall back to revealed after 4s so the image
    // is never permanently stuck.
    const safety = window.setTimeout(() => setRevealed(true), 4000);

    return () => {
      io.disconnect();
      window.clearTimeout(safety);
    };
  }, []);

  return (
    <section className={`ed-split ed-split--${imageSide}`}>
      <div
        ref={imgRef}
        className={`ed-split-img${revealed ? " in-view" : ""}${imageMobile ? " ed-split-img--has-mobile" : ""}`}
        role="img"
        aria-label={imageAlt}
        style={{ backgroundImage: `url(${image})`, ["--ed-img-m" as string]: imageMobile ? `url(${imageMobile})` : undefined }}
      >
        <div className="ed-split-overlay">
          <h2>{title}</h2>
          <Link className="btn btn-primary" href={ctaHref}>{ctaLabel}</Link>
        </div>
      </div>
      <div className="ed-split-grid">
        {products.slice(0, 6).map(p => (
          <ProductCard key={p.slug} p={p} />
        ))}
      </div>
    </section>
  );
}
