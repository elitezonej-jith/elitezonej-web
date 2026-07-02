import EditorialSplitView from "../../EditorialSplit";
import type { Product as LegacyProduct } from "@/lib/products";

// Renders <EditorialSplit> using pre-fetched products passed from
// HomepageRenderer (eliminates the N+1 — one fetch for the entire homepage).
export default function EditorialSplit({
  title,
  ctaLabel,
  ctaHref,
  image,
  imageMobile,
  imageAlt,
  imageSide,
  gender,
  occasion,
  category,
  limit,
  pinnedSlugs,
  allProducts,
}: {
  title: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
  imageMobile?: string;
  imageAlt: string;
  imageSide?: "left" | "right";
  gender?: string;
  occasion?: string;
  category?: string;
  limit?: number;
  pinnedSlugs?: string[];
  allProducts: LegacyProduct[];
}) {
  const max = limit ?? 6;

  let filtered = allProducts;
  if (gender) filtered = filtered.filter((p) => p.gender === gender);
  if (occasion) filtered = filtered.filter((p) => p.occasion === occasion);
  if (category) filtered = filtered.filter((p) => p.category === category);

  let sliced: LegacyProduct[];
  if (pinnedSlugs?.length) {
    const pinned = pinnedSlugs
      .map((s) => allProducts.find((p) => p.slug === s))
      .filter((p): p is LegacyProduct => !!p);
    const pinnedSet = new Set(pinnedSlugs);
    const backfill = filtered.filter((p) => !pinnedSet.has(p.slug));
    sliced = [...pinned, ...backfill].slice(0, max);
  } else {
    sliced = filtered.slice(0, max);
  }

  return (
    <EditorialSplitView
      title={title}
      ctaLabel={ctaLabel}
      ctaHref={ctaHref}
      image={image}
      imageMobile={imageMobile}
      imageAlt={imageAlt}
      imageSide={imageSide}
      products={sliced}
    />
  );
}
