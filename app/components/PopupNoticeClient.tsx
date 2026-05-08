"use client";
import { useEffect, useState } from "react";
import type { Notice } from "../../lib/admin/repos/notices";

export default function PopupNoticeClient({ notice }: { notice: Notice }) {
  const [open, setOpen] = useState(false);
  const storageKey = `ezj-popup-${notice.id}-shown`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.localStorage.getItem(storageKey) === "1") return;
    } catch { return; }
    const t = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(t);
  }, [storageKey]);

  const close = () => {
    setOpen(false);
    try { window.localStorage.setItem(storageKey, "1"); } catch { /* */ }
  };

  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true"
         style={{
           position: "fixed", inset: 0, background: "rgba(20,16,12,0.55)",
           backdropFilter: "blur(4px)", zIndex: 110,
           display: "grid", placeItems: "center", padding: 24,
         }}
         onClick={notice.dismissable ? close : undefined}>
      <div onClick={(e) => e.stopPropagation()}
           style={{
             background: notice.color_bg || "#FAF7F2",
             color: notice.color_fg || "#1A1613",
             padding: "44px 40px",
             maxWidth: 480, width: "100%",
             border: "1px solid rgba(26,22,19,0.10)",
             borderRadius: 12,
             boxShadow: "0 24px 48px -16px rgba(20,16,12,0.36)",
             position: "relative",
             fontFamily: '"Cormorant Garamond", "EB Garamond", Georgia, serif',
           }}>
        <p style={{ fontSize: 22, lineHeight: 1.3, margin: 0, fontStyle: "italic" }}>
          {notice.body}
        </p>
        {notice.link_href && (
          <a href={notice.link_href}
             style={{
               display: "inline-block", marginTop: 22, padding: "10px 18px",
               background: "#1A1613", color: "#FAF7F2",
               textDecoration: "none", fontFamily: '"Montserrat", sans-serif',
               fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase",
               fontWeight: 500,
             }}>
            {notice.link_text || "Learn more"}
          </a>
        )}
        {notice.dismissable === 1 && (
          <button type="button" onClick={close}
                  style={{
                    position: "absolute", top: 14, right: 14,
                    background: "transparent", border: "none", cursor: "pointer",
                    fontSize: 20, lineHeight: 1, color: notice.color_fg || "#1A1613",
                  }}
                  aria-label="Close">×</button>
        )}
      </div>
    </div>
  );
}
