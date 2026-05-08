import Link from "next/link";

type RC = Record<string, unknown>;

export default function BespokeTeaser({
  headline, body, cta,
}: {
  headline: string; body: string; cta?: RC;
}) {
  return (
    <section style={{ padding: "80px 5vw", background: "#FAF7F2", textAlign: "center" }}>
      <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: "clamp(26px, 3vw, 40px)", lineHeight: 1.1, fontWeight: 500, margin: 0, maxWidth: "32ch", marginLeft: "auto", marginRight: "auto" }}>
        {headline}
      </h2>
      {body && <p style={{ marginTop: 14, fontSize: 16, color: "#55493E", maxWidth: "52ch", margin: "14px auto 0" }}>{body}</p>}
      {cta?.href ? (
        <div style={{ marginTop: 24 }}>
          <Link href={String(cta.href)}
                style={{ display: "inline-block", padding: "12px 28px", background: "#1A1613", color: "#FAF7F2",
                         fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 500, textDecoration: "none" }}>
            {String(cta.label ?? "Begin")}
          </Link>
        </div>
      ) : null}
    </section>
  );
}
