"use client";

import { useEffect, useRef, useState } from "react";
import { Product } from "@/lib/products";
import { imgFabric, imgSrc } from "@/lib/images";
import { useCart, lineId } from "./CartProvider";

/** Quick-add for product cards.
 *  - Tailored: button → expands an inline size-chip strip on click; click a size to add.
 *  - Fabric: button → directly adds 1m of the primary colour.
 *  Always stops the click from bubbling to a wrapping <Link>.
 */
export default function QuickAddButton({
  product,
  className = "",
  variant = "overlay",
}: {
  product: Product;
  className?: string;
  /** "overlay" sits over the bottom of the card image; "inline" sits in the meta row */
  variant?: "overlay" | "inline";
}) {
  const { addItem } = useCart();
  const [showSizes, setShowSizes] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close size strip on outside click / ESC
  useEffect(() => {
    if (!showSizes) return;
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setShowSizes(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowSizes(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [showSizes]);

  const isFabric = product.kind === "fabric";

  const stop = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  if (isFabric) {
    const colour = product.colourVariants?.[0] ?? (product.colour && product.colourHex
      ? { name: product.colour, hex: product.colourHex }
      : null);
    if (!colour) return null;
    return (
      <button
        type="button"
        className={`qa-btn qa-${variant} ${className}`}
        onClick={(e) => {
          stop(e);
          addItem({
            id: lineId(product.slug, { colour: colour.name }),
            slug: product.slug,
            name: product.name,
            unitPrice: product.salePrice ?? product.price,
            qty: 1,
            colour: colour.name,
            imageSrc: imgFabric(product.slug, colour.name, "front"),
            isFabric: true,
          });
        }}
      >
        Add 1m to bag
      </button>
    );
  }

  // Tailored
  const inStock = product.sizes.filter(s => !s.endsWith("-oos"));
  const oos = product.sizes.filter(s => s.endsWith("-oos")).map(s => s.replace("-oos", ""));

  if (inStock.length === 0) {
    return (
      <button type="button" className={`qa-btn qa-${variant} ${className}`} disabled>
        Sold out
      </button>
    );
  }

  if (!showSizes) {
    return (
      <button
        type="button"
        className={`qa-btn qa-${variant} ${className}`}
        onClick={(e) => { stop(e); setShowSizes(true); }}
        aria-haspopup="true"
        aria-expanded={false}
      >
        Add to bag
      </button>
    );
  }

  return (
    <div ref={containerRef} className={`qa-sizes qa-${variant} ${className}`} role="group" aria-label="Pick a size to add to bag">
      <span className="qa-label">Size</span>
      <div className="qa-size-row">
        {product.sizes.map(raw => {
          const isOos = raw.endsWith("-oos");
          const s = isOos ? raw.replace("-oos", "") : raw;
          return (
            <button
              key={raw}
              type="button"
              className={`qa-size${isOos ? " oos" : ""}`}
              disabled={isOos}
              onClick={(e) => {
                stop(e);
                if (isOos) return;
                addItem({
                  id: lineId(product.slug, { size: s }),
                  slug: product.slug,
                  name: product.name,
                  unitPrice: product.salePrice ?? product.price,
                  qty: 1,
                  size: s,
                  imageSrc: imgSrc(product.slug, "01-front"),
                });
                setShowSizes(false);
              }}
            >
              {s}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className="qa-close"
        aria-label="Cancel"
        onClick={(e) => { stop(e); setShowSizes(false); }}
      >×</button>
    </div>
  );
}
