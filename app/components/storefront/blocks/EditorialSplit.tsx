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
  allProducts: LegacyProduct[];
}) {
  let products = allProducts;
  if (gender) products = products.filter((p) => p.gender === gender);
  if (occasion) products = products.filter((p) => p.occasion === occasion);
  if (category) products = products.filter((p) => p.category === category);
  const sliced = products.slice(0, limit ?? 6);
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
