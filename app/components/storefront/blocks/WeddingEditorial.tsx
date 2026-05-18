import Link from "next/link";
import Reveal from "../../Reveal";

type RC = Record<string, unknown>;

// Byte-parity wrapper: renders the original "The Wedding Wardrobe" editorial
// section (.editorial) exactly as it appeared on the homepage.
export default function WeddingEditorial({ cfg }: { cfg: RC }) {
  const ix = String(cfg.ix ?? "");
  const headlinePre = String(cfg.headlinePre ?? "");
  const headlineEm = String(cfg.headlineEm ?? "");
  const headlinePost = String(cfg.headlinePost ?? "");
  const paras = (cfg.paras as unknown[])?.map(String) ?? [];
  const ctaLabel = String(cfg.ctaLabel ?? "");
  const ctaHref = String(cfg.ctaHref ?? "");
  const signed = String(cfg.signed ?? "");
  const imgAria = String(cfg.imgAria ?? "");
  return (
    <section className="editorial" id="editorial">
      <div className="img" role="img" aria-label={imgAria}></div>
      <div className="copy">
        <div className="ix t-mono-xs">{ix}</div>
        <Reveal as="h3">{headlinePre}<em>{headlineEm}</em>{headlinePost}</Reveal>
        {paras.map((p, i) => (
          <Reveal as="p" key={i} delay={(i + 1) as 1 | 2 | 3 | 4} className="t-body">
            {p}
          </Reveal>
        ))}
        <Link className="btn btn-secondary" href={ctaHref} style={{ alignSelf: "flex-start", marginTop: "var(--s-3)" }}>{ctaLabel}</Link>
        <div className="signed t-mono-xs">{signed}</div>
      </div>
    </section>
  );
}
