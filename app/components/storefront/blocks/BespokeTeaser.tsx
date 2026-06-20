import Link from "next/link";
import Reveal from "../../Reveal";

type RC = Record<string, unknown>;

const FALLBACK_IMG = "/generated/_sections/atelier.webp";

export default function BespokeTeaser({ cfg }: { cfg: RC }) {
  const ix = String(cfg.ix ?? "");
  const headlinePre = String(cfg.headlinePre ?? "");
  const headlineEm = String(cfg.headlineEm ?? "");
  const body = String(cfg.body ?? "");
  const ctaLabel = String(cfg.ctaLabel ?? "");
  const ctaHref = String(cfg.ctaHref ?? "");
  const image = String(cfg.image || FALLBACK_IMG);
  const imageMobile = cfg.imageMobile ? String(cfg.imageMobile) : "";

  return (
    <section
      className={`bespoke-teaser${imageMobile ? " bespoke-teaser--has-mobile" : ""}`}
      style={{ ["--bt-img" as string]: `url(${image})`, ["--bt-img-m" as string]: imageMobile ? `url(${imageMobile})` : undefined }}
    >
      <div className="row">
        <div>
          <div className="ix t-mono-xs">{ix}</div>
          <Reveal as="h3">{headlinePre}<em>{headlineEm}</em></Reveal>
          <Reveal as="p" delay={1} className="t-body-lg">{body}</Reveal>
        </div>
        <Link className="btn btn-lg" href={ctaHref}>{ctaLabel}</Link>
      </div>
    </section>
  );
}
