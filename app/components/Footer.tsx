import Link from "next/link";
import Image from "next/image";
import NewsletterForm from "./NewsletterForm";
import FooterAccordion from "./FooterAccordion";
import { getSiteSettings } from "../../lib/storefront/site-settings";

// Social icons drawn in their conventional brand-recognisable silhouettes.
// Generic shapes — not pixel-copies of any brand's mark file. We render in
// monochrome outline so the footer reads as a quiet typographic page rather
// than a rainbow of colours competing with the wordmark.

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M14 22v-9h3l.4-3.6h-3.4V7.1c0-1 .3-1.7 1.7-1.7h1.8V2.2c-.3 0-1.4-.1-2.6-.1-2.6 0-4.4 1.6-4.4 4.5v2.7H7.4V13H10.5v9z"/>
    </svg>
  );
}
function XIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M17.7 3h3.1l-6.8 7.7L22 21h-6.3l-4.9-6.4L5 21H1.9l7.3-8.3L1.5 3h6.5l4.5 5.9z"/>
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function PinterestIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="9" />
      <path d="M11.6 6.5c-2.5 0-4.5 2-4.5 4.5 0 1.7 1 2.7 1.7 2.7.2 0 .4-.5.5-.9.1-.4 0-.6-.1-.9-.1-.4-.2-.8-.2-1.2 0-1.5 1.2-2.8 2.8-2.8 1.6 0 2.5 1 2.5 2.5 0 1.6-.7 3.6-2 3.6-.7 0-1.2-.6-1-1.4.2-.9.6-1.9.6-2.6 0-.6-.3-1.1-1-1.1-.8 0-1.4.8-1.4 1.9 0 .7.2 1.1.2 1.1l-1 4.2c-.3 1.2 0 2.7 0 2.8.1 0 1.2-1.5 1.5-2.6.1-.3.6-2.4.6-2.4.3.6 1.2 1.1 2.1 1.1 2.7 0 4.6-2.5 4.6-5.9 0-2.4-2-4.6-5.5-4.6z"/>
    </svg>
  );
}
function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M19.3 8.5a6.6 6.6 0 0 1-3.9-1.3v7.5a5.7 5.7 0 1 1-5.7-5.7c.4 0 .7 0 1 .1v3.3a2.6 2.6 0 1 0 1.8 2.5V2h3a3.6 3.6 0 0 0 3.8 3.6V8.5z"/>
    </svg>
  );
}

function RatingBadge() {
  return (
    <div className="rating-badge">
      <div className="rating-label">Excellent</div>
      <div className="rating-stars" aria-label="Rated 4.8 out of 5">
        {[0,1,2,3,4].map(i => (
          <span key={i} className="star-square">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="#ffffff">
              <path d="M12 2l3 7 7 .6-5.3 4.7 1.6 7L12 17.8 5.7 21.3l1.6-7L2 9.6 9 9z"/>
            </svg>
          </span>
        ))}
      </div>
      <div className="rating-meta">Verified buyer reviews</div>
    </div>
  );
}

export default function Footer({ minimal = false }: { minimal?: boolean }) {
  const s = getSiteSettings();
  if (minimal) {
    return (
      <footer className="site site--minimal">
        <div className="foot-bottom-min">
          <Link href="/" className="foot-logo-link">
            <Image src="/logo/lockup-trimmed.png" alt={s.brandName} width={860} height={227} style={{ height: "26px", width: "auto", display: "block" }} />
          </Link>
          <span>© 2026 {s.brandName}</span>
          <span>Visa · Mastercard · UPI · Net Banking · COD</span>
          <span>Designed and tailored in India</span>
        </div>
      </footer>
    );
  }

  return (
    <>
      {/* Newsletter band — full-width centred above the trust strip */}
      <section className="newsletter-band">
        <h3>Save 15% on your first order</h3>
        <NewsletterForm />
      </section>

      <footer className="site site--disturbia">
        <div className="foot-grid">
          <FooterAccordion title="Help & Info">
            <ul>
              <li><Link href="/bespoke">Contact</Link></li>
              <li><Link href="/bespoke">FAQs</Link></li>
              <li><Link href="/cart">Size guide</Link></li>
              <li><Link href="/cart">Delivery</Link></li>
              <li><Link href="/cart">Returns</Link></li>
              <li><Link href="/cart">Terms &amp; conditions</Link></li>
              <li><Link href="/cart">Privacy</Link></li>
              <li><Link href="/cart">Cookies</Link></li>
            </ul>
          </FooterAccordion>

          <FooterAccordion title="Company" className="foot-col-center">
            <Link href="/" className="foot-logo-link" aria-label={s.brandName}>
              <Image
                src="/logo/lockup-trimmed.png"
                alt={s.brandName}
                width={860}
                height={227}
                className="foot-logo-img"
              />
            </Link>
            <ul>
              <li><Link href="/bespoke">About</Link></li>
              <li><Link href="/bespoke">Our people</Link></li>
              <li><Link href="/collection?c=men">Our pieces</Link></li>
              <li><Link href="/bespoke">Rewards</Link></li>
              <li><Link href="/bespoke">Refer a friend</Link></li>
              <li><Link href="/cart">Gift cards</Link></li>
              <li><Link href="/bespoke">Sustainability</Link></li>
              <li><Link href="/bespoke">Careers</Link></li>
              <li><Link href="/bespoke">Press</Link></li>
            </ul>
          </FooterAccordion>

          <FooterAccordion title="Follow" className="foot-col-social">
            <div className="social-row" aria-label="Social media">
              <a href="#" aria-label="Facebook"  className="social-icon"><FacebookIcon /></a>
              <a href="#" aria-label="X / Twitter" className="social-icon"><XIcon /></a>
              <a href="#" aria-label="Instagram" className="social-icon"><InstagramIcon /></a>
              <a href="#" aria-label="Pinterest" className="social-icon"><PinterestIcon /></a>
              <a href="#" aria-label="TikTok"    className="social-icon"><TikTokIcon /></a>
            </div>
            <RatingBadge />
          </FooterAccordion>
        </div>

        {/* Mobile-only condensed strip — replaces the 3 stacked accordions
            with a single editorial block: logo, inline middot links, social. */}
        <div className="foot-mobile" aria-label="Footer">
          <Link href="/" className="foot-mobile__logo" aria-label={s.brandName}>
            <Image
              src="/logo/lockup-trimmed.png"
              alt={s.brandName}
              width={860}
              height={227}
              className="foot-mobile__logo-img"
            />
          </Link>
          <ul className="foot-mobile__links">
            <li><Link href="/bespoke">Contact</Link></li>
            <li><Link href="/bespoke">About</Link></li>
            <li><Link href="/cart">Size guide</Link></li>
            <li><Link href="/cart">Returns</Link></li>
            <li><Link href="/cart">Privacy</Link></li>
          </ul>
          <div className="foot-mobile__social" aria-label="Social media">
            <a href="#" aria-label="Facebook" className="social-icon"><FacebookIcon /></a>
            <a href="#" aria-label="X / Twitter" className="social-icon"><XIcon /></a>
            <a href="#" aria-label="Instagram" className="social-icon"><InstagramIcon /></a>
            <a href="#" aria-label="Pinterest" className="social-icon"><PinterestIcon /></a>
            <a href="#" aria-label="TikTok" className="social-icon"><TikTokIcon /></a>
          </div>
        </div>

        <div className="foot-bottom">
          <div className="foot-bottom__copy">
            © 2026 {s.brandName} · All rights reserved
          </div>
        </div>
      </footer>
    </>
  );
}
