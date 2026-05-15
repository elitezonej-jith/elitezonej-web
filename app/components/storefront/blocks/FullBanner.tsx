import Link from "next/link";

type RC = Record<string, unknown>;

export default function FullBanner({
  title, body, image, cta, variant = "full_banner",
}: {
  title: string; body: string; image: string; cta?: RC; variant?: string;
}) {
  const isHero = variant === "hero_banner";
  return (
    <section style={{
      position: "relative",
      width: "100%",
      aspectRatio: isHero ? "21/9" : "3/1",
      maxHeight: isHero ? "70vh" : "60vh",
      overflow: "hidden",
      background: "#1A1613",
    }}>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      )}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start",
        padding: "6%",
        background: "linear-gradient(120deg, rgba(0,0,0,0.45), rgba(0,0,0,0.10))",
        color: "#FAF7F2",
      }}>
        <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: "clamp(28px, 4vw, 56px)", fontWeight: 500, margin: 0, lineHeight: 1.05 }}>
          {title}
        </h2>
        {body && <p style={{ marginTop: 12, maxWidth: "60ch", fontSize: 15 }}>{body}</p>}
        {cta && cta.href ? (
          <Link href={String(cta.href)}
                style={{ marginTop: 22, padding: "12px 24px", background: "#FAF7F2", color: "#1A1613",
                         fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase",
                         fontWeight: 500, textDecoration: "none" }}>
            {String(cta.label ?? "Explore")}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
