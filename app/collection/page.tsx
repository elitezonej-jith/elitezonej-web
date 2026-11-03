import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import TrustStrip from "../components/TrustStrip";
import CollectionClient from "./CollectionClient";
import { listProductsForPage } from "../../lib/storefront/catalogue";
import { getCategoryMeta } from "../../lib/storefront/nav";
import { CAT_DATA, SUBCATS } from "@/lib/subcats";
import { sql } from "@/lib/admin/db";
import { getAggregatedFilters } from "@/lib/admin/repos/category-filters";

// Temporarily force-dynamic: Vercel build can't reach Neon to prerender ISR.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ c?: string; sub?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const cat = (params.c || "men").toLowerCase();
  const sub = (params.sub || "").toLowerCase();
  const meta = await getCategoryMeta(cat, sub);
  const canonical = sub
    ? `/collection?c=${cat}&sub=${sub}`
    : `/collection?c=${cat}`;
  return {
    title: seoTitle(cat, sub, meta.title),
    description: meta.stand,
    alternates: { canonical },
  };
}

// Search-friendly titles. The on-page heading stays short ("Men"); the
// <title> says what people actually search for ("men's tailored suits").
const CATEGORY_TITLES: Record<string, string> = {
  men: "Men's Tailored Suits, Shirts & Sherwanis",
  women: "Women's Designer Wear, Blazers & Lehengas",
  fabrics: "Premium Suiting & Shirting Fabrics by the Metre",
  accessories: "Brooches, Lapel Pins, Buttons & Men's Accessories",
  new: "New Arrivals: Tailoring & Designer Wear",
  sale: "Sale on Tailored Suits & Designer Wear",
  all: "All Tailoring, Designer Wear & Accessories",
  festive: "Festive Wear: Sherwanis, Lehengas & Bandhgalas",
};

function seoTitle(cat: string, sub: string, label: string): string {
  if (!sub) return CATEGORY_TITLES[cat] ?? label;
  // Subcategory: "Business Suits for Men", "Blazers for Women".
  if (cat === "men") return `${label} for Men`;
  if (cat === "women") return `${label} for Women`;
  return label;
}

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string; sub?: string }>;
}) {
  const params = await searchParams;
  const cat = (params.c || "men").toLowerCase();
  const sub = (params.sub || "").toLowerCase();

  const meta = await getCategoryMeta(cat, sub);
  const parentTitle = CAT_DATA[cat] ? (await getCategoryMeta(cat, "")).title : "";
  const hasSub = !!(sub && SUBCATS[cat]?.[sub]);

  const products = await listProductsForPage();

  // Load category-aware filters from DB (bubble-down: self + descendants)
  let dbFilters: Array<{ name: string; field_key: string; filter_type: string; options: Array<{ value: string; label: string | null; color_hex: string | null }> }> = [];
  const slug = sub || cat;
  const catRow = await sql.get<{ id: number }>("SELECT id FROM categories WHERE slug = ?", [slug]);
  if (catRow) {
    const aggregated = await getAggregatedFilters(catRow.id);
    dbFilters = aggregated.map((f) => ({
      name: f.name,
      field_key: f.field_key,
      filter_type: f.filter_type,
      options: f.options.map((o) => ({ value: o.value, label: o.label, color_hex: o.color_hex })),
    }));
  }

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
          filters={dbFilters}
        />
      </main>
      <TrustStrip />
      <Footer />
    </>
  );
}
