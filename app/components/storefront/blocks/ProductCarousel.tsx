import CarouselShowcase from "../../CarouselShowcase";
import { listProductsForPage } from "@/lib/storefront/catalogue";

// Renders the real <CarouselShowcase> ("New In" / "Festive Edit" / "Premium" side-heading
// product row) from the LIVE DB catalogue with gender/category/premium/limit semantics.
export default async function ProductCarousel({
  title,
  ctaLabel,
  ctaHref,
  headingSide,
  gender,
  category,
  premium,
  limit,
}: {
  title: string;
  ctaLabel?: string;
  ctaHref: string;
  headingSide?: "left" | "right";
  gender?: string;
  category?: string;
  premium?: boolean;
  limit?: number;
}) {
  let products = await listProductsForPage();
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
