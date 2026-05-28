"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Product } from "@/lib/products";
import { fmtINR, fmtMeters } from "@/lib/format";
import { FABRIC_ANGLES, FABRIC_ANGLE_LABELS, FabricAngle, imgFabric } from "@/lib/images";
import { useCart, lineId } from "../../components/CartProvider";
import WishlistButton from "../../components/WishlistButton";
import ZoomLens from "../../components/ZoomLens";
import Lightbox from "./Lightbox";

const QTY_MIN = 0.5;
const QTY_STEP = 0.5;
const QTY_PRESETS = [1, 2, 5, 10, 20];

type Props = { product: Product; leadTimeDays: number };

export default function FabricPDP({ product, leadTimeDays }: Props) {
  const deliveryRange = `${leadTimeDays}–${leadTimeDays + 2} working days`;
  const router = useRouter();
  const { addItem } = useCart();
  const [colourIdx, setColourIdx] = useState(0);
  const [angleIdx, setAngleIdx] = useState(0);
  const [qtyMeters, setQtyMeters] = useState(1);
  const [qtyText, setQtyText] = useState("1");
  const [lbOpen, setLbOpen] = useState(false);

  const colours = product.colourVariants ?? (product.colour && product.colourHex
    ? [{ name: product.colour, hex: product.colourHex }]
    : []);
  const activeColour = colours[colourIdx] ?? colours[0];
  const primaryColour = colours[0];
  const stockMeters = product.fabricMeta?.stockMeters ?? 50;
  const lowStock = stockMeters <= 10;

  // Reset gallery + colour + qty when product changes
  useEffect(() => {
    setAngleIdx(0); setColourIdx(0); setQtyMeters(1); setQtyText("1");
  }, [product.slug]);

  // Uploaded images (product_images via Studio) take precedence over the
  // legacy /generated/<slug>/<colour>/<angle>.webp filesystem layout.
  const uploadedImages = product.images ?? [];
  function fabricImg(angle: FabricAngle) {
    // If the operator uploaded images in Studio, use them in order —
    // FABRIC_ANGLES has 4 entries (front/drape/lay/detail); map by index.
    if (uploadedImages.length > 0) {
      const idx = FABRIC_ANGLES.indexOf(angle);
      return uploadedImages[idx] ?? uploadedImages[0];
    }
    if (!activeColour) return "";
    if (angle === "front" || colourIdx === 0 || !primaryColour) {
      return imgFabric(product.slug, activeColour.name, angle);
    }
    return imgFabric(product.slug, primaryColour.name, angle);
  }

  function clampQty(n: number) {
    if (Number.isNaN(n)) return QTY_MIN;
    const stepped = Math.round(n / QTY_STEP) * QTY_STEP;
    return Math.min(stockMeters, Math.max(QTY_MIN, Number(stepped.toFixed(1))));
  }

  function setQty(n: number) {
    const v = clampQty(n);
    setQtyMeters(v);
    setQtyText(fmtMeters(v).replace("m", ""));
  }

  // Only bail when there's nothing at all to render. With uploaded images
  // we don't need a colour variant — the fabric still has photos.
  if (!activeColour && uploadedImages.length === 0) return null;

  const buildLine = () => ({
    id: lineId(product.slug, activeColour ? { colour: activeColour.name } : {}),
    slug: product.slug,
    name: product.name,
    unitPrice: product.price,
    qty: qtyMeters,
    colour: activeColour?.name ?? "",
    imageSrc: uploadedImages[0] ?? (activeColour ? imgFabric(product.slug, activeColour.name, "front") : ""),
    isFabric: true as const,
  });

  const lightboxImages = FABRIC_ANGLES.map((a, i) => ({
    src: fabricImg(a),
    alt: `${product.name} ${FABRIC_ANGLE_LABELS[i]}`,
  }));

  return (
    <>
      <section className="pd pd-fabric">
        <div className="fabric-thumbs">
          {FABRIC_ANGLES.map((a, i) => (
            <div
              key={a}
              className={`fabric-thumb ${i === angleIdx ? "on" : ""}`}
              onClick={() => setAngleIdx(i)}
              role="button"
              aria-label={`Show ${FABRIC_ANGLE_LABELS[i]}`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setAngleIdx(i);
                }
              }}
            >
              <Image
                src={fabricImg(a)}
                alt={`${product.name} ${FABRIC_ANGLE_LABELS[i]}`}
                fill
                sizes="88px"
                loading="lazy"
              />
              <span className="num">0{i + 1}</span>
            </div>
          ))}
        </div>

        <div className="fabric-main" onClick={() => setLbOpen(true)} data-zoom-host="fabric">
          {FABRIC_ANGLES.map((a, i) => (
            <div key={a} className={`photo ${i === angleIdx ? "show" : ""}`}>
              <Image
                src={fabricImg(a)}
                alt={`${product.name} ${FABRIC_ANGLE_LABELS[i]}`}
                fill
                sizes="(max-width: 1100px) 100vw, 60vw"
                priority={i === 0}
              />
            </div>
          ))}
          <span className={`stock-pill${lowStock ? " low" : ""}`} aria-label={`${stockMeters} metres in stock`}>
            <span className="dot" /> {fmtMeters(stockMeters)} in stock
          </span>
          <span className="zoom-hint t-mono-xs">Move cursor to zoom · Click for full</span>
        </div>
        <ZoomLens
          targetSelector="[data-zoom-host='fabric']"
          imageSrc={fabricImg(FABRIC_ANGLES[angleIdx])}
        />

        <div className="fabric-info">
          <div className="ix t-mono-xs">{product.cat}</div>
          <div className="title-row">
            <h1>{product.name}</h1>
            <WishlistButton slug={product.slug} name={product.name} size="md" onTopOfImage={false} />
          </div>

          <div className="stars" aria-label="No reviews yet">
            <span className="glyphs" aria-hidden="true">★ ★ ★ ★ ★</span>
            <span>No reviews</span>
            <span style={{ color: "var(--ink-4)" }}>·</span>
            <a href="#fabric-faq">Write a review</a>
          </div>

          <p className="editor-line">{product.line}</p>
          <p className="desc">{product.description}</p>

          <div className="fabric-price-row">
            <span className="per-m">{fmtINR(product.price)}<small>/ metre · incl. taxes</small></span>
            <span className="total">Total · <b>{fmtINR(product.price * qtyMeters)}</b> for {fmtMeters(qtyMeters)}</span>
          </div>

          {colours.length > 1 && (
            <div className="col-block">
              <div className="head">
                <label>Colour</label>
                <span className="selected-name">{activeColour.name}</span>
              </div>
              <div className="swatch-row" role="radiogroup" aria-label="Colour">
                {colours.map((c, i) => (
                  <button
                    key={c.name}
                    type="button"
                    role="radio"
                    aria-checked={i === colourIdx}
                    aria-label={c.name}
                    title={c.name}
                    className={`swatch-chip${i === colourIdx ? " on" : ""}`}
                    style={{ backgroundColor: c.hex }}
                    onClick={() => setColourIdx(i)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="qty-block">
            <div className="head">
              <label>Length in metres</label>
              <span className="selected-name">{fmtMeters(qtyMeters)} · {fmtMeters(stockMeters - qtyMeters)} left</span>
            </div>
            <div className="stepper" role="group" aria-label="Length in metres">
              <button
                type="button"
                className="stp"
                aria-label="Decrease length"
                onClick={() => setQty(qtyMeters - QTY_STEP)}
                disabled={qtyMeters <= QTY_MIN}
              >−</button>
              <input
                type="number"
                inputMode="decimal"
                step={QTY_STEP}
                min={QTY_MIN}
                max={stockMeters}
                value={qtyText}
                onChange={(e) => {
                  const raw = e.target.value;
                  setQtyText(raw);
                  if (raw === "" || raw === ".") return;
                  const n = parseFloat(raw);
                  if (!Number.isNaN(n)) {
                    const v = clampQty(n);
                    setQtyMeters(v);
                  }
                }}
                onBlur={() => setQty(qtyMeters)}
                aria-label="Length in metres"
              />
              <span className="unit">m</span>
              <button
                type="button"
                className="stp"
                aria-label="Increase length"
                onClick={() => setQty(qtyMeters + QTY_STEP)}
                disabled={qtyMeters >= stockMeters}
              >+</button>
            </div>
            <div className="qty-presets" role="group" aria-label="Quick length presets">
              {QTY_PRESETS.filter(p => p <= stockMeters).map(p => (
                <button
                  key={p}
                  type="button"
                  className={qtyMeters === p ? "on" : ""}
                  aria-pressed={qtyMeters === p}
                  onClick={() => setQty(p)}
                >{p}m</button>
              ))}
              <button
                type="button"
                className={qtyMeters === stockMeters ? "on" : ""}
                aria-pressed={qtyMeters === stockMeters}
                onClick={() => setQty(stockMeters)}
                title="Take all remaining stock"
              >Max ({fmtMeters(stockMeters)})</button>
            </div>
            <div className="qty-helper">
              <span aria-hidden="true">↳</span>
              <span>Not sure how much?</span>
              <a href="#fabric-faq">Use the metre estimator</a>
            </div>
          </div>

          <div className="cta-row">
            <button
              type="button"
              className="btn btn-primary btn-lg btn-block"
              onClick={() => addItem(buildLine())}
            >
              Add {fmtMeters(qtyMeters)} to bag · {fmtINR(product.price * qtyMeters)}
            </button>
            <button
              type="button"
              className="btn btn-buynow btn-lg btn-block"
              onClick={() => {
                addItem(buildLine());
                router.push("/cart");
              }}
            >
              Buy now
            </button>
          </div>

          <div className="trust-mini" aria-label="Trust">
            <span className="ti">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
              </svg>
              <b>Assured</b>&nbsp;quality
            </span>
            <span className="ti">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M3 7h18M3 12h18M3 17h18" />
              </svg>
              <b>Cut</b>&nbsp;from a single piece
            </span>
            <span className="ti">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M3 7h13l3 4v6h-2a2 2 0 11-4 0H8a2 2 0 11-4 0H3z" />
              </svg>
              <b>Free</b>&nbsp;shipping
            </span>
            <span className="ti">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M12 4v8l5 3" />
                <circle cx="12" cy="12" r="9" />
              </svg>
              <b>3-day</b>&nbsp;returns
            </span>
          </div>

          <div className="delivery">
            <div className="pin">110001</div>
            <div className="text">Delivery in <b>{deliveryRange}</b>{product.price >= 15000 && <> · Free shipping across India</>}</div>
          </div>

          <div className="disclaimer">
            <b>Note:</b> Colour on screen may vary slightly from cloth — natural light, dye lots, and weave subtly affect appearance. Order a free swatch first if precision matters.
          </div>
        </div>
      </section>

      {product.fabricMeta && (
        <section className="fabric-spec">
          <div className="inner">
            <div>
              <div className="ix t-mono-xs">Specification · 02</div>
              <h2>The cloth, in detail.</h2>
            </div>
            <div className="grid">
              <div className="cell">
                <div className="k">Width</div>
                <div className="v">{product.fabricMeta.widthInches}&Prime; ({Math.round(product.fabricMeta.widthInches * 2.54)} cm)</div>
              </div>
              <div className="cell"><div className="k">Weight</div><div className="v">{product.fabricMeta.gsm} gsm</div></div>
              <div className="cell"><div className="k">Composition</div><div className="v">{product.fabricMeta.composition}</div></div>
              <div className="cell"><div className="k">Care</div><div className="v">{product.fabricMeta.care}</div></div>
              <div className="cell full"><div className="k">Origin</div><div className="v">{product.fabricMeta.origin}</div></div>
            </div>
          </div>
        </section>
      )}

      <section className="fabric-faq" id="fabric-faq">
        <div>
          <div className="ix t-mono-xs">Frequently asked · 03</div>
          <h2>Buying cloth, simply.</h2>
          <p style={{ color: "var(--ink-2)", margin: "var(--s-3) 0 0", maxWidth: 320, lineHeight: 1.6 }}>
            If you can&apos;t see your question here, WhatsApp us — our cloth team replies within an hour.
          </p>
        </div>
        <div>
          <details>
            <summary>How much fabric do I need?</summary>
            <div>
              Indicative metre guide:
              <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
                <li>Long-sleeve shirt — 2.4m at 58&Prime;</li>
                <li>Trouser — 1.4m at 58&Prime; · 1.8m at 44&Prime;</li>
                <li>Two-piece suit — 3.5m at 58&Prime;</li>
                <li>Three-piece suit — 4m at 58&Prime;</li>
                <li>Sherwani — 3m at 44&Prime; (plus 2m churidar cloth)</li>
                <li>Saree blouse — 1m at 44&Prime;</li>
              </ul>
              Add 10% if you plan to alter or tailor at home.
            </div>
          </details>
          <details>
            <summary>Can I order a sample swatch first?</summary>
            <div>Yes — request a 10×10 cm swatch from any cloth listing. Three swatches are free; a postage charge applies after that. Swatches ship within 48 hours from our atelier.</div>
          </details>
          <details>
            <summary>How is the cloth measured and shipped?</summary>
            <div>Cloth is cut from a single bolt — no joins, no piecings — and rolled around an acid-free board. Orders ship in a hand-stitched cotton bag, not plastic.</div>
          </details>
          <details>
            <summary>Will the colour exactly match my screen?</summary>
            <div>Close, but not exact. Screens render fabric in RGB; cloth absorbs and reflects light differently. We photograph in soft daylight against neutral paper, but small dye-lot variation is normal.</div>
          </details>
          <details>
            <summary>Returns and exchanges</summary>
            <div>Unused cloth in original condition is returnable within three days of delivery. We pick up at our cost. Custom-dyed cloth is non-refundable.</div>
          </details>
          <details>
            <summary>Bulk and event orders</summary>
            <div>For weddings, brand orders, or wholesale, we hold dye-lot consistency across a single PO. WhatsApp our cloth desk and we&apos;ll quote a delivered price within an hour.</div>
          </details>
        </div>
      </section>

      <section className="bulk-panel">
        <div className="row">
          <div>
            <div className="ix t-mono-xs">Bulk &amp; event orders</div>
            <h3>Buying for a wedding, brand, or atelier? <em>Talk to us.</em></h3>
            <p>Single dye-lot, delivered price, no surprises. Our cloth desk replies on WhatsApp within an hour, in working hours, IST.</p>
          </div>
          <a
            className="btn btn-lg"
            href="https://wa.me/919800000000?text=Hi%20Elite%20Zone%20J%20—%20I%27d%20like%20a%20bulk%20cloth%20quote."
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp the cloth desk
          </a>
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
          <span className="lbl">{fmtMeters(qtyMeters)}</span>
          <span className="amt">{fmtINR(product.price * qtyMeters)}</span>
        </div>
        <button
          type="button"
          className="pdp-buy-bar__cta"
          onClick={() => addItem(buildLine())}
        >
          Add to bag
        </button>
      </div>
    </>
  );
}
