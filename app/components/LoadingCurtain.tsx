"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

const STORAGE_KEY = "ezj-curtain-shown-v1";
const HOLD_MS = 600;     // time the curtain holds at full opacity
const FADE_MS = 600;     // fade-out duration (must match .loading-curtain transition)

export default function LoadingCurtain() {
  // Show by default on cold load — gated by sessionStorage so subsequent
  // navigations within the session never see it again.
  // Skip entirely on /admin routes — the workbook has its own visual language.
  const pathname = usePathname();
  const onAdmin = pathname?.startsWith("/admin") ?? false;
  const [phase, setPhase] = useState<"hidden" | "showing" | "fading">("hidden");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (onAdmin) return;
    try {
      if (window.sessionStorage.getItem(STORAGE_KEY)) return;
    } catch {
      // sessionStorage may throw in some embeds — bail silently
      return;
    }
    setPhase("showing");
    const t1 = setTimeout(() => setPhase("fading"), HOLD_MS);
    const t2 = setTimeout(() => {
      setPhase("hidden");
      try { window.sessionStorage.setItem(STORAGE_KEY, "1"); } catch {}
    }, HOLD_MS + FADE_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onAdmin]);

  if (onAdmin) return null;

  if (phase === "hidden") return null;

  return (
    <div
      className={`loading-curtain${phase === "fading" ? " is-fading" : ""}`}
      aria-hidden="true"
      role="presentation"
    >
      <div className="loading-curtain__mark">
        <Image
          src="/logo/wordmark-trimmed.png"
          alt=""
          width={892}
          height={116}
          priority
          style={{ height: "clamp(36px, 5vw, 64px)", width: "auto", display: "block", filter: "invert(1) brightness(1.1)" }}
        />
        <span className="loading-curtain__rule" aria-hidden="true" />
        <span className="loading-curtain__sub">Premium tailoring · Delhi</span>
      </div>
    </div>
  );
}
