import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import TrustStrip from "../components/TrustStrip";
import Reveal from "../components/Reveal";
import Parallax from "../components/Parallax";
import SectionHead from "../components/SectionHead";
import BookingForm from "./BookingForm";
import { WHATSAPP_LINK, WHATSAPP_DISPLAY } from "@/lib/contact";
import { getBespokeContent } from "@/lib/storefront/bespoke-content";
import "../styles/bespoke.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bespoke & Made-to-Measure — Elite Zone J" };

function replaceLead(text: string, leadLabel: string): string {
  return text.replace(/\{leadTime\}/g, leadLabel);
}

export default async function BespokePage() {
  const content = await getBespokeContent();
  const leadLabel = `${content.hero.lead_time_days} day${content.hero.lead_time_days === 1 ? "" : "s"}`;

  const headlineParts = replaceLead(content.hero.headline, leadLabel).split("\n");

  return (
    <>
      <Header />

      <main>
      <section className="b-hero">
        <div className="copy">
          <div className="ix t-mono-xs">{content.hero.eyebrow}</div>
          <h1>
            {headlineParts.map((part, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {part.includes("your") ? (
                  <>{part.replace(/your/, "")}<em>your</em></>
                ) : (
                  part
                )}
              </span>
            ))}
          </h1>
          <p>{replaceLead(content.hero.subtitle, leadLabel)}</p>
          <div className="ctas">
            <Link className="btn btn-primary btn-lg" href="#book">Book a fitting</Link>
            <Link className="btn btn-secondary btn-lg" href="#process">How it works</Link>
          </div>
        </div>
        <Parallax className="b-hero-img" intensity={0.12} direction="-y">
          <div className="img" role="img" aria-label="Master tailor measuring a client at our atelier"></div>
        </Parallax>
      </section>

      {/* Services */}
      <section className="services">
        <div className="row">
          <SectionHead
            numeral={1}
            eyebrow="Three ways to be tailored"
            title="Pick the path that fits your time."
            meta={`From ₹${Math.min(...content.services.map(s => {
              const match = s.price.match(/[\d,]+/);
              return match ? Number(match[0].replace(/,/g, "")) : 99999;
            })).toLocaleString()}`}
          />
          <div className="grid svc-grid">
            {content.services.map((svc, i) => (
              <Reveal key={svc.id} as="div" className={`svc svc-${i + 1}`} delay={Math.min(i, 4) as 0 | 1 | 2 | 3 | 4}>
                <div className="photo"></div>
                <span className="svc-numeral" aria-hidden="true">{["I.", "II.", "III.", "IV.", "V."][i] ?? `${i + 1}.`}</span>
                <div className="body">
                  <span className="ix t-mono-xs">{svc.category}</span>
                  <h3>{svc.title}</h3>
                  <span className="svc-rule" aria-hidden="true" />
                  <div className="price">{replaceLead(svc.price, leadLabel)}</div>
                  <ul>
                    {svc.features.filter(Boolean).map((f, fi) => (
                      <li key={fi}>{replaceLead(f, leadLabel)}</li>
                    ))}
                  </ul>
                  <div className="cta"><Link className="btn btn-primary btn-block" href="#book">{svc.cta_text}</Link></div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="process" id="process">
        <SectionHead
          numeral={2}
          eyebrow="The process"
          title="How it's made."
          meta={`${content.process_steps.length} steps · ${leadLabel}`}
        />
        <div className="steps">
          {content.process_steps.map((step, i) => (
            <Reveal key={step.id} as="div" className={`step step-${i + 1}`} delay={Math.min(i, 4) as 0 | 1 | 2 | 3 | 4}>
              <div className="photo"></div>
              <div className="num">{String(i + 1).padStart(2, "0")}</div>
              <h4>{replaceLead(step.title, leadLabel)}</h4>
              <p className="t-body">{replaceLead(step.description, leadLabel)}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Booking form */}
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
          <BookingForm services={content.booking_services} />
        </div>
      </section>

      {/* Testimonials */}
      {content.testimonials.length > 0 && (
        <section className="quotes">
          <SectionHead
            numeral={5}
            eyebrow="Customer voices"
            title="What our customers say."
          />
          <div className="grid">
            {content.testimonials.map((t, i) => (
              <Reveal key={t.id} as="div" className="quote" delay={Math.min(i, 4) as 0 | 1 | 2 | 3 | 4}>
                <q>&ldquo;{t.quote}&rdquo;</q>
                <div className="by t-mono-xs">— <b>{t.author}</b>{t.title ? ` · ${t.title}` : ""}</div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      </main>
      <TrustStrip />
      <Footer />
    </>
  );
}
