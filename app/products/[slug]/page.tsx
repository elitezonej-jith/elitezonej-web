import { notFound } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import TrustStrip from "../../components/TrustStrip";
import ProductPageClient from "./ProductPageClient";
import { getProductForPage } from "@/lib/storefront/product-for-page";

// HEADER_CSS removed: the legacy block hard-coded the cream/oxblood
// header/footer/trust-strip from the original tailoring brand, which
// conflicted with the new disturbia.css theme. Header/Footer/TrustStrip
// components now style themselves via globals.css + disturbia.css.

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductForPage(slug);
  if (!product) notFound();

  // Schema.org Product structured data — eligible for rich results in
  // Google search (price, availability, ratings). Fabrics don't have
  // per-slug photography, so fall back to the cloth library image.
  const ldImage = product.kind === "fabric"
    ? ["/generated/_sections/process-cloth.webp"]
    : [`/generated/${slug}/01-front.webp`, `/generated/${slug}/02-overview.webp`];
  const ld = {
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
      <Header />
      <ProductPageClient product={product} />
      <TrustStrip />
      <Footer />
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProductForPage(slug);
  if (!p) return { title: "Not found — Elite Zone J" };
  return { title: `${p.name} — Elite Zone J`, description: p.line };
}
