"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// Circle is r=20 around a 44x44 SVG viewbox → circumference = 2π · 20 ≈ 125.66
const CIRC = 125.66;
const SHOW_THRESHOLD = 400;

export default function BackToTop() {
  const pathname = usePathname();
  const onAdmin = pathname?.startsWith("/admin") ?? false;
  const [show, setShow] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (onAdmin) return;
    let raf = 0;
    const apply = () => {
      raf = 0;
      const sy = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setShow(sy > SHOW_THRESHOLD);
      setProgress(max > 0 ? Math.min(1, sy / max) : 0);
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [onAdmin]);

  const click = () => window.scrollTo({ top: 0, behavior: "smooth" });

  if (onAdmin) return null;

  return (
    <button
      type="button"
      className={`back-to-top${show ? " is-visible" : ""}`}
      onClick={click}
      aria-label="Back to top"
      tabIndex={show ? 0 : -1}
    >
      <svg className="btt-ring" viewBox="0 0 44 44" aria-hidden="true">
        <circle className="btt-track" cx="22" cy="22" r="20" />
        <circle
          className="btt-fill"
          cx="22"
          cy="22"
          r="20"
          style={{ strokeDashoffset: CIRC - CIRC * progress }}
        />
      </svg>
      <span className="btt-arrow" aria-hidden="true">↑</span>
      <span className="btt-pct" aria-hidden="true">{Math.round(progress * 100)}</span>
    </button>
  );
}
