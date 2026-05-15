import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import TrustStrip from "../components/TrustStrip";
import Reveal from "../components/Reveal";
import Parallax from "../components/Parallax";
import SectionHead from "../components/SectionHead";
import BookingForm from "./BookingForm";
import { WHATSAPP_LINK, WHATSAPP_DISPLAY } from "@/lib/contact";
import "../styles/bespoke.css";

export const metadata = { title: "Bespoke & Made-to-Measure — Elite Zone J" };

export default function BespokePage() {
  return (
    <>
      <Header />

      <section className="b-hero">
        <div className="copy">
          <div className="ix t-mono-xs">Bespoke · Made-to-Measure · Alterations</div>
          <h1>A suit cut to <em>your</em> figure.<br />Delivered in seven days.</h1>
          <p>Twelve in-house designers and twenty-six master tailors, working from our Delhi atelier.
            Visit us by appointment, or book a home fitting in Delhi, Mumbai, or Bangalore.</p>
          <div className="ctas">
            <Link className="btn btn-primary btn-lg" href="#book">Book a fitting</Link>
            <Link className="btn btn-secondary btn-lg" href="#process">How it works</Link>
          </div>
        </div>
        <Parallax className="b-hero-img" intensity={0.12} direction="-y">
          <div className="img" role="img" aria-label="Master tailor measuring a client at the Delhi atelier"></div>
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
                  <li>Lifetime mending; alterations free for first year</li>
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
                <div className="price">From ₹28,000 · 7 days</div>
                <ul>
                  <li>Built on our base block, adjusted to your fourteen measurements</li>
                  <li>Choose cloth, lining, collar, length, and embroidery</li>
                  <li>One fitting included; alterations free for thirty days</li>
                  <li>Festive-ready in seven days</li>
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
          meta="Four steps · Seven days"
        />
        <div className="steps">
          <Reveal as="div" className="step step-1" delay={0}><div className="photo"></div><div className="num">01</div><h4>Choose your cloth</h4><p className="t-body">Browse our cloth library — wools from Vitale Barberis Canonico and Reda 1865, Egyptian poplins from Thomas Mason, handwoven Indian silks. Order swatches free of charge.</p></Reveal>
          <Reveal as="div" className="step step-2" delay={1}><div className="photo"></div><div className="num">02</div><h4>Get measured</h4><p className="t-body">Visit our Delhi atelier or book a home fitting in Delhi NCR, Mumbai, or Bangalore. Fourteen measurements, taken by our master tailors. Forty minutes, complimentary refreshment.</p></Reveal>
          <Reveal as="div" className="step step-3" delay={2}><div className="photo"></div><div className="num">03</div><h4>We cut and stitch</h4><p className="t-body">Cut by hand from your paper pattern, basted for the first fitting, then constructed with hand-padded canvas and hand-stitched lapels.</p></Reveal>
          <Reveal as="div" className="step step-4" delay={3}><div className="photo"></div><div className="num">04</div><h4>Receive in seven days</h4><p className="t-body">Delivered free across India in a hand-stitched garment bag. Free alterations within thirty days of delivery, until the fit is exactly right. Lifetime mending.</p></Reveal>
        </div>
      </section>

      <section className="atelier">
        <div className="row">
          <div className="copy">
            <h2>Our atelier in Delhi</h2>
            <p className="t-body-lg">Twelve designers, twenty-six master tailors — between us, three hundred and seventy years on the bench. We design every piece in-house, cut every garment in our workroom, and put our names on every label.</p>
            <div className="stats">
              <div className="stat t-mono-xs">Designers<b>12</b></div>
              <div className="stat t-mono-xs">Master tailors<b>26</b></div>
              <div className="stat t-mono-xs">Average tenure<b>14 years</b></div>
              <div className="stat t-mono-xs">Founded<b>2012</b></div>
            </div>
          </div>
          <div className="team">
            <div className="person"><div className="ph p1"></div><h4>Aman Gupta</h4><p className="role">Lead Designer</p><p className="yrs">Twelve years on the bench. Three-piece suits and structured bandhgalas.</p></div>
            <div className="person"><div className="ph p2"></div><h4>Vikram Mehta</h4><p className="role">Master Tailor</p><p className="yrs">Eighteen years cutting. Trained in Savile Row construction technique.</p></div>
            <div className="person"><div className="ph p3"></div><h4>Riya Kapoor</h4><p className="role">Bespoke Specialist</p><p className="yrs">Nine years in zardozi and gota work. Festive sherwani lead designer.</p></div>
          </div>
        </div>
      </section>

      <section className="pricing">
        <h2>Transparent pricing</h2>
        <div className="pricing-table">
          <div><h4>Bespoke Suit</h4><div className="from">₹45,000<small>Base · cloth from ₹3,500/m</small></div><p>Includes paper pattern, three fittings, lifetime mending, free alterations for one year.</p></div>
          <div><h4>Made-to-Measure Sherwani</h4><div className="from">₹28,000<small>Base · embroidery from ₹6,000</small></div><p>Includes one fitting, churidar, dupatta, cotton mulmul lining. Hand-worked zardozi quoted on selection.</p></div>
          <div><h4>Tailored Shirts</h4><div className="from">₹2,800<small>Per shirt · three for ₹7,500</small></div><p>Egyptian cotton poplin, single-needle stitching, mother-of-pearl buttons.</p></div>
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

      <TrustStrip />
      <Footer />
    </>
  );
}
