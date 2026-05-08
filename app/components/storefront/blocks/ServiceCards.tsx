import Link from "next/link";

type Card = { kicker?: unknown; title?: unknown; body?: unknown; image?: unknown; cta?: unknown; href?: unknown };

export default function ServiceCards({ cards }: { cards: Card[] }) {
  if (!cards.length) return null;
  return (
    <section style={{ padding: "64px 5vw 48px" }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(240px, 1fr))`, gap: 24 }}>
        {cards.map((c, i) => {
          const image = String(c.image ?? "");
          const href = String(c.href ?? "");
          return (
            <Link key={i} href={href || "#"} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt="" style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block" }} />
              ) : <div style={{ width: "100%", aspectRatio: "4/3", background: "#E8E2D7" }} />}
              <div style={{ padding: "16px 0 0" }}>
                {c.kicker ? <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#7A1C1C" }}>{String(c.kicker)}</span> : null}
                <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 22, fontWeight: 500, margin: "8px 0 6px" }}>{String(c.title ?? "")}</h3>
                {c.body ? <p style={{ fontSize: 14, color: "#55493E", margin: 0 }}>{String(c.body)}</p> : null}
                {c.cta ? <span style={{ display: "inline-block", marginTop: 10, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", borderBottom: "1px solid currentColor", paddingBottom: 3 }}>{String(c.cta)} →</span> : null}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
