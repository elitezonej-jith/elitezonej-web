// Server component — renders the highest-priority scrolling-ticker notice
// from the admin database. Falls back to nothing if none is live.

import { listNotices } from "../../lib/admin/repos/notices";

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
    link_href: n.link_href,
    link_text: n.link_text,
    bg: n.color_bg,
    fg: n.color_fg,
  }));
  const first = items[0];
  return (
    <div className="announce-bar"
         aria-label={items.map((i) => i.body).join(" — ")}
         style={first.bg || first.fg ? { background: first.bg || undefined, color: first.fg || undefined } : undefined}>
      <div className="announce-ticker" aria-hidden="true">
        {[0, 1].map((rep) => (
          <span key={rep} className="announce-ticker__track">
            {items.map((it, i) => (
              <span key={`${rep}-${i}`} style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
                <span className="announce-item">{it.body}</span>
                {it.link_href && it.link_text && (
                  <a className="announce-item" href={it.link_href} style={{ textDecoration: "underline", marginLeft: 4 }}>
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
