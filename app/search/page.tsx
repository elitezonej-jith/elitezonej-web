import type { Metadata } from "next";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import TrustStrip from "../components/TrustStrip";
import CollectionClient from "../collection/CollectionClient";
import { listProductsForPage } from "@/lib/storefront/catalogue";
import { scoreProduct, tokenize, type SearchableFields } from "@/lib/search";

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
  const query = (q ?? "").trim();
  const tokens = tokenize(query);

  let products = await listProductsForPage();

  // Score and rank using the shared engine with full field coverage
  if (tokens.length > 0) {
    const scored = products
      .map((p) => {
        const fields: SearchableFields = {
          name: p.name,
          cat: p.cat,
          category: p.category,
          sub: p.sub,
          gender: p.gender,
          fit: p.fit,
          fabric: p.fabric,
          occasion: p.occasion,
          line: p.line,
          colour: p.colour,
          badge: p.badge,
          description: p.description,
          shortDescription: p.shortDescription,
          note: p.note,
          features: p.features,
          spec: p.spec?.map(([, v]) => v),
          filterTags: p.filterTags,
        };
        return { p, score: scoreProduct(fields, tokens) };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);
    products = scored.map((x) => x.p);
  }

  const count = products.length;
  const hasQuery = !!q?.trim();

  // Empty state or no-query state
  if (hasQuery && count === 0) {
    return (
      <>
        <Header />
        <main>
          <section style={{ maxWidth: 600, margin: "0 auto", padding: "12vh var(--pad-x-d) 20vh", textAlign: "center" }}>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px, 4vw, 32px)", marginBottom: "var(--s-3)" }}>
              No results for &ldquo;{q!.trim()}&rdquo;
            </h1>
            <p style={{ color: "var(--ink-3)", marginBottom: "var(--s-6)" }}>
              Check the spelling or try a broader term.
            </p>
            <nav style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-3)", justifyContent: "center" }}>
              <Link href="/collection?c=men" className="btn btn-secondary">Men</Link>
              <Link href="/collection?c=women" className="btn btn-secondary">Women</Link>
              <Link href="/collection?c=accessories" className="btn btn-secondary">Accessories</Link>
              <Link href="/collection?c=fabrics" className="btn btn-secondary">Fabrics</Link>
              <Link href="/collection?c=all" className="btn btn-secondary">View All</Link>
            </nav>
          </section>
        </main>
        <TrustStrip />
        <Footer />
      </>
    );
  }

  if (!hasQuery) {
    return (
      <>
        <Header />
        <main>
          <section style={{ maxWidth: 600, margin: "0 auto", padding: "12vh var(--pad-x-d) 20vh", textAlign: "center" }}>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px, 4vw, 32px)", marginBottom: "var(--s-3)" }}>
              Search
            </h1>
            <p style={{ color: "var(--ink-3)", marginBottom: "var(--s-6)" }}>
              Use the search icon in the header to find products.
            </p>
            <nav style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-3)", justifyContent: "center" }}>
              <Link href="/collection?c=men" className="btn btn-secondary">Men</Link>
              <Link href="/collection?c=women" className="btn btn-secondary">Women</Link>
              <Link href="/collection?c=accessories" className="btn btn-secondary">Accessories</Link>
              <Link href="/collection?c=fabrics" className="btn btn-secondary">Fabrics</Link>
            </nav>
          </section>
        </main>
        <TrustStrip />
        <Footer />
      </>
    );
  }

  const heading = `Results for "${q!.trim()}"`;
  const stand = `${count} product${count !== 1 ? "s" : ""} found`;

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
