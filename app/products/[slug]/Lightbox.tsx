"use client";
import { useEffect } from "react";
import Image from "next/image";
import { useModalA11y } from "../../components/useModalA11y";

type Props = {
  open: boolean;
  onClose: () => void;
  images: { src: string; alt: string }[];
  index: number;
  setIndex: (updater: (i: number) => number) => void;
};

export default function Lightbox({ open, onClose, images, index, setIndex }: Props) {
  // Focus trap + Escape + return-focus + scroll lock (shared modal a11y).
  const dialogRef = useModalA11y<HTMLDivElement>(open, onClose);

  // Arrow-key navigation is lightbox-specific; Escape/focus/scroll are handled
  // by useModalA11y above.
  useEffect(() => {
    if (!open) return;
    const len = images.length;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setIndex(i => (i - 1 + len) % len);
      if (e.key === "ArrowRight") setIndex(i => (i + 1) % len);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, images.length, setIndex]);

  if (!open || images.length === 0) return null;

  const len = images.length;
  const current = images[index];

  return (
    <div
      ref={dialogRef}
      className="lightbox"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Product image viewer"
    >
      <button className="lb-close t-mono-xs" onClick={onClose}>CLOSE</button>
      <button className="lb-nav lb-prev" onClick={() => setIndex(i => (i - 1 + len) % len)}>←</button>
      <div className="img-wrap">
        <Image src={current.src} alt={current.alt} fill sizes="92vw" priority />
      </div>
      <button className="lb-nav lb-next" onClick={() => setIndex(i => (i + 1) % len)}>→</button>
      <span className="lb-counter">0{index + 1} / 0{len}</span>
    </div>
  );
}
