"use client";
import { useEffect, useRef, useState } from "react";

// Circular magnifier overlay that follows the cursor over a product
// image. Renders only on desktop (no hover:none, no reduced-motion).
//
//   targetSelector — querySelector for the container the lens reacts to
//   imageSrc       — the high-res image to magnify
//   zoom           — magnification factor (default 1.5)
//   size           — lens diameter in px (default 120)
type Props = {
  targetSelector: string;
  imageSrc: string;
  zoom?: number;
  size?: number;
};

export default function ZoomLens({ targetSelector, imageSrc, zoom = 1.5, size = 120 }: Props) {
  const [pos, setPos] = useState<{ x: number; y: number; bgX: number; bgY: number; w: number; h: number } | null>(null);
  const targetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(hover: none)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const target = document.querySelector<HTMLElement>(targetSelector);
    if (!target) return;
    targetRef.current = target;

    const onMove = (e: MouseEvent) => {
      const rect = target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        setPos(null);
        return;
      }
      // Pixel-based: place the zoomed image so the cursor point maps to
      // the lens centre. bgX/bgY are the px offsets for backgroundPosition.
      const bgX = -(x * zoom - size / 2);
      const bgY = -(y * zoom - size / 2);
      setPos({ x: e.clientX, y: e.clientY, bgX, bgY, w: rect.width, h: rect.height });
    };
    const onLeave = () => setPos(null);

    target.addEventListener("mousemove", onMove);
    target.addEventListener("mouseleave", onLeave);
    return () => {
      target.removeEventListener("mousemove", onMove);
      target.removeEventListener("mouseleave", onLeave);
    };
  }, [targetSelector]);

  if (!pos) return null;

  return (
    <div
      className="zoom-lens"
      style={{
        left: pos.x,
        top: pos.y,
        width: size,
        height: size,
        backgroundImage: `url(${imageSrc})`,
        backgroundSize: `${pos.w * zoom}px ${pos.h * zoom}px`,
        backgroundPosition: `${pos.bgX}px ${pos.bgY}px`,
      }}
      aria-hidden="true"
    />
  );
}
