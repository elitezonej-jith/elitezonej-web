import Link from "next/link";
import Image from "next/image";
import NewsletterForm from "./NewsletterForm";
import FooterAccordion from "./FooterAccordion";
import { getSiteSettings } from "../../lib/storefront/site-settings";

// Social icons from Simple Icons (https://simpleicons.org) — CC0 1.0 public domain.
// viewBox 0 0 24 24, rendered as filled monochrome to match footer aesthetic.

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

function PinterestIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24 18.635 24 24 18.633 24 12.013 24 5.393 18.635 0 12.017 0z"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
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

export default async function Footer({ minimal = false }: { minimal?: boolean }) {
  const s = await getSiteSettings();
  if (minimal) {
    return (
      <footer className="site site--minimal">
        <div className="foot-bottom-min">
          <Link href="/" className="foot-logo-link">
            <Image src="/logo/lockup-trimmed.png" alt={s.brandName} width={860} height={227} style={{ height: "26px", width: "auto", display: "block" }} />
          </Link>
          <span>© 2026 {s.brandName}</span>
          <span>Visa · Mastercard · UPI · Net Banking</span>
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
              <li><Link href="/size-guide">Size guide</Link></li>
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
              <li><Link href="/bespoke">Careers</Link></li>
            </ul>
          </FooterAccordion>

          <FooterAccordion title="Follow" className="foot-col-social">
            <div className="social-row" aria-label="Social media">
              <a href="https://www.instagram.com/zone_j__/" aria-label="Instagram" className="social-icon" target="_blank" rel="noopener noreferrer"><InstagramIcon /></a>
              <a href="https://www.youtube.com/@jithcoke28" aria-label="YouTube"   className="social-icon" target="_blank" rel="noopener noreferrer"><YouTubeIcon /></a>
              <a href="https://in.pinterest.com/jithcoke/" aria-label="Pinterest" className="social-icon" target="_blank" rel="noopener noreferrer"><PinterestIcon /></a>
              <a href="https://www.facebook.com/elitezonej" aria-label="Facebook"  className="social-icon" target="_blank" rel="noopener noreferrer"><FacebookIcon /></a>
              <a href="https://www.linkedin.com/in/jith-s-427960202/" aria-label="LinkedIn" className="social-icon" target="_blank" rel="noopener noreferrer"><LinkedInIcon /></a>
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
            <li><Link href="/size-guide">Size guide</Link></li>
            <li><Link href="/cart">Returns</Link></li>
            <li><Link href="/cart">Privacy</Link></li>
          </ul>
          <div className="foot-mobile__social" aria-label="Social media">
            <a href="https://www.instagram.com/zone_j__/" aria-label="Instagram" className="social-icon" target="_blank" rel="noopener noreferrer"><InstagramIcon /></a>
            <a href="https://www.youtube.com/@jithcoke28" aria-label="YouTube" className="social-icon" target="_blank" rel="noopener noreferrer"><YouTubeIcon /></a>
            <a href="https://in.pinterest.com/jithcoke/" aria-label="Pinterest" className="social-icon" target="_blank" rel="noopener noreferrer"><PinterestIcon /></a>
            <a href="https://www.facebook.com/elitezonej" aria-label="Facebook" className="social-icon" target="_blank" rel="noopener noreferrer"><FacebookIcon /></a>
            <a href="https://www.linkedin.com/in/jith-s-427960202/" aria-label="LinkedIn" className="social-icon" target="_blank" rel="noopener noreferrer"><LinkedInIcon /></a>
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
