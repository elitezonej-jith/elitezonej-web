"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/products";
import { fmtINR } from "@/lib/format";
import { ANGLES, ANGLE_LABELS, imgSrc } from "@/lib/images";
import { useCart, lineId } from "../../components/CartProvider";
import WishlistButton from "../../components/WishlistButton";
import Reveal from "../../components/Reveal";
import SectionHead from "../../components/SectionHead";
import ZoomLens from "../../components/ZoomLens";
import Lightbox from "./Lightbox";

type Props = {
  product: Product;
  setCurrentSlug: (slug: string) => void;
  related: Product[];
};

export default function TailoredPDP({ product, setCurrentSlug, related }: Props) {
  const { addItem } = useCart();
  const [angleIdx, setAngleIdx] = useState(0);
  const [sizeOn, setSizeOn] = useState("");
  const [lbOpen, setLbOpen] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [sizePrompt, setSizePrompt] = useState(false);
  const sizeBlockRef = useRef<HTMLDivElement>(null);

  // Reset gallery + size when the product changes
  useEffect(() => {
    setAngleIdx(0);
    setSizeOn("");
    setSizePrompt(false);
  }, [product.slug]);

  const handleAddToBag = () => {
    if (!sizeOn) {
      setSizePrompt(true);
      sizeBlockRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    addItem({
      id: lineId(product.slug, { size: sizeOn }),
      slug: product.slug,
      name: product.name,
      unitPrice: product.salePrice ?? product.price,
      qty: 1,
      size: sizeOn,
      imageSrc: imgSrc(product.slug, "01-front"),
    });
  };

  useEffect(() => {
    const d = new Date(Date.now() + 7 * 86400000);
    setDeliveryDate(d.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long" }));
  }, []);

  const others = related;
  const lightboxImages = ANGLES.map((a, i) => ({
    src: imgSrc(product.slug, a),
    alt: `${product.name} ${ANGLE_LABELS[i]}`,
  }));

  return (
    <>
      <section className="pd">
        <div className="thumbs">
          {ANGLES.map((a, i) => (
            <div
              key={a}
              className={`thumb ${i === angleIdx ? "on" : ""}`}
              role="button"
              tabIndex={0}
              aria-label={`Show ${ANGLE_LABELS[i]} view`}
              aria-pressed={i === angleIdx}
              onClick={() => setAngleIdx(i)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setAngleIdx(i); } }}
            >
              <Image
                src={imgSrc(product.slug, a)}
                alt={`${ANGLE_LABELS[i]} view`}
                fill
                sizes="88px"
                loading="lazy"
              />
              <span className="num">0{i + 1}</span>
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
          {ANGLES.map((a, i) => (
            <div key={a} className={`photo ${i === angleIdx ? "show" : ""}`}>
              <Image
                src={imgSrc(product.slug, a)}
                alt={`${product.name} ${ANGLE_LABELS[i]}`}
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
          imageSrc={imgSrc(product.slug, ANGLES[angleIdx])}
        />

        <div className="info">
          <div className="ix t-mono-xs">{product.cat}</div>
          <div className="title-row">
            <h1>{product.name}</h1>
            <WishlistButton slug={product.slug} name={product.name} size="md" onTopOfImage={false} />
          </div>
          <p className="editorial-line">{product.line}</p>

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

          <div className="field-block" ref={sizeBlockRef}>
            <div className="head">
              <label>Size</label>
              <a href="/size-guide">Size guide</a>
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
          </div>

          <div className="ctas">
            <button
              type="button"
              className="btn btn-primary btn-lg btn-block"
              onClick={handleAddToBag}
            >
              {sizeOn ? "Add to bag" : "Choose a size"}
            </button>
            <Link className="btn btn-secondary btn-block" href="/bespoke#book">Book a fitting</Link>
          </div>

          <div className="delivery">
            <div className="pin" aria-hidden="true">110001</div>
            <div className="text">
              {deliveryDate
                ? <>Delivered by <b>{deliveryDate}</b> · Free shipping</>
                : <>Free shipping · delivery in 3–5 working days</>}
            </div>
          </div>
          <div className="returns-line t-mono-xs">7-day returns · Free reverse pickup · Cash on delivery available</div>

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

      <section className="note">
        <div className="note-grain" aria-hidden="true" />
        <div className="ix t-mono-xs">Designer&apos;s note · 03</div>
        <div className="body">
          <div className="portrait" aria-hidden="true"></div>
          <div>
            <p>{product.note}</p>
            <div className="note-signature" aria-hidden="true">
              <svg viewBox="0 0 220 60" width="180" height="50">
                <path
                  d="M8 38 C 18 18, 34 14, 44 32 C 50 44, 38 50, 30 44 M 52 28 L 60 22 L 64 36 L 70 22 L 78 36 L 86 22 M 96 18 C 92 28, 100 38, 110 32 C 120 26, 116 14, 106 18 C 100 20, 96 28, 100 36 L 116 36 M 128 22 L 132 38 L 142 22 M 138 22 L 144 38 M 156 14 C 156 14, 156 38, 158 40 C 162 44, 170 38, 172 30 C 174 22, 168 16, 162 22 M 184 18 L 184 40 M 184 28 C 184 22, 192 18, 200 22 C 206 26, 204 36, 198 40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="signed t-mono-xs">— <b>Aman Gupta</b>, Lead Designer · Twelve years on the bench</div>
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
          <div>Free returns within 7 days of delivery. Free reverse pickup across all major Indian cities.</div>
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
                <div className="plate" style={{ position: "relative" }}>
                  <a
                    href={`/products/${p.slug}`}
                    aria-label={p.name}
                    onClick={(e) => { e.preventDefault(); setCurrentSlug(p.slug); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  >
                    <Image
                      src={imgSrc(p.slug, "01-front")}
                      alt={p.name}
                      fill
                      sizes="(max-width: 720px) 100vw, 33vw"
                      loading="lazy"
                    />
                  </a>
                  <WishlistButton slug={p.slug} name={p.name} />
                </div>
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
