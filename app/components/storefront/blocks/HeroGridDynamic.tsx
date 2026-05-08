import Link from "next/link";

type Tile = {
  kicker?: unknown; title?: unknown; body?: unknown;
  image?: unknown; href?: unknown; cta?: unknown;
};

export default function HeroGridDynamic({ tiles }: { tiles: Tile[] }) {
  if (!tiles?.length) return null;
  return (
    <section className="hero-grid" style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(tiles.length, 3)}, 1fr)`, gap: 0, height: "min(560px, 70vh)" }}>
      {tiles.map((t, i) => {
        const image = String(t.image ?? "");
        const href = String(t.href ?? "");
        return (
          <Link key={i} href={href || "#"}
                style={{
                  position: "relative",
                  display: "block",
                  textDecoration: "none",
                  color: "#fff",
                  overflow: "hidden",
                  background: "#1A1613",
                }}>
            {image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            )}
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(160deg, rgba(0,0,0,0.05), rgba(0,0,0,0.55))",
              padding: "32px 28px",
              display: "flex", flexDirection: "column", justifyContent: "flex-end",
            }}>
              {t.kicker ? (
                <span style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 10, opacity: 0.86 }}>
                  {String(t.kicker)}
                </span>
              ) : null}
              <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 500, margin: 0, lineHeight: 1.1 }}>
                {String(t.title ?? "")}
              </h2>
              {t.body ? <p style={{ marginTop: 10, fontSize: 14, opacity: 0.88, maxWidth: "32ch" }}>{String(t.body)}</p> : null}
              {t.cta ? (
                <span style={{ marginTop: 18, fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", borderBottom: "1px solid currentColor", paddingBottom: 4, alignSelf: "flex-start" }}>
                  {String(t.cta)} →
                </span>
              ) : null}
            </div>
          </Link>
        );
      })}
    </section>
  );
}
