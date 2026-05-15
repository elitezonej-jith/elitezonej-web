"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "./CartProvider";
import { useModalA11y } from "./useModalA11y";
import { fmtINR, fmtMeters } from "@/lib/format";

export default function CartDrawer() {
  const { items, count, subtotal, hydrated, drawerOpen, openDrawer, closeDrawer, removeItem, updateQty } = useCart();
  const drawerRef = useModalA11y<HTMLElement>(drawerOpen, closeDrawer);

  // Header pill: show 00 until hydrated to avoid SSR/CSR mismatch
  const pill = hydrated ? String(count).padStart(2, "0") : "00";

  return (
    <>
      <button
        className="cart-trigger"
        aria-label={`Open bag, ${count} item${count === 1 ? "" : "s"}`}
        onClick={openDrawer}
      >
        <svg viewBox="0 0 448 512" width="24" height="24" fill="currentColor" aria-hidden="true">
          <path d="M352 128C352 57.421 294.579 0 224 0 153.42 0 96 57.421 96 128H0v304c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V128h-96zM224 32c52.935 0 96 43.065 96 96H128c0-52.935 43.065-96 96-96zm192 400c0 26.467-21.533 48-48 48H80c-26.467 0-48-21.533-48-48V160h64v48c0 8.837 7.164 16 16 16s16-7.163 16-16v-48h192v48c0 8.837 7.163 16 16 16s16-7.163 16-16v-48h64v272z" />
        </svg>
        {hydrated && count > 0 && <span key={count} className="bag-count">{pill}</span>}
      </button>

      <div
        className="cart-overlay"
        data-open={drawerOpen}
        aria-hidden={!drawerOpen}
        onClick={closeDrawer}
      />

      <aside
        ref={drawerRef}
        className="cart-drawer"
        data-open={drawerOpen}
        inert={!drawerOpen}
        role="dialog"
        aria-modal="true"
        aria-label="Bag"
        tabIndex={-1}
      >
        <header className="cart-drawer-head">
          <span>Your Bag ({pill})</span>
          <button className="close" aria-label="Close bag" onClick={closeDrawer}>×</button>
        </header>

        <div className="cart-drawer-body">
          {!hydrated ? (
            <p className="cart-stub">Loading…</p>
          ) : items.length === 0 ? (
            <div className="cart-empty">
              <p>Your bag is empty.</p>
              <Link className="btn btn-secondary" href="/collection?c=men" onClick={closeDrawer}>
                Continue shopping
              </Link>
            </div>
          ) : (
            <ul className="cart-lines" style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {items.map((it, i) => (
                <li
                  key={it.id}
                  className="cart-line"
                  style={{ ["--cl-i" as string]: i }}
                >
                  <Link href={`/products/${it.slug}`} onClick={closeDrawer} className="cart-line-img" aria-label={it.name}>
                    <Image src={it.imageSrc} alt={it.name} fill sizes="80px" />
                  </Link>
                  <div className="cart-line-info">
                    <div className="cart-line-top">
                      <Link href={`/products/${it.slug}`} onClick={closeDrawer} className="cart-line-name">{it.name}</Link>
                      <span className="cart-line-price">{fmtINR(it.unitPrice * it.qty)}</span>
                    </div>
                    <div className="cart-line-spec">
                      {it.colour && <span>Colour · {it.colour}</span>}
                      {it.size && <span>Size · {it.size}</span>}
                      <span>{it.isFabric ? fmtMeters(it.qty) : `Qty · ${it.qty}`}</span>
                    </div>
                    <div className="cart-line-actions">
                      <div className="cart-line-qty">
                        <button
                          aria-label="Decrease"
                          onClick={() => updateQty(it.id, it.qty - (it.isFabric ? 0.5 : 1))}
                        >−</button>
                        <span>{it.isFabric ? fmtMeters(it.qty) : it.qty}</span>
                        <button
                          aria-label="Increase"
                          onClick={() => updateQty(it.id, it.qty + (it.isFabric ? 0.5 : 1))}
                        >+</button>
                      </div>
                      <button className="cart-line-remove" onClick={() => removeItem(it.id)}>Remove</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="cart-drawer-foot">
          {hydrated && items.length > 0 && (
            <div className="cart-drawer-subtotal">
              <span>Subtotal</span>
              <b>{fmtINR(subtotal)}</b>
            </div>
          )}
          <Link className="btn btn-primary btn-block" href="/cart" onClick={closeDrawer}>
            View full bag
          </Link>
        </footer>
      </aside>

      {/* Drawer-line CSS, scoped to .cart-drawer to avoid leakage */}
      <style dangerouslySetInnerHTML={{ __html: `
        .cart-drawer-body { padding:0; overflow-y:auto; }
        .cart-line { display:grid; grid-template-columns:80px 1fr; gap:14px; padding:14px 16px; border-bottom:var(--rule); align-items:start; }
        .cart-line-img { display:block; width:80px; aspect-ratio:3/4; position:relative; background:var(--paper-2); overflow:hidden; }
        .cart-line-img img { object-fit:cover; }
        .cart-line-info { min-width:0; display:flex; flex-direction:column; gap:6px; }
        .cart-line-top { display:flex; justify-content:space-between; gap:10px; align-items:flex-start; }
        .cart-line-name { font-family:var(--font-display); font-weight:500; font-size:15px; line-height:1.25; color:var(--ink); text-decoration:none; }
        .cart-line-name:hover { color:var(--accent); }
        .cart-line-price { font-family:var(--font-mono); font-weight:500; font-size:13px; color:var(--ink); white-space:nowrap; }
        .cart-line-spec { display:flex; flex-wrap:wrap; gap:8px; color:var(--ink-3); font-family:var(--font-mono); font-size:10.5px; letter-spacing:.06em; text-transform:uppercase; }
        .cart-line-actions { display:flex; gap:14px; align-items:center; margin-top:4px; }
        .cart-line-qty { display:inline-flex; border:1px solid var(--paper-3); }
        .cart-line-qty button { background:transparent; border:0; padding:6px 12px; min-width:36px; min-height:36px; cursor:pointer; font-family:var(--font-mono); font-size:13px; color:var(--ink); }
        .cart-line-qty button:hover { background:var(--paper-2); }
        .cart-line-qty span { padding:4px 10px; font-family:var(--font-mono); font-size:12px; min-width:36px; text-align:center; border-left:1px solid var(--paper-3); border-right:1px solid var(--paper-3); }
        .cart-line-remove { background:none; border:0; color:var(--ink-3); font-size:12px; cursor:pointer; text-decoration:underline; text-underline-offset:3px; }
        .cart-line-remove:hover { color:var(--accent); }
        .cart-drawer-subtotal { display:flex; justify-content:space-between; padding:12px 0; font-family:var(--font-mono); font-size:13px; color:var(--ink); }
        .cart-drawer-subtotal b { font-family:var(--font-display); font-style:normal; font-weight:600; font-size:18px; }
      `}} />
    </>
  );
}
