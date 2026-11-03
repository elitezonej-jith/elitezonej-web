import Link from "next/link";
import ProductCard from "./ProductCard";
import type { ComponentProps } from "react";

type Product = ComponentProps<typeof ProductCard>["p"];

type Props = {
  title: string;
  ctaLabel?: string;
  ctaHref: string;
  products: Product[];
  headingSide?: "left" | "right";
};

// Side-heading horizontal product row. Disturbia pattern from
// "New In" and "Women's Swimwear" sections (audit y=760, y=3286).
// Heading panel takes ~14% width; products flow horizontally with
// overflow-x:auto on narrow viewports.
export default function CarouselShowcase({
  title,
  ctaLabel = "View All Products",
  ctaHref,
  products,
  headingSide = "left",
}: Props) {
  return (
    <section className={`carousel-showcase carousel-showcase--${headingSide}`}>
      <aside className="carousel-heading">
        <h2>{title}</h2>
        <Link className="btn btn-primary" href={ctaHref}>{ctaLabel}</Link>
      </aside>
      <div className="carousel-track" role="list">
        {products.slice(0, 6).map((p) => (
          <div key={p.slug} className="carousel-cell" role="listitem">
            {/* Not priority: carousels sit below the full-screen hero, and
                marking 3 cards per carousel as priority made them preload
                ahead of the hero image (the page's LCP). */}
            <ProductCard p={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
