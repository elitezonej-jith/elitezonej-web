"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Shows a transient, in-brand confirmation from ?flash= or ?saved=1, then
// strips the param so a refresh won't re-toast.
//
// This must react to *every* navigation, not just the first mount: admin
// mutations server-action `redirect(...?flash=...)` while the admin layout
// (and therefore this component) stays mounted, so a mount-only effect never
// fired on those redirects (QA-004). Keying the effect on the search params
// makes it run on each redirect that carries a flash.
export default function FlashToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const flash = searchParams.get("flash");
  const saved = searchParams.get("saved");

  useEffect(() => {
    const text = flash ? decodeURIComponent(flash) : saved === "1" ? "Saved" : null;
    if (!text) return;

    setMsg(text);

    // Drop the params so a refresh or back-nav won't replay the toast.
    const next = new URLSearchParams(searchParams.toString());
    next.delete("flash");
    next.delete("saved");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });

    const t = setTimeout(() => setMsg(null), 3500);
    return () => clearTimeout(t);
    // Re-run whenever the incoming flash/saved value changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flash, saved]);

  return (
    <div aria-live="polite" role="status" className="adm-flash-region">
      {msg && <div className="adm-flash">{msg}</div>}
    </div>
  );
}
