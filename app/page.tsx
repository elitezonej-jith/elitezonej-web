import Link from "next/link";
import Header from "./components/Header";
import Footer from "./components/Footer";
import TrustStrip from "./components/TrustStrip";
import Reveal from "./components/Reveal";
import HeroReveal from "./components/HeroReveal";
import MadeForYou from "./components/MadeForYou";
import EditorialSplit from "./components/EditorialSplit";
import CarouselShowcase from "./components/CarouselShowcase";
import PromoModal from "./components/PromoModal";
import HeroGrid from "./components/HeroGrid";
import { PRODUCTS } from "@/lib/products";
import "./styles/home.css";

// This component reads no request-time API (cookies/headers) and no admin DB —
// it only filters the static PRODUCTS array. It is statically renderable, so we
// drop the blanket `force-dynamic` opt-out to regain full <Link> prefetch and
// the 5-min client router cache (Next 16 prefetching.md:26-30).

export default function Home() {
  const men = PRODUCTS.filter(p => p.gender === "men").slice(0, 6);
  const women = PRODUCTS.filter(p => p.gender === "women").slice(0, 6);

  return (
    <>
      <div className="announce-bar" aria-label="FREE DELIVERY ON ORDERS OVER ₹15,000 — MADE-TO-MEASURE IN SEVEN DAYS">
        <div className="announce-ticker" aria-hidden="true">
          {[0,1].map(i => (
            <span key={i} className="announce-ticker__track">
              <span className="announce-item">Complimentary delivery on orders over <span className="announce-accent">₹15,000</span></span>
              <span className="announce-sep" />
              <span className="announce-item">Made-to-measure in <span className="announce-accent">seven days</span></span>
              <span className="announce-sep" />
              <span className="announce-item">Free alterations within <span className="announce-accent">30 days</span> of delivery</span>
              <span className="announce-sep" />
              <span className="announce-item">Bespoke appointments at our <span className="announce-accent">Delhi atelier</span></span>
              <span className="announce-sep" />
              <span className="announce-item">Home fittings in <span className="announce-accent">Delhi · Mumbai · Bangalore</span></span>
              <span className="announce-sep" />
            </span>
          ))}
        </div>
      </div>
      <Header />
      <PromoModal />

      <HeroGrid />
      <HeroReveal />

      {/* Carousel showcase #1 — heading-side row (Disturbia "New In" pattern) */}
      <CarouselShowcase
        title="New In"
        ctaLabel="View All Products"
        ctaHref="/collection?c=men"
        products={men.slice(0, 6)}
        headingSide="left"
      />

      {/* Editorial split #1 — image LEFT, products RIGHT */}
      <EditorialSplit
        title="The Men's Edit"
        ctaLabel="Shop Menswear"
        ctaHref="/collection?c=men"
        image="/generated/_sections/atelier.webp"
        imageAlt="Master tailor at the atelier"
        imageSide="left"
        products={men}
      />

      {/* Editorial split #2 — image RIGHT, products LEFT */}
      <EditorialSplit
        title="The Women's Edit"
        ctaLabel="Shop Womenswear"
        ctaHref="/collection?c=women"
        image="/generated/aria-pant-suit/01-front.webp"
        imageAlt="The Women's Edit — aria pant suit"
        imageSide="right"
        products={women}
      />

      {/* Carousel showcase #2 — heading on right (Disturbia "Women's Swimwear" pattern) */}
      <CarouselShowcase
        title="Festive Edit"
        ctaLabel="View All Products"
        ctaHref="/collection?c=festive"
        products={women.slice(0, 6)}
        headingSide="right"
      />

      {/* Women's Collection banner — full-width editorial strip */}
      <Link href="/collection?c=women" className="coll-banner" aria-label="Shop the Women's Collection">
        <div
          className="coll-banner-img"
          role="img"
          aria-label="Women's summer collection editorial"
          style={{ backgroundImage: "url(/generated/_sections/swim-banner.webp)" }}
        />
        <div className="coll-banner-overlay">
          <span className="coll-banner-eyebrow">New season</span>
          <h2>Women&apos;s Collection<em>.</em></h2>
          <span className="btn btn-primary coll-banner-cta">Shop Now</span>
        </div>
      </Link>

      {/* Made for You — desktop 3-up grid, mobile swipe carousel */}
      <MadeForYou />

      {/* Process */}
      <section className="process-strip" aria-label="How it's made">
        <div className="process-strip__head">
          <Reveal as="div" className="process-strip__lead">
            <h2 className="process-strip__title">
              How it&apos;s <em>made</em>.
            </h2>
            <p className="process-strip__kicker">By hand.</p>
            <span className="process-strip__rule" aria-hidden="true" />
          </Reveal>
          <span className="process-strip__hint t-mono-xs" aria-hidden="true">
            <span className="dot" />
            Drag to explore
          </span>
        </div>

        <div className="process-strip__rail" tabIndex={0} aria-roledescription="carousel">
          <article className="process-pane">
            <div className="process-pane__photo pr-1" role="img" aria-label="Cloth library — wool swatches" />
            <div className="process-pane__body">
              <span className="process-pane__step t-mono-xs">Cloth</span>
              <h3>Choose your cloth.</h3>
              <p>
                Browse our cloth library — wools from Italian and English mills, premium Indian cottons,
                hand-woven silks. Order swatches free, posted from the Delhi atelier within 48 hours.
              </p>
            </div>
          </article>

          <article className="process-pane">
            <div className="process-pane__photo pr-2" role="img" aria-label="Master tailor at the cutting table" />
            <div className="process-pane__body">
              <span className="process-pane__step t-mono-xs">Fitting</span>
              <h3>Get measured.</h3>
              <p>
                Visit our atelier or book a home fitting in Delhi, Mumbai, or Bangalore. Fourteen
                measurements, taken by our master tailors. Forty minutes, complimentary chai.
              </p>
            </div>
          </article>

          <article className="process-pane">
            <div className="process-pane__photo pr-3" role="img" aria-label="Finished suit, pressed and ready" />
            <div className="process-pane__body">
              <span className="process-pane__step t-mono-xs">Delivery</span>
              <h3>Receive in seven days.</h3>
              <p>
                Cut, stitched, and pressed in our workroom. Free alterations within thirty days
                of delivery — until the fit is right. Lifetime mending, on the house.
              </p>
            </div>
          </article>
        </div>

        <div className="process-strip__foot">
          <span className="t-mono-xs">Standard delivery · Free across India</span>
          <Link className="btn btn-secondary" href="/bespoke#book">Book a fitting</Link>
        </div>
      </section>

      {/* Editorial */}
      <section className="editorial" id="editorial">
        <div className="img" role="img" aria-label="The Wedding Wardrobe — sherwani"></div>
        <div className="copy">
          <div className="ix t-mono-xs">Seasons · The Wedding Wardrobe</div>
          <Reveal as="h3">A six-piece capsule for the season&apos;s weddings &mdash; from <em>haldi</em> to reception.</Reveal>
          <Reveal as="p" delay={1} className="t-body">
            Indian wedding seasons run long. We designed a tight capsule of six pieces that
            cover every occasion from morning ceremonies to formal receptions — built around
            one tailored fit, three cloth weights, and the quiet hardware of an evening worth
            remembering.
          </Reveal>
          <Reveal as="p" delay={2} className="t-body">Photographed in Jaipur, January 2026.</Reveal>
          <Link className="btn btn-secondary" href="/collection?c=sherwani" style={{ alignSelf: "flex-start", marginTop: "var(--s-3)" }}>Shop the wedding wardrobe</Link>
          <div className="signed t-mono-xs">By the Elite Zone J design team</div>
        </div>
      </section>

      {/* Bespoke teaser */}
      <section className="bespoke-teaser">
        <div className="row">
          <div>
            <div className="ix t-mono-xs">Bespoke · Made-to-measure</div>
            <Reveal as="h3">Designed in our studio. <em>Stitched by our master tailors.</em></Reveal>
            <Reveal as="p" delay={1} className="t-body-lg">
              Twelve designers and twenty-six tailors, working from our Delhi atelier. Visit us by appointment,
              or book a home fitting in Delhi, Mumbai, or Bangalore.
            </Reveal>
          </div>
          <Link className="btn btn-lg" href="/bespoke">Visit the atelier</Link>
        </div>
      </section>

      <TrustStrip />
      <Footer />
    </>
  );
}
