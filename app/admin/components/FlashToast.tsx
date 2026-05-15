"use client";
import { useEffect, useState } from "react";

// Reads ?flash= or ?saved=1 from the URL on mount and shows a transient,
// in-brand confirmation, then strips the param so a refresh won't re-toast.
export default function FlashToast() {
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const flash = url.searchParams.get("flash");
    const saved = url.searchParams.get("saved");
    const text = flash ? decodeURIComponent(flash) : saved === "1" ? "Saved" : null;
    if (!text) return;
    setMsg(text);
    url.searchParams.delete("flash");
    url.searchParams.delete("saved");
    window.history.replaceState({}, "", url.toString());
    const t = setTimeout(() => setMsg(null), 3500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div aria-live="polite" role="status" className="adm-flash-region">
      {msg && <div className="adm-flash">{msg}</div>}
    </div>
  );
}
