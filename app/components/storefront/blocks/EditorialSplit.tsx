import Link from "next/link";

type RC = Record<string, unknown>;

export default function EditorialSplit({
  image, headline, body, link, align = "left",
}: {
  image: string; headline: string; body: string; link?: RC; align?: "left" | "right";
}) {
  const Image = image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={image} alt="" style={{ display: "block", width: "100%", height: "100%", objectFit: "cover", aspectRatio: "4/5" }} />
  ) : <div style={{ background: "#E8E2D7", aspectRatio: "4/5" }} />;
  const Text = (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px 6%", maxWidth: 520 }}>
      <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: "clamp(26px, 3vw, 44px)", lineHeight: 1.05, fontWeight: 500, margin: 0 }}>
        {headline}
      </h2>
      {body && <p style={{ marginTop: 14, fontSize: 16, color: "#55493E", maxWidth: "44ch" }}>{body}</p>}
      {link?.href ? (
        <Link href={String(link.href)}
              style={{ marginTop: 22, fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase",
                       color: "#7A1C1C", textDecoration: "none",
                       borderBottom: "1px solid currentColor", paddingBottom: 4, alignSelf: "flex-start" }}>
          {String(link.label ?? "Explore")} →
        </Link>
      ) : null}
    </div>
  );
  return (
    <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "stretch" }}>
      {align === "left" ? <>{Image}{Text}</> : <>{Text}{Image}</>}
    </section>
  );
}
