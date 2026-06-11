import Link from "next/link";
import Image from "next/image";

type Cat = { name?: unknown; href?: unknown; image?: unknown };

export default function CategoryGrid({ categories }: { categories: Cat[] }) {
  if (!categories.length) return null;
  return (
    <section style={{ padding: "64px 5vw 48px" }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(240px, 1fr))`, gap: 16 }}>
        {categories.map((c, i) => {
          const img = String(c.image ?? "");
          return (
            <Link key={i} href={String(c.href ?? "#")} style={{ position: "relative", display: "block", aspectRatio: "4/5", overflow: "hidden", textDecoration: "none", color: "#fff" }}>
              {img && (
                <Image
                  src={img}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 50vw, 320px"
                  style={{ objectFit: "cover" }}
                />
              )}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, rgba(0,0,0,0.10), rgba(0,0,0,0.55))" }}>
                <span style={{ position: "absolute", bottom: 18, left: 18, fontFamily: '"Cormorant Garamond", serif', fontSize: 24, fontStyle: "italic", fontWeight: 500 }}>
                  {String(c.name ?? "")}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
