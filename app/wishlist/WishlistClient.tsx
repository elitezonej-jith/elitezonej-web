"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useCallback } from "react";
import { PRODUCTS } from "@/lib/products";
import { fmtINR } from "@/lib/format";
import { imgFabric, imgSrc } from "@/lib/images";
import { useWishlist } from "../components/WishlistProvider";
import { useCart, lineId } from "../components/CartProvider";
import WishlistButton from "../components/WishlistButton";
import ConfirmSheet from "../components/ConfirmSheet";
import "../styles/wishlist.css";

const REMOVE_ANIM_MS = 420;

export default function WishlistClient() {
  const { slugs, count, hydrated, remove, clear } = useWishlist();
  const { addItem } = useCart();
  const [leaving, setLeaving] = useState<Set<string>>(new Set());
  const [confirmClear, setConfirmClear] = useState(false);

  const handleRemove = useCallback((slug: string) => {
    setLeaving(prev => {
      if (prev.has(slug)) return prev;
      const next = new Set(prev);
      next.add(slug);
      return next;
    });
    setTimeout(() => {
      remove(slug);
      setLeaving(prev => {
        const next = new Set(prev);
        next.delete(slug);
        return next;
      });
    }, REMOVE_ANIM_MS);
  }, [remove]);

  const items = slugs
    .map(slug => PRODUCTS.find(p => p.slug === slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const moveAll = () => {
    for (const p of items) {
      if (p.kind === "fabric") {
        const colour = p.colourVariants?.[0] ?? (p.colour && p.colourHex ? { name: p.colour, hex: p.colourHex } : null);
        if (!colour) continue;
        addItem({
          id: lineId(p.slug, { colour: colour.name }),
          slug: p.slug, name: p.name, unitPrice: p.price, qty: 1,
          colour: colour.name, isFabric: true,
          imageSrc: imgFabric(p.slug, colour.name, "front"),
        });
      }
      // Tailored items skip — they need a size pick on the PDP
    }
  };

  const fabricCount = items.filter(p => p.kind === "fabric").length;

  return (
    <>
      <section className="wl-head">
        <h1>Your wishlist</h1>
        <div className="actions">
          <span className="meta t-mono-xs">
            {hydrated ? `${count} saved · ${fabricCount} ready to add` : "Loading…"}
          </span>
          {hydrated && fabricCount > 0 && (
            <button className="btn btn-secondary btn-sm" type="button" onClick={moveAll}>
              Move {fabricCount} fabric{fabricCount === 1 ? "" : "s"} to bag
            </button>
          )}
          {hydrated && count > 0 && (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              style={{ background: "none", border: 0, color: "var(--ink-2)", fontSize: 12, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}
            >Clear all</button>
          )}
        </div>
      </section>

      <section className="wl-wrap">
        {!hydrated ? (
          <div className="wl-grid" aria-busy="true">
            {[0, 1, 2].map(i => (
              <div key={i} className="wl-card wl-skel" aria-hidden="true">
                <div className="plate skel-shimmer" />
                <div className="meta">
                  <div className="skel-line skel-shimmer" style={{ width: "62%" }} />
                  <div className="skel-line skel-shimmer" style={{ width: "38%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="wl-empty">
            <div className="h">Nothing saved yet.</div>
            <p>Tap the heart on any piece to save it here. We&apos;ll keep it on this device — no account needed.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link className="btn btn-primary" href="/collection?c=men">Shop menswear</Link>
              <Link className="btn btn-secondary" href="/collection?c=women">Shop womenswear</Link>
              <Link className="btn btn-secondary" href="/collection?c=fabrics">Browse fabrics</Link>
            </div>
          </div>
        ) : (
          <div className="wl-grid">
            {items.map(p => {
              const isFab = p.kind === "fabric";
              const colour = p.colourVariants?.[0] ?? (p.colour && p.colourHex ? { name: p.colour, hex: p.colourHex } : null);
              const src = isFab && colour
                ? imgFabric(p.slug, colour.name, "front")
                : imgSrc(p.slug, "01-front");
              const isLeaving = leaving.has(p.slug);
              return (
                <div
                  key={p.slug}
                  className={`wl-card${isLeaving ? " is-leaving" : ""}`}
                  aria-hidden={isLeaving}
                >
                  <div className="plate" style={isFab && p.colourHex ? { backgroundColor: p.colourHex } : undefined}>
                    <Link href={`/products/${p.slug}`} aria-label={p.name}>
                      <Image src={src} alt={p.name} fill sizes="(max-width: 520px) 100vw, (max-width: 900px) 50vw, 33vw" loading="lazy" />
                    </Link>
                    <WishlistButton slug={p.slug} name={p.name} />
                  </div>
                  <div className="meta">
                    <Link href={`/products/${p.slug}`} className="name">{p.name}</Link>
                    <div className="row">
                      <span className="price">
                        {fmtINR(p.salePrice ?? p.price)}{isFab ? " / m" : ""}
                      </span>
                      <span className="tag">
                        {isFab ? `Colour · ${p.colour}` : `${p.fabric} · ${p.fit}`}
                      </span>
                    </div>
                    <div className="actions">
                      {isFab && colour ? (
                        <button
                          className="btn btn-primary"
                          type="button"
                          onClick={() => {
                            addItem({
                              id: lineId(p.slug, { colour: colour.name }),
                              slug: p.slug, name: p.name, unitPrice: p.price, qty: 1,
                              colour: colour.name, isFabric: true,
                              imageSrc: imgFabric(p.slug, colour.name, "front"),
                            });
                          }}
                        >
                          Add 1m to bag
                        </button>
                      ) : (
                        <Link className="btn btn-primary" href={`/products/${p.slug}`}>
                          View options
                        </Link>
                      )}
                      <button
                        className="remove"
                        type="button"
                        onClick={() => handleRemove(p.slug)}
                        disabled={isLeaving}
                      >Remove</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <ConfirmSheet
        open={confirmClear}
        title="Clear your wishlist?"
        body="Every saved piece will be removed from this device."
        confirmLabel="Yes, clear"
        cancelLabel="Reconsider"
        onConfirm={() => { clear(); setConfirmClear(false); }}
        onCancel={() => setConfirmClear(false)}
      />
    </>
  );
}
