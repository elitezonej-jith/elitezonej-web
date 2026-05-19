import Header from "../components/Header";
import Footer from "../components/Footer";
import TrustStrip from "../components/TrustStrip";
import CollectionClient from "./CollectionClient";
import { listProductsForPage } from "../../lib/storefront/catalogue";
import { getCategoryMeta } from "../../lib/storefront/nav";
import { CAT_DATA, SUBCATS } from "@/lib/subcats";

// DB-backed (live catalog from the admin DB) — must render per request so
// studio/atelier edits are reflected immediately. SQLite reads are sub-ms.
export const dynamic = "force-dynamic";

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string; sub?: string }>;
}) {
  const params = await searchParams;
  const cat = (params.c || "men").toLowerCase();
  const sub = (params.sub || "").toLowerCase();

  // Rename-aware headings via the DB categories overlay. The crumb/empty-state
  // fallback chains and the "stand" copy stay identical to the static behaviour.
  const meta = getCategoryMeta(cat, sub);
  const parentTitle = CAT_DATA[cat] ? getCategoryMeta(cat, "").title : "";
  const hasSub = !!(sub && SUBCATS[cat]?.[sub]);

  const products = listProductsForPage();

  return (
    <>
      <Header />
      <main>
        <CollectionClient
          cat={cat}
          sub={sub}
          products={products}
          headTitle={meta.title}
          headStand={meta.stand}
          parentTitle={parentTitle}
          hasSub={hasSub}
        />
      </main>
      <TrustStrip />
      <Footer />
    </>
  );
}
