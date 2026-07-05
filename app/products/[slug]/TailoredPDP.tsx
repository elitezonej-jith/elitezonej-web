"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/products";
import type { ReviewAggregate } from "@/lib/admin/repos/product-reviews";
import { fmtINR } from "@/lib/format";
import { ANGLES, ANGLE_LABELS, imgSrc } from "@/lib/images";
import { useCart, lineId } from "../../components/CartProvider";
import WishlistButton from "../../components/WishlistButton";
import ShareButton from "../../components/ShareButton";
import Reveal from "../../components/Reveal";
import SectionHead from "../../components/SectionHead";
import ZoomLens from "../../components/ZoomLens";
import Lightbox from "./Lightbox";

type Props = {
  product: Product;
  setCurrentSlug: (slug: string) => void;
  related: Product[];
  leadTimeDays: number;
  reviewAggregate: ReviewAggregate;
};

export default function TailoredPDP({ product, setCurrentSlug, related, leadTimeDays, reviewAggregate }: Props) {
  const deliveryRange = product.deliveryMinDays
    ? product.deliveryMaxDays
      ? `${product.deliveryMinDays}–${product.deliveryMaxDays} working days`
      : `${product.deliveryMinDays}–${product.deliveryMinDays + 2} working days`
    : product.category === "accessories"
      ? "7 to 10 working days"
      : `${leadTimeDays}–${leadTimeDays + 2} working days`;
  const { addItem } = useCart();
  const [angleIdx, setAngleIdx] = useState(0);
  const [sizeOn, setSizeOn] = useState("");
  const [lbOpen, setLbOpen] = useState(false);
  const [sizePrompt, setSizePrompt] = useState(false);
  const sizeBlockRef = useRef<HTMLDivElement>(null);

  // Colour swatch state
  const colours = product.productColours ?? [];
  const [selectedColour, setSelectedColour] = useState<{ id: number; name: string; hex: string } | null>(
    () => {
      const def = colours.find((c) => c.is_default === 1) ?? colours[0];
      return def ? { id: def.id, name: def.name, hex: def.hex } : null;
    }
  );

  // Reset gallery + size when the product changes
  useEffect(() => {
    setAngleIdx(0);
    setSizeOn("");
    setSizePrompt(false);
    const def = (product.productColours ?? []).find((c) => c.is_default === 1) ?? (product.productColours ?? [])[0];
    setSelectedColour(def ? { id: def.id, name: def.name, hex: def.hex } : null);
  }, [product.slug, product.productColours]);

  const handleAddToBag = () => {
    if (!sizeOn) {
      setSizePrompt(true);
      sizeBlockRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    addItem({
      id: lineId(product.slug, { size: sizeOn, colour: selectedColour?.name }),
      slug: product.slug,
      name: product.name,
      unitPrice: product.salePrice ?? product.price,
      qty: 1,
      size: sizeOn,
      colour: selectedColour?.name,
      imageSrc: finalGallerySrcs[0] ?? product.thumbnail ?? product.images?.[0] ?? imgSrc(product.slug, "01-front"),
    });
  };

  const others = related;
  // Prefer uploaded images (product_images table, set in Studio) when present;
  // fall back to the legacy /generated/<slug>/<angle>.webp filesystem layout
  // so seeded products keep rendering.
  const allImages: string[] = product.images && product.images.length > 0
    ? product.images
    : ANGLES.map((a) => imgSrc(product.slug, a));
  // Filter by selected colour when imageColourMap exists
  const gallerySrcs: string[] = (selectedColour && product.imageColourMap)
    ? allImages.filter((src) => {
        const cid = product.imageColourMap![src];
        return cid === selectedColour.id || cid === null || cid === undefined;
      })
    : allImages;
  // If filtering removed all images, try shared (unassigned) images first, then all
  const sharedImages = product.imageColourMap
    ? allImages.filter((src) => { const cid = product.imageColourMap![src]; return cid === null || cid === undefined; })
    : allImages;
  const finalGallerySrcs = gallerySrcs.length > 0 ? gallerySrcs : (sharedImages.length > 0 ? sharedImages : allImages);
  const galleryAlts: string[] = finalGallerySrcs.map((_, i) => ANGLE_LABELS[i] ?? `View ${i + 1}`);
  const safeAngleIdx = Math.min(angleIdx, Math.max(0, finalGallerySrcs.length - 1));
  const lightboxImages = finalGallerySrcs.map((src, i) => ({
    src,
    alt: `${product.name} ${galleryAlts[i]}`,
  }));

  return (
    <>
      <section className="pd">
        <div className="thumbs">
          {finalGallerySrcs.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className={`thumb ${i === safeAngleIdx ? "on" : ""}`}
              role="button"
              tabIndex={0}
              aria-label={`Show ${galleryAlts[i]} view`}
              aria-pressed={i === safeAngleIdx}
              onClick={() => setAngleIdx(i)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setAngleIdx(i); } }}
            >
              <Image
                src={src}
                alt={`${galleryAlts[i]} view`}
                fill
                sizes="88px"
                loading="lazy"
              />
              <span className="num">{String(i + 1).padStart(2, "0")}</span>
              {product.imageColourMap && product.imageColourMap[src] != null && product.productColours && (
                <span className="thumb-colour-dot" style={{ backgroundColor: product.productColours.find(c => c.id === product.imageColourMap![src])?.hex }} />
              )}
            </div>
          ))}
        </div>

        <div
          className="main"
          role="button"
          tabIndex={0}
          aria-label="Open full-screen image viewer"
          onClick={() => setLbOpen(true)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setLbOpen(true); } }}
          data-zoom-host="tailored"
        >
          {finalGallerySrcs.map((src, i) => (
            <div key={`${src}-${i}`} className={`photo ${i === safeAngleIdx ? "show" : ""}`}>
              <Image
                src={src}
                alt={`${product.name} ${galleryAlts[i]}`}
                fill
                sizes="(max-width: 1100px) 100vw, 60vw"
                priority={i === 0}
              />
            </div>
          ))}
          <span className="zoom-hint t-mono-xs">Move cursor to zoom · Click for full</span>
        </div>
        <ZoomLens
          targetSelector="[data-zoom-host='tailored']"
          imageSrc={finalGallerySrcs[safeAngleIdx]}
        />

        <div className="info">
          <div className="ix t-mono-xs">{product.cat}</div>
          <div className="title-row">
            <h1>{product.name}</h1>
            <WishlistButton slug={product.slug} name={product.name} size="md" onTopOfImage={false} />
            <ShareButton slug={product.slug} name={product.name} line={product.line} />
          </div>
          <p className="editorial-line">{product.line}</p>

          <a href="#reviews" className="pdp-rating-row" aria-label={reviewAggregate.count > 0 ? `Rated ${reviewAggregate.avg.toFixed(1)} out of 5, ${reviewAggregate.count} reviews` : "No reviews yet"}>
            <span className="pdp-rating-stars" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className={i <= Math.round(reviewAggregate.avg) ? "pdp-star on" : "pdp-star"}>★</span>
              ))}
            </span>
            {reviewAggregate.count > 0 ? (
              <span className="pdp-rating-text">{reviewAggregate.avg.toFixed(1)} ({reviewAggregate.count} review{reviewAggregate.count === 1 ? "" : "s"})</span>
            ) : (
              <span className="pdp-rating-text">No reviews yet</span>
            )}
          </a>

          <div className="price-row">
            {product.salePrice ? (
              <>
                <span className="price price-sale">{fmtINR(product.salePrice)}</span>
                <span className="price price-orig">{fmtINR(product.price)}</span>
              </>
            ) : (
              <span className="price">{fmtINR(product.price)}</span>
            )}
            <span className="tax-line">Inclusive of all taxes</span>
          </div>

          {colours.length > 1 && product.imageColourMap && Object.values(product.imageColourMap).some((cid) => cid != null) && (
            <div className="field-block">
              <div className="head"><label>Colour{selectedColour ? ` — ${selectedColour.name}` : ""}</label></div>
              <div className="colour-swatches">
                {colours.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`colour-swatch${selectedColour?.id === c.id ? " on" : ""}`}
                    style={{ backgroundColor: c.hex }}
                    aria-label={c.name}
                    aria-pressed={selectedColour?.id === c.id}
                    onClick={() => { setSelectedColour({ id: c.id, name: c.name, hex: c.hex }); setAngleIdx(0); }}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="field-block" ref={sizeBlockRef}>
            <div className="head">
              <label>Size</label>
              <a href={product.sizeGuide ? "#size-guide" : "/size-guide"}>Size guide</a>
            </div>
            <div className="sizes" style={sizePrompt ? { outline: "2px solid var(--accent)", outlineOffset: 6 } : undefined}>
              {product.sizes.map(s => {
                const oos = s.endsWith("-oos");
                const v = oos ? s.replace("-oos", "") : s;
                const isOn = sizeOn === v && !oos;
                const cls = oos ? "size oos" : (isOn ? "size on" : "size");
                return (
                  <button key={s} className={cls} disabled={oos} onClick={() => { if (!oos) { setSizeOn(v); setSizePrompt(false); } }}>
                    {v}
                  </button>
                );
              })}
            </div>
            <p aria-live="polite" className="t-mono-xs" style={{ minHeight: 16, marginTop: 8, color: "var(--accent)" }}>
              {sizePrompt ? "Pick a size to add this to your bag." : ""}
            </p>
            <Link
              className="t-body-sm"
              href="/bespoke"
              style={{ marginTop: "var(--s-3)", display: "inline-block", color: "var(--ink-2)", textDecoration: "underline", textUnderlineOffset: "3px" }}
            >
              Don&apos;t know your size? Get measured at home →
            </Link>
            {product.sizeGuide ? (
              <details id="size-guide" className="pdp-size-guide" style={{ marginTop: "var(--s-4)" }}>
                <summary className="t-mono-xs" style={{ cursor: "pointer", color: "var(--ink-2)", textDecoration: "underline", textUnderlineOffset: "3px" }}>
                  Size guide for this piece
                </summary>
                <div className="t-body-sm" style={{ marginTop: "var(--s-3)", whiteSpace: "pre-wrap", color: "var(--ink-2)" }}>
                  {product.sizeGuide}
                </div>
              </details>
            ) : null}
          </div>

          <div className="ctas">
            <button
              type="button"
              className="btn btn-primary btn-lg btn-block"
              onClick={handleAddToBag}
            >
              {sizeOn ? "Add to bag" : "Choose a size"}
            </button>
          </div>

          <div className="delivery">
            <div className="pin" aria-hidden="true">110001</div>
            <div className="text">
              Delivery in <b>{deliveryRange}</b>
              {product.price >= 5000 && <> · Free shipping</>}
            </div>
          </div>
          <div className="returns-line t-mono-xs">3-day returns · Free reverse pickup</div>

          <div className="feature-list">
            <h4>Features</h4>
            <ul>
              {product.features.map((f) => <li key={f}>{f}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="spec">
        <div className="inner">
          <div>
            <div className="ix t-mono-xs">Specification · 02</div>
            <h2>The cloth, cut, and construction.</h2>
          </div>
          <div>
            <table>
              <tbody>
                {product.spec.map(([k, v]) => (
                  <tr key={k}><td className="k">{k}</td><td className="v">{v}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="info-acc">
        <details>
          <summary>Delivery</summary>
          <div>Standard delivery is free across India and arrives in 3–5 working days. Express delivery available at checkout. International orders ship via DHL; duties calculated at checkout.</div>
        </details>
        <details>
          <summary>Returns</summary>
          <div>Free returns within 3 days of delivery. Free reverse pickup across all major Indian cities.</div>
        </details>
        <details>
          <summary>Care</summary>
          <div>Dry-clean only, infrequently. Steam between wears to refresh. Hang on a wide wooden hanger; do not fold for storage.</div>
        </details>
      </section>

      <section className="worn">
        <div className="inner">
          <SectionHead
            numeral={4}
            eyebrow="Complete the look"
            title="Pieces that wear together."
            meta="Curated by the design team"
          />
          <div className="grid">
            {others.map((p, i) => (
              <Reveal as="div" key={p.slug} className="pcard" delay={i as 0 | 1 | 2}>
                <PdpPlate slug={p.slug} name={p.name} src={p.thumbnail || p.images?.[0] || imgSrc(p.slug, "01-front")} onNav={() => { setCurrentSlug(p.slug); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
                <a
                  href={`/products/${p.slug}`}
                  className="meta-link"
                  onClick={(e) => { e.preventDefault(); setCurrentSlug(p.slug); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                >
                  <div className="meta">
                    <h3 className="name">{p.name}</h3>
                    <div className="row">
                      <span className="price">{fmtINR(p.price)}</span>
                      <span className="tag">{p.fabric} · {p.fit}</span>
                    </div>
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Lightbox
        open={lbOpen}
        onClose={() => setLbOpen(false)}
        images={lightboxImages}
        index={angleIdx}
        setIndex={setAngleIdx}
      />

      <div className="pdp-buy-bar" role="region" aria-label="Add to bag">
        <div className="pdp-buy-bar__price">
          <span className="lbl">Total</span>
          <span className="amt">{fmtINR(product.salePrice ?? product.price)}</span>
        </div>
        <button
          type="button"
          className="pdp-buy-bar__cta"
          onClick={handleAddToBag}
        >
          {sizeOn ? "Add to bag" : "Choose a size"}
        </button>
      </div>
    </>
  );
}

function PdpPlate({ slug, name, src, onNav }: { slug: string; name: string; src: string; onNav: () => void }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="plate" data-loaded={loaded || undefined} style={{ position: "relative" }}>
      <a href={`/products/${slug}`} aria-label={name} onClick={(e) => { e.preventDefault(); onNav(); }}>
        <Image className="primary" src={src} alt={name} fill sizes="(max-width: 720px) 100vw, 33vw" loading="lazy" onLoad={() => setLoaded(true)} />
      </a>
      <WishlistButton slug={slug} name={name} />
    </div>
  );
}