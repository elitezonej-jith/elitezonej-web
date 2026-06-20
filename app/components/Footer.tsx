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
      <path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.668 1.0745-1.3364 1.3802-2.1272.2957-.7642.4957-1.6362.552-2.9141.0563-1.2772.0689-1.6882.0626-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.8974-1.3794-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.8988.4227-.1641 1.0573-.3633 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.8988 1.3783.1642.4217.3635 1.0566.4174 2.2271.0598 1.2648.072 1.6442.0791 4.848.0071 3.2037-.0043 3.5835-.0602 4.8485-.0503 1.1695-.2451 1.8057-.408 2.2297-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.8983-.4236.1645-1.0576.3637-2.2274.4174-1.2652.0595-1.6449.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"/>
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

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
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
              <a href="#" aria-label="X / Twitter" className="social-icon" target="_blank" rel="noopener noreferrer"><XIcon /></a>
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
            <a href="#" aria-label="X / Twitter" className="social-icon" target="_blank" rel="noopener noreferrer"><XIcon /></a>
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
