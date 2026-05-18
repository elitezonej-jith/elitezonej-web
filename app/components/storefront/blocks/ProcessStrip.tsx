import Link from "next/link";
import Reveal from "../../Reveal";

type RC = Record<string, unknown>;

// Byte-parity wrapper: renders the original "How it's made" process strip
// (.process-strip) exactly as it appeared on the homepage.
export default function ProcessStrip({ cfg }: { cfg: RC }) {
  const panes = (cfg.panes as RC[]) ?? [];
  const titlePre = String(cfg.titlePre ?? "");
  const titleEm = String(cfg.titleEm ?? "");
  const titlePost = String(cfg.titlePost ?? "");
  const kicker = String(cfg.kicker ?? "");
  const hint = String(cfg.hint ?? "");
  const footText = String(cfg.footText ?? "");
  const ctaLabel = String(cfg.ctaLabel ?? "");
  const ctaHref = String(cfg.ctaHref ?? "");
  const ariaLabel = String(cfg.ariaLabel ?? "How it's made");
  if (!panes.length) return null;
  return (
    <section className="process-strip" aria-label={ariaLabel}>
      <div className="process-strip__head">
        <Reveal as="div" className="process-strip__lead">
          <h2 className="process-strip__title">
            {titlePre}<em>{titleEm}</em>{titlePost}
          </h2>
          <p className="process-strip__kicker">{kicker}</p>
          <span className="process-strip__rule" aria-hidden="true" />
        </Reveal>
        <span className="process-strip__hint t-mono-xs" aria-hidden="true">
          <span className="dot" />
          {hint}
        </span>
      </div>

      <div className="process-strip__rail" tabIndex={0} aria-roledescription="carousel">
        {panes.map((p, i) => (
          <article className="process-pane" key={i}>
            <div
              className={`process-pane__photo ${String(p.photoClass ?? "")}`}
              role="img"
              aria-label={String(p.photoAria ?? "")}
            />
            <div className="process-pane__body">
              <span className="process-pane__step t-mono-xs">{String(p.step ?? "")}</span>
              <h3>{String(p.title ?? "")}</h3>
              <p>{String(p.body ?? "")}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="process-strip__foot">
        <span className="t-mono-xs">{footText}</span>
        <Link className="btn btn-secondary" href={ctaHref}>{ctaLabel}</Link>
      </div>
    </section>
  );
}
