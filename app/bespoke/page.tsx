import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import TrustStrip from "../components/TrustStrip";
import Reveal from "../components/Reveal";
import Parallax from "../components/Parallax";
import SectionHead from "../components/SectionHead";
import BookingForm from "./BookingForm";
import { WHATSAPP_LINK, WHATSAPP_DISPLAY } from "@/lib/contact";
import { getSiteSettings } from "@/lib/storefront/site-settings";
import "../styles/bespoke.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bespoke & Made-to-Measure — Elite Zone J" };

export default async function BespokePage() {
  const { leadTimeDays } = await getSiteSettings();
  const leadLabel = `${leadTimeDays} day${leadTimeDays === 1 ? "" : "s"}`;
  return (
    <>
      <Header />

      <main>
      <section className="b-hero">
        <div className="copy">
          <div className="ix t-mono-xs">Bespoke · Made-to-Measure · Alterations</div>
          <h1>A suit cut to <em>your</em> figure.<br />Delivered in {leadLabel}.</h1>
          <p>Twelve in-house designers and twenty-six master tailors.
            Visit us by appointment, or book a home fitting in Delhi, Mumbai, or Bangalore.</p>
          <div className="ctas">
            <Link className="btn btn-primary btn-lg" href="#book">Book a fitting</Link>
            <Link className="btn btn-secondary btn-lg" href="#process">How it works</Link>
          </div>
        </div>
        <Parallax className="b-hero-img" intensity={0.12} direction="-y">
          <div className="img" role="img" aria-label="Master tailor measuring a client at our atelier"></div>
        </Parallax>
      </section>

      <section className="services">
        <div className="row">
          <SectionHead
            numeral={1}
            eyebrow="Three ways to be tailored"
            title="Pick the path that fits your time."
            meta="From ₹3,500"
          />
          <div className="grid svc-grid">
            <Reveal as="div" className="svc svc-1" delay={0}>
              <div className="photo"></div>
              <span className="svc-numeral" aria-hidden="true">I.</span>
              <div className="body">
                <span className="ix t-mono-xs">Bespoke</span>
                <h3>The Bespoke Suit</h3>
                <span className="svc-rule" aria-hidden="true" />
                <div className="price">From ₹45,000 · 4 to 6 weeks</div>
                <ul>
                  <li>Drafted to a paper pattern unique to your figure</li>
                  <li>Three fittings — basted, forward, finish</li>
                  <li>Hand-padded canvas, hand-stitched buttonholes</li>
                  <li>Lifetime mending</li>
                </ul>
                <div className="cta"><Link className="btn btn-primary btn-block" href="#book">Begin your suit</Link></div>
              </div>
            </Reveal>
            <Reveal as="div" className="svc svc-2" delay={1}>
              <div className="photo"></div>
              <span className="svc-numeral" aria-hidden="true">II.</span>
              <div className="body">
                <span className="ix t-mono-xs">Made-to-Measure</span>
                <h3>Custom Sherwani</h3>
                <span className="svc-rule" aria-hidden="true" />
                <div className="price">From ₹28,000 · {leadLabel}</div>
                <ul>
                  <li>Built on our base block, adjusted to your fourteen measurements</li>
                  <li>Choose cloth, lining, collar, length, and embroidery</li>
                  <li>One fitting included</li>
                  <li>Festive-ready in {leadLabel}</li>
                </ul>
                <div className="cta"><Link className="btn btn-primary btn-block" href="#book">Configure yours</Link></div>
              </div>
            </Reveal>
            <Reveal as="div" className="svc svc-3" delay={2}>
              <div className="photo"></div>
              <span className="svc-numeral" aria-hidden="true">III.</span>
              <div className="body">
                <span className="ix t-mono-xs">Alterations</span>
                <h3>Alterations &amp; Fit Correction</h3>
                <span className="svc-rule" aria-hidden="true" />
                <div className="price">From ₹3,500 · 5 to 7 days</div>
                <ul>
                  <li>Bring in a piece you love; we&apos;ll re-cut it to fit</li>
                  <li>Trousers, jackets, shirts, sherwanis</li>
                  <li>Free for any Elite Zone J piece in its first year</li>
                  <li>Pickup &amp; return across Delhi, Mumbai, Bangalore</li>
                </ul>
                <div className="cta"><Link className="btn btn-primary btn-block" href="#book">Book alterations</Link></div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="process" id="process">
        <SectionHead
          numeral={2}
          eyebrow="The process"
          title="How it's made."
          meta={`Four steps · ${leadLabel}`}
        />
        <div className="steps">
          <Reveal as="div" className="step step-1" delay={0}><div className="photo"></div><div className="num">01</div><h4>Choose your cloth</h4><p className="t-body">Browse our cloth library — wools from Vitale Barberis Canonico and Reda 1865, Egyptian poplins from Thomas Mason, handwoven Indian silks. Order swatches free of charge.</p></Reveal>
          <Reveal as="div" className="step step-2" delay={1}><div className="photo"></div><div className="num">02</div><h4>Get measured</h4><p className="t-body">Visit our atelier or book a home fitting in Delhi NCR, Mumbai, or Bangalore. Fourteen measurements, taken by our master tailors. Forty minutes, complimentary refreshment.</p></Reveal>
          <Reveal as="div" className="step step-3" delay={2}><div className="photo"></div><div className="num">03</div><h4>We cut and stitch</h4><p className="t-body">Cut by hand from your paper pattern, basted for the first fitting, then constructed with hand-padded canvas and hand-stitched lapels.</p></Reveal>
          <Reveal as="div" className="step step-4" delay={3}><div className="photo"></div><div className="num">04</div><h4>Receive in {leadLabel}</h4><p className="t-body">Delivered free across India in a hand-stitched garment bag. Lifetime mending.</p></Reveal>
        </div>
      </section>

      <section className="book" id="book">
        <div className="row">
          <div>
            <div className="ix t-mono-xs">Book a fitting</div>
            <h3>Choose your atelier or <em>we&apos;ll come to you.</em></h3>
            <p>By appointment only. Forty-minute fitting, complimentary chai or coffee, no pressure to order on the day. Bring a piece you love so we can match the fit.</p>
            <div className="alt">
              Or message us on WhatsApp: <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">{WHATSAPP_DISPLAY}</a>
            </div>
          </div>
          <BookingForm />
        </div>
      </section>

      <section className="quotes">
        <SectionHead
          numeral={5}
          eyebrow="Customer voices"
          title="What our customers say."
        />
        <div className="grid">
          <Reveal as="div" className="quote" delay={0}>
            <q>&ldquo;I&apos;ve worn one of Aman&apos;s three-piece suits for every wedding I&apos;ve attended in the last four years. They&apos;ve taken it in twice for free and it still drapes like the day I bought it.&rdquo;</q>
            <div className="by t-mono-xs">— <b>Rohan Mehra</b>, Delhi · Investment Manager</div>
          </Reveal>
          <Reveal as="div" className="quote" delay={1}>
            <q>&ldquo;The home fitting in Mumbai was the deciding factor. The tailor came to my apartment, took fourteen measurements, asked questions a Savile Row cutter would ask. The sherwani arrived in seven days exactly.&rdquo;</q>
            <div className="by t-mono-xs">— <b>Arjun Shah</b>, Mumbai · Architect</div>
          </Reveal>
        </div>
      </section>

      </main>
      <TrustStrip />
      <Footer />
    </>
  );
}
