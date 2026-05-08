import Link from "next/link";
import ProductCard from "../../ProductCard";
import type { StorefrontProduct } from "../../../../lib/storefront/products";
import type { Product } from "@/lib/products";

type RC = Record<string, unknown>;

export default function ProductCarousel({
  title, cta, products,
}: {
  title: string; cta?: RC; products: StorefrontProduct[];
}) {
  if (!products.length) return null;
  return (
    <section style={{ padding: "64px 5vw 48px" }}>
      <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 24, gap: 16 }}>
        <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 500, margin: 0 }}>
          {title}
        </h2>
        {cta?.href ? (
          <Link href={String(cta.href)}
                style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#7A1C1C", textDecoration: "none", borderBottom: "1px solid currentColor", paddingBottom: 3 }}>
            {String(cta.label ?? "View all")} →
          </Link>
        ) : null}
      </header>
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fill, minmax(240px, 1fr))`,
        gap: "24px 16px",
      }}>
        {products.map((prod) => (
          <ProductCard key={prod.slug} p={prod as unknown as Product} />
        ))}
      </div>
    </section>
  );
}
