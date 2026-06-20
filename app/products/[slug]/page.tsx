import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import TrustStrip from "../../components/TrustStrip";
import ProductPageClient from "./ProductPageClient";
import { getProductForPage } from "@/lib/storefront/product-for-page";
import { listProductsForPage } from "@/lib/storefront/catalogue";
import { getSiteSettings } from "@/lib/storefront/site-settings";
import {
  getAggregateForProduct,
  listForProduct,
  hasCustomerPurchased,
  hasExistingReview,
} from "@/lib/admin/repos/product-reviews";
import { getCurrentCustomer } from "@/lib/storefront/session";

// HEADER_CSS removed: the legacy block hard-coded the cream/oxblood
// header/footer/trust-strip from the original tailoring brand, which
// conflicted with the new disturbia.css theme. Header/Footer/TrustStrip
// components now style themselves via globals.css + disturbia.css.

// Temporarily force-dynamic: Vercel build can't reach Neon to prerender ISR.
export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductForPage(slug);
  if (!product) notFound();

  const aggregate = await getAggregateForProduct(slug);
  const reviews = await listForProduct(slug, "approved");
  const me = await getCurrentCustomer();

  // Determine review eligibility
  let canWrite = false;
  let reviewState: "anon" | "not_purchased" | "already_reviewed" | "can_write" = "anon";
  if (me) {
    const [purchased, alreadyReviewed] = await Promise.all([
      hasCustomerPurchased(me.id, slug),
      hasExistingReview(me.id, slug),
    ]);
    if (alreadyReviewed) reviewState = "already_reviewed";
    else if (!purchased) reviewState = "not_purchased";
    else { reviewState = "can_write"; canWrite = true; }
  }

  // Schema.org Product structured data — eligible for rich results in
  // Google search (price, availability, ratings). Fabrics don't have
  // per-slug photography, so fall back to the cloth library image.
  const ldImage = product.kind === "fabric"
    ? ["/generated/_sections/process-cloth.webp"]
    : [`/generated/${slug}/01-front.webp`, `/generated/${slug}/02-overview.webp`];
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: ldImage,
    description: product.description ?? product.line,
    brand: { "@type": "Brand", name: "Elite Zone J" },
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: product.price,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };
  // Only add AggregateRating when there's at least one approved review;
  // Google rejects fake/empty AggregateRating in structured data.
  if (aggregate.count > 0) {
    ld.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: aggregate.avg.toFixed(1),
      reviewCount: aggregate.count,
    };
  }

  const related = (await listProductsForPage()).filter((p) => p.slug !== slug).slice(0, 3);
  const { leadTimeDays } = await getSiteSettings();

  return (
    <>
      <script
        type="application/ld+json"
        // Escape against </script> breakout (and HTML-comment / ampersand
        // injection) before inlining the serialized JSON-LD.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(ld)
            .replace(/</g, "\\u003c")
            .replace(/>/g, "\\u003e")
            .replace(/&/g, "\\u0026"),
        }}
      />
      <Header />
      <main>
        <ProductPageClient
          product={product}
          related={related}
          leadTimeDays={leadTimeDays}
          reviews={reviews}
          reviewAggregate={aggregate}
          canWrite={canWrite}
          reviewState={reviewState}
        />
      </main>
      <TrustStrip />
      <Footer />
    </>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductForPage(slug);
  if (!p) return { title: { absolute: "Not found · Elite Zone J" } };
  // Same image path the JSON-LD uses (see ProductPage): fabrics fall back to
  // the cloth library image; everything else uses the per-slug photography.
  const ldImage =
    p.kind === "fabric"
      ? ["/generated/_sections/process-cloth.webp"]
      : [`/generated/${slug}/01-front.webp`, `/generated/${slug}/02-overview.webp`];
  return {
    title: p.name,
    description: p.line,
    alternates: { canonical: `/products/${slug}` },
    openGraph: {
      title: p.name,
      description: p.line,
      images: ldImage,
    },
  };
}
