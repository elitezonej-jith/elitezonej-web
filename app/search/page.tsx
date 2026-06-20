import type { Metadata } from "next";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import TrustStrip from "../components/TrustStrip";
import CollectionClient from "../collection/CollectionClient";
import { listProductsForPage } from "@/lib/storefront/catalogue";
import type { Product } from "@/lib/products";

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

// Basic stemming: strip common suffixes for loose matching
function stem(word: string): string {
  if (word.length < 4) return word;
  if (word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (word.endsWith("es")) return word.slice(0, -2);
  if (word.endsWith("s")) return word.slice(0, -1);
  if (word.endsWith("ing")) return word.slice(0, -3);
  if (word.endsWith("ed") && word.length > 4) return word.slice(0, -2);
  return word;
}

function scoreProduct(p: Product, tokens: string[]): number {
  const name = p.name.toLowerCase();
  const cat = `${p.cat} ${p.category} ${p.sub ?? ""}`.toLowerCase();
  const rest = `${p.fabric} ${p.occasion} ${p.line} ${p.gender} ${p.fit} ${p.colour ?? ""} ${p.badge ?? ""} ${p.description ?? ""} ${p.shortDescription ?? ""} ${(p.features || []).join(" ")}`.toLowerCase();

  let score = 0;
  for (const t of tokens) {
    const st = stem(t);
    // Name match (highest weight)
    if (name.includes(t) || name.includes(st)) score += 10;
    // Category match
    else if (cat.includes(t) || cat.includes(st)) score += 5;
    // Other fields match
    else if (rest.includes(t) || rest.includes(st)) score += 2;
    // No match at all — penalize heavily to filter out
    else return 0;
  }
  return score;
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

  // Score and rank
  if (tokens.length > 0) {
    const scored = products
      .map(p => ({ p, score: scoreProduct(p, tokens) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score);
    products = scored.map(x => x.p);
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
