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
  pinnedSlugs,
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
  pinnedSlugs?: string[];
  allProducts: LegacyProduct[];
}) {
  const max = limit ?? 6;

  let filtered = allProducts;
  if (premium) filtered = filtered.filter((p) => p.isPremium);
  if (gender) filtered = filtered.filter((p) => p.gender === gender);
  if (category) filtered = filtered.filter((p) => p.category === category);

  let sliced: LegacyProduct[];
  if (pinnedSlugs?.length) {
    // Resolve pinned slugs in order, skip missing
    const pinned = pinnedSlugs
      .map((s) => allProducts.find((p) => p.slug === s))
      .filter((p): p is LegacyProduct => !!p);
    const pinnedSet = new Set(pinnedSlugs);
    const backfill = filtered.filter((p) => !pinnedSet.has(p.slug));
    sliced = [...pinned, ...backfill].slice(0, max);
  } else {
    sliced = filtered.slice(0, max);
  }

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
