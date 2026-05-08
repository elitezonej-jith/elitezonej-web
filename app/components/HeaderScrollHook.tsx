"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Small client hook that toggles html[data-scrolled="true"] when the
// page has scrolled past 60px. CSS in page-chrome.css consumes that
// attribute to slim the header. Skipped on /admin — workbook has its own chrome.
export default function HeaderScrollHook() {
  const pathname = usePathname();
  const onAdmin = pathname?.startsWith("/admin") ?? false;
  useEffect(() => {
    if (onAdmin) return;
    const root = document.documentElement;
    let raf = 0;
    const apply = () => {
      raf = 0;
      root.dataset.scrolled = window.scrollY > 60 ? "true" : "false";
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [onAdmin]);
  return null;
}
