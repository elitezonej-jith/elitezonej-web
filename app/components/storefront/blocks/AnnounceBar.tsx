import { Fragment } from "react";

type RC = Record<string, unknown>;

// Byte-parity wrapper: renders the original top-of-page scrolling announcement
// ticker (.announce-bar) exactly as it appeared on the homepage. Two identical
// track copies produce the seamless marquee, just like the static version.
export default function AnnounceBar({ cfg }: { cfg: RC }) {
  const ariaLabel = String(cfg.ariaLabel ?? "");
  const items = ((cfg.items as RC[]) ?? []).map((it) => ({
    text: String(it.text ?? ""),
    accent: String(it.accent ?? ""),
    suffix: String(it.suffix ?? ""),
  }));
  if (!items.length) return null;
  return (
    <div className="announce-bar" aria-label={ariaLabel}>
      <div className="announce-ticker" aria-hidden="true">
        {[0, 1].map((copy) => (
          <span key={copy} className="announce-ticker__track">
            {items.map((it, k) => (
              <Fragment key={k}>
                <span className="announce-item">
                  {it.text}
                  <span className="announce-accent">{it.accent}</span>
                  {it.suffix}
                </span>
                <span className="announce-sep" />
              </Fragment>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}
