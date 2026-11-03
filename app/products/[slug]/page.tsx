import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import TrustStrip from "../../components/TrustStrip";
import ProductPageClient from "./ProductPageClient";
import { getProductForPage } from "@/lib/storefront/product-for-page";
import { listProductsForPage } from "@/lib/storefront/catalogue";
import { getSiteSettings } from "@/lib/storefront/site-settings";
import { getAggregateForProduct, listForProduct } from "@/lib/admin/repos/product-reviews";

// HEADER_CSS removed: the legacy block hard-coded the cream/oxblood
// header/footer/trust-strip from the original tailoring brand, which
// conflicted with the new disturbia.css theme. Header/Footer/TrustStrip
// components now style themselves via globals.css + disturbia.css.

// ISR: rendered on first visit, then served from Vercel's edge cache and
// refreshed in the background at most every 5 minutes. Studio product saves
// and review moderation call revalidatePath(`/products/${slug}`), so those
// show up straight away. Nothing in this page reads cookies or headers.
export const revalidate = 300;

const SITE = "https://elitezonej.com";

// Real product photos for Google (JSON-LD) and link previews (Open Graph).
// Uploaded products keep their photos in Vercel Blob (`images`); only the
// original catalogue has /generated/<slug>/ files. Pointing at /generated for
// an uploaded product gave Google and WhatsApp/Instagram a 404 image.
function productImages(p: { slug: string; kind?: string; images?: string[] }): string[] {
  if (p.images && p.images.length > 0) {
    return p.images.slice(0, 4).map((u) => (u.startsWith("/") ? SITE + u : u));
  }
  if (p.kind === "fabric") return [`${SITE}/generated/_sections/process-cloth.webp`];
  return [`${SITE}/generated/${p.slug}/01-front.webp`, `${SITE}/generated/${p.slug}/02-overview.webp`];
}

// Empty list = build nothing up front (keeps builds fast); each product is
// rendered on its first visit and cached from then on.
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return [];
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductForPage(slug);
  if (!product) notFound();

  // Independent reads run in parallel. Nothing here is per-visitor: review
  // eligibility is fetched client-side (/api/reviews/eligibility), which is
  // what allows this page to be cached (see `revalidate` above).
  const [aggregate, reviews, allProducts, settings] = await Promise.all([
    getAggregateForProduct(slug),
    listForProduct(slug, "approved"),
    listProductsForPage(),
    getSiteSettings(),
  ]);

  // Schema.org Product structured data — eligible for rich results in
  // Google search (image, price, availability, ratings).
  const ldImage = productImages(product);
  const url = `${SITE}/products/${slug}`;
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: ldImage,
    url,
    sku: slug,
    description: product.description ?? product.line,
    brand: { "@type": "Brand", name: "Elite Zone J" },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "INR",
      // The price a customer actually pays (sale price when on sale).
      price: product.salePrice ?? product.price,
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

  // Breadcrumb trail for search results: Home › Category › Product. Mirrors the
  // visible crumb in ProductPageClient.
  const catHref = `/collection?c=${product.kind === "fabric" ? "fabrics" : product.category === "accessories" ? "accessories" : product.gender}`;
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: product.catLink, item: `${SITE}${catHref}` },
      { "@type": "ListItem", position: 3, name: product.name, item: url },
    ],
  };

  const related = allProducts.filter((p) => p.slug !== slug).slice(0, 3);
  const { leadTimeDays } = settings;

  return (
    <>
      <script
        type="application/ld+json"
        // Escape against </script> breakout (and HTML-comment / ampersand
        // injection) before inlining the serialized JSON-LD.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([ld, breadcrumbLd])
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
  const ldImage = productImages(p);
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
