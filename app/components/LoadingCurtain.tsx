"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

const STORAGE_KEY = "ezj-curtain-shown-v1";
const MIN_HOLD_MS = 400;   // minimum hold so the curtain isn't a flash on fast loads
const MAX_HOLD_MS = 3000;  // hard cap so a stuck resource can't trap the user behind the curtain
const FADE_MS = 600;       // fade-out duration (must match .loading-curtain transition)

export default function LoadingCurtain() {
  // Cold-load greeter + FOUC shield. Stays at full opacity until window.load
  // fires (all images / stylesheets / fonts done), then fades out. Bounded by
  // MIN_HOLD_MS (avoid flash) and MAX_HOLD_MS (avoid trap). sessionStorage
  // gates it to first visit per session.
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
      return;
    }
    const mountedAt = Date.now();
    setPhase("showing");

    let fadeTimer: ReturnType<typeof setTimeout> | undefined;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    let capTimer: ReturnType<typeof setTimeout> | undefined;

    const beginFade = () => {
      if (fadeTimer || hideTimer) return; // already triggered
      const heldFor = Date.now() - mountedAt;
      const wait = Math.max(0, MIN_HOLD_MS - heldFor);
      fadeTimer = setTimeout(() => setPhase("fading"), wait);
      hideTimer = setTimeout(() => {
        setPhase("hidden");
        try { window.sessionStorage.setItem(STORAGE_KEY, "1"); } catch {}
      }, wait + FADE_MS);
    };

    // Primary trigger: page fully loaded (resources, fonts, images). If we
    // already loaded before mount (cached visit), beginFade immediately.
    if (document.readyState === "complete") {
      beginFade();
    } else {
      window.addEventListener("load", beginFade, { once: true });
    }
    // Safety cap: never let the curtain outlast MAX_HOLD_MS.
    capTimer = setTimeout(beginFade, MAX_HOLD_MS);

    return () => {
      window.removeEventListener("load", beginFade);
      if (fadeTimer) clearTimeout(fadeTimer);
      if (hideTimer) clearTimeout(hideTimer);
      if (capTimer) clearTimeout(capTimer);
    };
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
