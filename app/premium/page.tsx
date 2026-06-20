import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import TrustStrip from "../components/TrustStrip";
import CollectionClient from "../collection/CollectionClient";
import { listProductsForPage } from "../../lib/storefront/catalogue";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Premium Collection",
  description:
    "Hand-picked premium pieces from the Elite Zone J atelier — our finest tailoring, selected by our design team.",
  alternates: { canonical: "/premium" },
};

export default async function PremiumPage() {
  const allProducts = await listProductsForPage();
  const products = allProducts.filter((p) => p.isPremium);

  return (
    <>
      <Header />
      <main>
        <CollectionClient
          cat="premium"
          sub=""
          products={products}
          headTitle="Premium Collection"
          headStand="Hand-picked by our design team — the finest tailoring from the Elite Zone J atelier. Made-to-measure in seven days."
          parentTitle=""
          hasSub={false}
        />
      </main>
      <TrustStrip />
      <Footer />
    </>
  );
}
