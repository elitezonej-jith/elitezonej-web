import "server-only";
import type Database from "better-sqlite3";

// Seed the homepage blocks + a couple of sample banners + one welcome notice
// the first time the studio comes up. These blocks reproduce the original
// hardcoded homepage 1:1 (copy, images, links and order) so the storefront is
// content-identical the moment it reads from the DB. Bump SEED_VERSION whenever
// this parity set changes — lib/admin/db.ts refreshes existing dev DBs on a
// version bump (see reseedStudioIfStale).
export const SEED_VERSION = 2;

export function seedStudioDefaults(db: Database.Database): void {
  const insertBlock = db.prepare(`
    INSERT INTO homepage_blocks (type, title, kicker, config_json, sort_order, enabled)
    VALUES (?, ?, ?, ?, ?, 1)
  `);
  const blocks: Array<[string, string, string, Record<string, unknown>, number]> = [
    ["announce_bar", "Announce bar", "Top ticker", {
      ariaLabel: "FREE DELIVERY ON ORDERS OVER ₹15,000 — MADE-TO-MEASURE IN SEVEN DAYS",
      items: [
        { text: "Complimentary delivery on orders over ", accent: "₹15,000", suffix: "" },
        { text: "Made-to-measure in ", accent: "seven days", suffix: "" },
        { text: "Bespoke appointments at our ", accent: "atelier", suffix: "" },
        { text: "Home fittings ", accent: "across India", suffix: "" },
      ],
    }, 10],
    ["hero_grid", "Hero grid", "Three-tile entry", {
      tiles: [
        {
          eyebrow: "House · 2026",
          title: "Premium\nCollection",
          sub: "Discover our finest selection",
          cta: "Shop Now",
          href: "/collection?c=men",
          img: "/generated/_hero/premium.webp",
          pos: "center top",
          veil: "left",
        },
        {
          eyebrow: "New Arrivals",
          title: "New\nArrivals",
          sub: "Fresh styles for the season",
          cta: "Explore",
          href: "/collection?c=new",
          img: "/generated/_hero/new-arrivals.webp",
          pos: "center 25%",
          veil: "up",
        },
        {
          eyebrow: "Bespoke · Made-to-measure",
          title: "Made to\nMeasure",
          sub: "Tailored perfection",
          cta: "Customize",
          href: "/bespoke",
          img: "/generated/_hero/made-to-measure.webp",
          pos: "center center",
          veil: "right",
        },
      ],
    }, 20],
    ["product_carousel", "New In", "Carousel", {
      ctaLabel: "View All Products",
      ctaHref: "/collection?c=men",
      headingSide: "left",
      filter: { gender: "men", limit: 6 },
    }, 30],
    ["editorial_split", "The Men's Edit", "Editorial", {
      title: "The Men's Edit",
      ctaLabel: "Shop Menswear",
      ctaHref: "/collection?c=men",
      image: "/generated/_sections/atelier.webp",
      imageAlt: "Master tailor at the atelier",
      imageSide: "left",
      filter: { gender: "men", limit: 6 },
    }, 40],
    ["editorial_split", "The Women's Edit", "Editorial", {
      title: "The Women's Edit",
      ctaLabel: "Shop Womenswear",
      ctaHref: "/collection?c=women",
      image: "/generated/aria-pant-suit/01-front.webp",
      imageAlt: "The Women's Edit — aria pant suit",
      imageSide: "right",
      filter: { gender: "women", limit: 6 },
    }, 50],
    ["product_carousel", "Festive Edit", "Carousel", {
      ctaLabel: "View All Products",
      ctaHref: "/collection?c=festive",
      headingSide: "right",
      filter: { gender: "women", limit: 6 },
    }, 60],
    ["full_banner", "Women's collection", "Cinematic", {
      href: "/collection?c=women",
      image: "/generated/_sections/swim-banner.webp",
      imgAria: "Women's summer collection editorial",
      eyebrow: "New season",
      title: "Women's Collection",
      titleEm: ".",
      ctaLabel: "Shop Now",
      ariaLabel: "Shop the Women's Collection",
    }, 70],
    ["service_cards", "Made for you", "Three services", {
      heading: "Made for you",
      meta: "Section · 01",
      items: [
        {
          href: "/bespoke",
          photo: "mfy-1",
          alt: "Master tailor measuring a client",
          eyebrow: "Bespoke",
          title: "The Bespoke Suit",
          body: "Three fittings, paper pattern drafted to your figure, four to six weeks. From ₹45,000.",
          cta: "Begin your suit",
        },
        {
          href: "/bespoke",
          photo: "mfy-2",
          alt: "Festive sherwani in silk",
          eyebrow: "Made to measure",
          title: "Custom Sherwani",
          body: "Choose your cloth, lining, collar, and length. Festive-ready in seven days. From ₹28,000.",
          cta: "Configure yours",
        },
        {
          href: "/bespoke",
          photo: "mfy-3",
          alt: "Tailored shirt detail",
          eyebrow: "Made to measure",
          title: "Tailored Shirts",
          body: "Premium cotton, poplin, and linen. Cut to your measurements, delivered in five days. From ₹2,800.",
          cta: "Order yours",
        },
      ],
    }, 80],
    ["process_strip", "How it works", "Three steps", {
      ariaLabel: "How it's made",
      titlePre: "How it's ",
      titleEm: "made",
      titlePost: ".",
      kicker: "By hand.",
      hint: "Drag to explore",
      footText: "Standard delivery · Free across India",
      ctaLabel: "Book a fitting",
      ctaHref: "/bespoke#book",
      panes: [
        {
          photoClass: "pr-1",
          photoAria: "Cloth library — wool swatches",
          step: "Cloth",
          title: "Choose your cloth.",
          body: "Browse our cloth library — wools from Italian and English mills, premium Indian cottons, hand-woven silks. Order swatches free, posted from our atelier within 48 hours.",
        },
        {
          photoClass: "pr-2",
          photoAria: "Master tailor at the cutting table",
          step: "Fitting",
          title: "Get measured.",
          body: "Book a home fitting at your address. Fourteen measurements, taken by our master tailors. Forty minutes, complimentary chai.",
        },
        {
          photoClass: "pr-3",
          photoAria: "Finished suit, pressed and ready",
          step: "Delivery",
          title: "Receive in seven days.",
          body: "Cut, stitched, and pressed in our workroom. Lifetime mending, on the house.",
        },
      ],
    }, 90],
    ["wedding_editorial", "The Wedding Wardrobe", "Festive", {
      ix: "Seasons · The Wedding Wardrobe",
      headlinePre: "A six-piece capsule for the season's weddings — from ",
      headlineEm: "haldi",
      headlinePost: " to reception.",
      paras: [
        "Indian wedding seasons run long. We designed a tight capsule of six pieces that cover every occasion from morning ceremonies to formal receptions — built around one tailored fit, three cloth weights, and the quiet hardware of an evening worth remembering.",
        "Photographed January 2026.",
      ],
      ctaLabel: "Shop the wedding wardrobe",
      ctaHref: "/collection?c=sherwani",
      signed: "By the Elite Zone J design team",
      imgAria: "The Wedding Wardrobe — sherwani",
    }, 100],
    ["bespoke_teaser", "Made to measure", "Bespoke", {
      ix: "Bespoke · Made-to-measure",
      headlinePre: "Designed in our studio. ",
      headlineEm: "Stitched by our master tailors.",
      body: "Twelve designers and twenty-six tailors. Book a home fitting at your address.",
      ctaLabel: "Visit the atelier",
      ctaHref: "/bespoke",
    }, 110],
    ["trust_strip", "Trust strip", "Promise", {}, 120],
    ["promo_modal", "Promo modal", "15% offer", {
      stickerLabel: "15% OFF",
      heading: "Take 15% off\nyour first order",
      deck: "Join the Elite Zone J mailing list\nfor exclusive VIP offers and more.",
      submitLabel: "Subscribe and save 15%",
      finePrint: "*15% off your first order is valid on full-priced items only and cannot be used in conjunction with sale items or any other promotional codes.",
      successHeading: "Welcome.",
      successBody: "Thanks for joining — we'll email your 15% code to {email} shortly.",
      countries: [
        "India", "United Kingdom", "United States", "United Arab Emirates",
        "Canada", "Australia", "Singapore", "Germany", "France", "Other",
      ],
    }, 130],
  ];
  for (const [type, title, kicker, cfg, order] of blocks) {
    insertBlock.run(type, title, kicker, JSON.stringify(cfg), order);
  }

  // Banners — three sample top-of-site banners
  const insertBanner = db.prepare(`
    INSERT INTO banners (title, subtitle, button_text, button_href, image_path, mobile_image_path,
                         text_align, text_color, status, enabled, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published', 1, ?)
  `);
  insertBanner.run(
    "The Heritage Three-Piece",
    "Wedding-day tailoring, eight hours on the body.",
    "Shop the edit",
    "/collection?c=men&sub=wedding-suits",
    "/generated/_hero/premium.webp",
    "/generated/_hero/premium.webp",
    "left", "light", 10,
  );
  insertBanner.run(
    "Festive Edit · 2026",
    "From haldi to reception, in seven days.",
    "Shop festive",
    "/collection?c=festive",
    "/generated/_sections/editorial-wedding.webp",
    "/generated/_sections/editorial-wedding.webp",
    "center", "light", 20,
  );
  insertBanner.run(
    "Made-to-measure",
    "Choose your cloth. Get measured. Receive in seven days.",
    "Begin a fitting",
    "/bespoke",
    "/generated/_sections/atelier.webp",
    "/generated/_sections/atelier.webp",
    "right", "light", 30,
  );

  // One scrolling notice
  db.prepare(`
    INSERT INTO notices (type, body, link_href, link_text, priority, dismissable, enabled, target_paths)
    VALUES ('scroll',
            'Free shipping over ₹5,000 · Made-to-measure in seven days · Lifetime mending on tailoring',
            '/bespoke', 'Begin a fitting', 100, 0, 1, '*')
  `).run();
}
