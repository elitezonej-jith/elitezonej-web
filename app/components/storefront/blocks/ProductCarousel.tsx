import CarouselShowcase from "../../CarouselShowcase";
import type { Product as LegacyProduct } from "@/lib/products";

// Renders <CarouselShowcase> using pre-fetched products passed from
// HomepageRenderer (eliminates the N+1 — one fetch for the entire homepage).
export default function ProductCarousel({
  title,
  ctaLabel,
  ctaHref,
  headingSide,
  gender,
  category,
  premium,
  limit,
  allProducts,
}: {
  title: string;
  ctaLabel?: string;
  ctaHref: string;
  headingSide?: "left" | "right";
  gender?: string;
  category?: string;
  premium?: boolean;
  limit?: number;
  allProducts: LegacyProduct[];
}) {
  let products = allProducts;
  if (premium) products = products.filter((p) => p.isPremium);
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
