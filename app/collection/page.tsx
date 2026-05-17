import Header from "../components/Header";
import Footer from "../components/Footer";
import TrustStrip from "../components/TrustStrip";
import CollectionClient from "./CollectionClient";

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

  return (
    <>
      <Header />
      <CollectionClient cat={cat} sub={sub} />
      <TrustStrip />
      <Footer />
    </>
  );
}
