"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Thin top progress bar for client-side navigations. Replaces the old
// full-screen app/loading.tsx, which blanked the whole page (header included)
// on every click while the server rendered the next route. Now the current
// page stays visible and this bar signals that the next one is on its way.
export default function NavProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);

  // Route committed -> hide.
  useEffect(() => {
    setActive(false);
  }, [pathname, searchParams]);

  // Safety net: hide after 10 s if a click never turned into a navigation
  // (e.g. a link whose handler cancels it).
  useEffect(() => {
    if (!active) return;
    const t = window.setTimeout(() => setActive(false), 10000);
    return () => window.clearTimeout(t);
  }, [active]);

  useEffect(() => {
    // Capture phase on window: next/link calls preventDefault() in React's
    // own click handler (to do a client-side navigation), so a normal
    // bubbling listener would see every <Link> click as "cancelled".
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || !a.href || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      if (url.pathname.startsWith("/api/")) return;
      setActive(true);
    };
    window.addEventListener("click", onClick, true);
    return () => window.removeEventListener("click", onClick, true);
  }, []);

  if (!active) return null;
  return (
    <div className="nav-progress" role="progressbar" aria-label="Loading page">
      <span />
    </div>
  );
}
