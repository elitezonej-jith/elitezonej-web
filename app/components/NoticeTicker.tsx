// Server component — renders the highest-priority scrolling-ticker notice
// from the admin database. Falls back to nothing if none is live.

import { listNotices } from "../../lib/admin/repos/notices";
import { safeHref } from "../../lib/sanitize";

function targetMatches(notice: { target_paths: string }, pathname: string): boolean {
  const raw = notice.target_paths || "*";
  if (raw === "*") return true;
  const list = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return list.some((prefix) => pathname === prefix || pathname.startsWith(prefix.replace(/\/$/, "") + "/"));
}

export default function NoticeTicker({ pathname = "/" }: { pathname?: string }) {
  const notices = listNotices({ onlyLive: true, type: "scroll" })
    .filter((n) => targetMatches(n, pathname));
  if (notices.length === 0) return null;
  // Compose a single ticker out of all live scroll notices, separated.
  const items = notices.map((n) => ({
    body: n.body,
    link_href: safeHref(n.link_href),
    link_text: n.link_text,
    bg: n.color_bg,
    fg: n.color_fg,
  }));
  const first = items[0];
  return (
    <div className="announce-bar"
         role="region"
         aria-label="Site announcements"
         style={first.bg || first.fg ? { background: first.bg || undefined, color: first.fg || undefined } : undefined}>
      {/* Accessible, non-animated copy for assistive tech / keyboard users */}
      <div style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>
        {items.map((it, i) => (
          <span key={`sr-${i}`}>
            {it.body}{" "}
            {it.link_href && it.link_text && (
              <a href={it.link_href} rel="noopener noreferrer">{it.link_text}</a>
            )}{" "}
          </span>
        ))}
      </div>
      <div className="announce-ticker" aria-hidden="true" inert>
        {[0, 1].map((rep) => (
          <span key={rep} className="announce-ticker__track">
            {items.map((it, i) => (
              <span key={`${rep}-${i}`} style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
                <span className="announce-item">{it.body}</span>
                {it.link_href && it.link_text && (
                  <a className="announce-item" href={it.link_href} rel="noopener noreferrer" style={{ textDecoration: "underline", marginLeft: 4 }}>
                    {it.link_text}
                  </a>
                )}
                <span className="announce-sep" />
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}
