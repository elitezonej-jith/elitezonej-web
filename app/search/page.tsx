import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import TrustStrip from "../components/TrustStrip";
import CollectionClient from "../collection/CollectionClient";
import { listProductsForPage } from "@/lib/storefront/catalogue";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `Search: ${q} · Elite Zone J` : "Search · Elite Zone J",
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();
  const tokens = query.split(/\s+/).filter(Boolean);

  let products = await listProductsForPage();

  // Server-side filter by search query
  if (tokens.length > 0) {
    products = products.filter(p => {
      const hay = `${p.name} ${p.cat} ${p.fabric} ${p.occasion} ${p.line} ${p.gender} ${p.category}`.toLowerCase();
      return tokens.every(t => hay.includes(t));
    });
  }

  const count = products.length;
  const heading = q ? `Search Results` : "Search";
  const stand = q
    ? `${count} result${count !== 1 ? "s" : ""} for "${q.trim().slice(0, 60)}"`
    : "Browse the full Elite Zone J catalogue.";

  return (
    <>
      <Header />
      <main>
        <CollectionClient
          cat="all"
          sub=""
          products={products}
          headTitle={heading}
          headStand={stand}
          parentTitle=""
          hasSub={false}
        />
      </main>
      <TrustStrip />
      <Footer />
    </>
  );
}
