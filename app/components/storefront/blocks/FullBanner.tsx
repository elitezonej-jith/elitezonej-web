import Link from "next/link";

type RC = Record<string, unknown>;

// Byte-parity wrapper: renders the original full-width "Women's Collection"
// editorial strip (.coll-banner) exactly as it appeared on the homepage.
export default function FullBanner({
  cfg,
}: {
  cfg: RC;
}) {
  const href = String(cfg.href ?? "/collection?c=women");
  const image = String(cfg.image ?? "");
  const imgAria = String(cfg.imgAria ?? "");
  const eyebrow = String(cfg.eyebrow ?? "");
  const title = String(cfg.title ?? "");
  const titleEm = String(cfg.titleEm ?? "");
  const ctaLabel = String(cfg.ctaLabel ?? "Shop Now");
  const ariaLabel = String(cfg.ariaLabel ?? "");
  return (
    <Link href={href} className="coll-banner" aria-label={ariaLabel}>
      <div
        className="coll-banner-img"
        role="img"
        aria-label={imgAria}
        style={{ backgroundImage: `url(${image})` }}
      />
      <div className="coll-banner-overlay">
        <span className="coll-banner-eyebrow">{eyebrow}</span>
        <h2>{title}<em>{titleEm}</em></h2>
        <span className="btn btn-primary coll-banner-cta">{ctaLabel}</span>
      </div>
    </Link>
  );
}
