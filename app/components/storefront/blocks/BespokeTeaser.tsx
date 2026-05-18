import Link from "next/link";
import Reveal from "../../Reveal";

type RC = Record<string, unknown>;

// Byte-parity wrapper: renders the original bespoke teaser (.bespoke-teaser)
// exactly as it appeared on the homepage.
export default function BespokeTeaser({ cfg }: { cfg: RC }) {
  const ix = String(cfg.ix ?? "");
  const headlinePre = String(cfg.headlinePre ?? "");
  const headlineEm = String(cfg.headlineEm ?? "");
  const body = String(cfg.body ?? "");
  const ctaLabel = String(cfg.ctaLabel ?? "");
  const ctaHref = String(cfg.ctaHref ?? "");
  return (
    <section className="bespoke-teaser">
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
