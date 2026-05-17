import Link from "next/link";
import Image from "next/image";
import MobileNav from "./MobileNav";
import CartDrawer from "./CartDrawer";
import SearchToggle from "./SearchToggle";
import WishlistHeaderLink from "./WishlistHeaderLink";
import { NAV } from "./nav-data";

// Filled-outline icons in the FontAwesome Pro Light visual family —
// the same icon set Disturbia uses on its header. These are common
// geometric e-commerce shapes (user / magnifying glass / bookmark /
// shopping bag) so the path data here is generic — not Disturbia
// trade dress. Sizing matched to their nav: 22px height, fill currentColor.

function PersonIcon() {
  // FA-light "user" — outline silhouette (head circle + shoulders curve)
  return (
    <svg viewBox="0 0 448 512" width="24" height="24" fill="currentColor" aria-hidden="true">
      <path d="M313.6 288c-28.7 0-42.5 16-89.6 16-47.1 0-60.8-16-89.6-16C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4zM416 464c0 8.8-7.2 16-16 16H48c-8.8 0-16-7.2-16-16v-41.6C32 365.9 77.9 320 134.4 320c19.6 0 39.1 16 89.6 16 50.4 0 70-16 89.6-16 56.5 0 102.4 45.9 102.4 102.4V464zM224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm0-224c52.9 0 96 43.1 96 96s-43.1 96-96 96-96-43.1-96-96 43.1-96 96-96z" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 4.5L6 8l3.5-3.5" />
    </svg>
  );
}

function SearchIcon() {
  // FA-light "search" — outline magnifying glass with elegant handle
  return (
    <svg viewBox="0 0 512 512" width="24" height="24" fill="currentColor" aria-hidden="true">
      <path d="M508.5 481.6l-129-129c-2.3-2.3-5.3-3.5-8.5-3.5h-10.3C395 312 416 262.5 416 208 416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c54.5 0 104-21 141.1-55.2V371c0 3.2 1.3 6.2 3.5 8.5l129 129c4.7 4.7 12.3 4.7 17 0l9.9-9.9c4.7-4.7 4.7-12.3 0-17zM208 384c-97.3 0-176-78.7-176-176S110.7 32 208 32s176 78.7 176 176-78.7 176-176 176z" />
    </svg>
  );
}

function WishlistIcon() {
  // FA-light "bookmark" — outline ribbon with V-cut bottom
  return (
    <svg viewBox="0 0 384 512" width="24" height="24" fill="currentColor" aria-hidden="true">
      <path d="M336 0H48C21.49 0 0 21.49 0 48v464l192-112 192 112V48c0-26.51-21.49-48-48-48zm16 456.287l-160-93.333-160 93.333V48c0-8.822 7.178-16 16-16h288c8.822 0 16 7.178 16 16v408.287z" />
    </svg>
  );
}

export function BagIcon() {
  // FA-light "shopping-bag" — outline shopping bag with rounded handle
  return (
    <svg viewBox="0 0 448 512" width="24" height="24" fill="currentColor" aria-hidden="true">
      <path d="M352 128C352 57.421 294.579 0 224 0 153.42 0 96 57.421 96 128H0v304c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V128h-96zM224 32c52.935 0 96 43.065 96 96H128c0-52.935 43.065-96 96-96zm192 400c0 26.467-21.533 48-48 48H80c-26.467 0-48-21.533-48-48V160h64v48c0 8.837 7.164 16 16 16s16-7.163 16-16v-48h192v48c0 8.837 7.163 16 16 16s16-7.163 16-16v-48h64v272z" />
    </svg>
  );
}

export default function Header() {
  return (
    <header className="site">
      {/* Row 1 — utility row */}
      <div className="header-top">
        <div className="header-left">
          <MobileNav />
          <Link className="util-link util-account" href="/account">
            <PersonIcon /> <span className="util-text">My Account</span>
          </Link>
          <button className="util-link util-currency" aria-label="Choose currency">
            INR/₹ <ChevronDown />
          </button>
        </div>

        <div className="brand">
          <Link href="/" className="brand-logo-link" aria-label="Elite Zone J — home">
            <Image
              src="/logo/wordmark-trimmed.png"
              alt="Elite Zone J"
              width={892}
              height={116}
              priority
              className="brand-wordmark"
            />
          </Link>
        </div>

        <div className="header-right">
          <SearchToggle />
          <WishlistHeaderLink />
          <CartDrawer />
        </div>
      </div>

      {/* Row 2 — primary navigation */}
      <nav className="header-nav">
        <ul className="nav-primary">
          {NAV.map((cat) => (
            <li key={cat.label} className={cat.groups ? "has-mega" : undefined}>
              <Link href={cat.href} className={cat.sale ? "nav-sale" : undefined}>{cat.label}</Link>
              {cat.groups && (
                <div className="mega">
                  <div className="row">
                    {cat.groups.map((g) => (
                      <div key={g.title}>
                        <h5>{g.title}</h5>
                        <ul>
                          {g.items.map((it) => (
                            <li key={it.href}>
                              <Link href={it.href}>
                                {it.label}
                                {it.meta && <span className="meta">{it.meta}</span>}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  {cat.footer && (
                    <div className="footer">
                      <span>{cat.footer.caption}</span>
                      <Link href={cat.footer.ctaHref}>{cat.footer.ctaLabel} &rarr;</Link>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
