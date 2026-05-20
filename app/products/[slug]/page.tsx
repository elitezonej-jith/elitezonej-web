import { notFound } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import TrustStrip from "../../components/TrustStrip";
import ProductPageClient from "./ProductPageClient";
import { getProductForPage } from "@/lib/storefront/product-for-page";
import { listProductsForPage } from "@/lib/storefront/catalogue";

// HEADER_CSS removed: the legacy block hard-coded the cream/oxblood
// header/footer/trust-strip from the original tailoring brand, which
// conflicted with the new disturbia.css theme. Header/Footer/TrustStrip
// components now style themselves via globals.css + disturbia.css.

// PDP reads live product/inventory/images from the admin DB. ISR: pre-render
// on first hit and refresh every 5 min in the background. For an immediate
// refresh after a /studio/products save, call `revalidatePath("/products/[slug]")`
// from that action.
export const revalidate = 300;

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductForPage(slug);
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

  const related = (await listProductsForPage()).filter((p) => p.slug !== slug).slice(0, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
      <Header />
      <main>
        <ProductPageClient
          product={product}
          related={related}
        />
      </main>
      <TrustStrip />
      <Footer />
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProductForPage(slug);
  if (!p) return { title: "Not found — Elite Zone J" };
  return { title: `${p.name} — Elite Zone J`, description: p.line };
}
