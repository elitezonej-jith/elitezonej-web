"use client";

import { useEffect, useRef } from "react";

const INTERVAL_MS = 4000;

export default function ProcessStripAutoScroll({ children }: { children: React.ReactNode }) {
  const railRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let timer: ReturnType<typeof setInterval>;
    const resume = () => { pausedRef.current = false; };
    const pause = () => { pausedRef.current = true; };

    timer = setInterval(() => {
      if (pausedRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = rail;
      const atEnd = scrollLeft + clientWidth >= scrollWidth - 10;
      if (atEnd) {
        rail.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        const pane = rail.querySelector<HTMLElement>(".process-pane");
        const step = pane ? pane.offsetWidth + parseInt(getComputedStyle(rail).gap || "0") : clientWidth;
        rail.scrollBy({ left: step, behavior: "smooth" });
      }
    }, INTERVAL_MS);

    rail.addEventListener("pointerdown", pause);
    rail.addEventListener("pointerup", resume);
    rail.addEventListener("touchstart", pause, { passive: true });
    rail.addEventListener("touchend", resume);

    return () => {
      clearInterval(timer);
      rail.removeEventListener("pointerdown", pause);
      rail.removeEventListener("pointerup", resume);
      rail.removeEventListener("touchstart", pause);
      rail.removeEventListener("touchend", resume);
    };
  }, []);

  return (
    <div ref={railRef} className="process-strip__rail" tabIndex={0} aria-roledescription="carousel">
      {children}
    </div>
  );
}
