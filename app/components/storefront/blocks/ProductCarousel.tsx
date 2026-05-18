import CarouselShowcase from "../../CarouselShowcase";
import { PRODUCTS } from "@/lib/products";

// Byte-parity wrapper: renders the real <CarouselShowcase> (the "New In" /
// "Festive Edit" side-heading product row) using the same static catalog and
// filter the original homepage used: PRODUCTS.filter(gender).slice(0, limit).
export default function ProductCarousel({
  title,
  ctaLabel,
  ctaHref,
  headingSide,
  gender,
  category,
  limit,
}: {
  title: string;
  ctaLabel?: string;
  ctaHref: string;
  headingSide?: "left" | "right";
  gender?: string;
  category?: string;
  limit?: number;
}) {
  let products = PRODUCTS;
  if (gender) products = products.filter((p) => p.gender === gender);
  if (category) products = products.filter((p) => p.category === category);
  const sliced = products.slice(0, limit ?? 6);
  if (!sliced.length) return null;
  return (
    <CarouselShowcase
      title={title}
      ctaLabel={ctaLabel}
      ctaHref={ctaHref}
      products={sliced}
      headingSide={headingSide}
    />
  );
}
