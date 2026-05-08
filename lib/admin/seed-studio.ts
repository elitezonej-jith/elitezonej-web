import "server-only";
import type Database from "better-sqlite3";

// Seed dynamic homepage blocks + a couple of sample banners + one welcome
// notice the first time the studio comes up. Storefront reads these directly
// once the rewire lands.

export function seedStudioDefaults(db: Database.Database): void {
  // Homepage blocks — every section the original /app/page.tsx had,
  // now rendered dynamically.
  const insertBlock = db.prepare(`
    INSERT INTO homepage_blocks (type, title, kicker, config_json, sort_order, enabled)
    VALUES (?, ?, ?, ?, ?, 1)
  `);
  const blocks: Array<[string, string, string, Record<string, unknown>, number]> = [
    ["hero_grid", "Hero grid", "Three-tile entry", {
      tiles: [
        { kicker: "Premium", title: "The Heritage Edit", body: "Wedding-day tailoring, eight hours on the body.",
          image: "/generated/_hero/premium.webp", href: "/collection?c=men&sub=wedding-suits", cta: "Shop the edit" },
        { kicker: "New", title: "Just arrived", body: "The freshest tailoring of the season.",
          image: "/generated/_hero/new-arrivals.webp", href: "/collection?c=new", cta: "See what's new" },
        { kicker: "Bespoke", title: "Made to measure", body: "Choose your cloth. Get measured. Receive in seven days.",
          image: "/generated/_hero/made-to-measure.webp", href: "/bespoke", cta: "Begin a fitting" },
      ],
    }, 10],
    ["product_carousel", "New In", "Carousel", {
      filter: { kind: "tailored", status: "active", limit: 6 },
      cta: { label: "View all", href: "/collection" },
    }, 20],
    ["editorial_split", "How it's made.", "Studio note", {
      image: "/generated/_sections/atelier.webp",
      headline: "How it's <em>made</em>.",
      body: "By hand, in our Delhi atelier.",
      link: { label: "View Men's edit", href: "/collection?c=men" },
      align: "left",
    }, 30],
    ["editorial_split", "Designed in our studio.", "Women's edit", {
      image: "/generated/aria-pant-suit/01-front.webp",
      headline: "Designed in our studio. <em>Stitched by our master tailors.</em>",
      body: "A capsule for the modern Indian woman.",
      link: { label: "View Women's edit", href: "/collection?c=women" },
      align: "right",
    }, 40],
    ["product_carousel", "Festive Edit", "Carousel", {
      filter: { kind: "tailored", status: "active", category: "festive", limit: 6 },
      cta: { label: "Shop festive", href: "/collection?c=festive" },
    }, 50],
    ["full_banner", "Women's collection", "Cinematic", {
      image: "/generated/_sections/swim-banner.webp",
      headline: "The Women's Edit",
      body: "A capsule for the modern Indian woman.",
      cta: { label: "Shop Women", href: "/collection?c=women" },
    }, 60],
    ["service_cards", "Made For You", "Three services", {
      cards: [
        { kicker: "Service", title: "Bespoke Suit",     body: "Cloth library to your door, seven days.", image: "/generated/_sections/service-bespoke.webp",  cta: "Begin", href: "/bespoke" },
        { kicker: "Service", title: "Custom Sherwani",  body: "Hand-worked zardozi, drafted to your block.", image: "/generated/_sections/service-sherwani.webp", cta: "Begin", href: "/bespoke" },
        { kicker: "Service", title: "Tailored Shirts",  body: "Single-needle, twenty-two stitches per inch.", image: "/generated/_sections/service-shirts.webp",   cta: "Begin", href: "/bespoke" },
      ],
    }, 70],
    ["process_strip", "How it works", "Three steps", {
      steps: [
        { kicker: "Step one",   title: "Choose your cloth.",   body: "Italian wools, Egyptian poplins, hand-woven silks.", image: "/generated/_sections/process-cloth.webp" },
        { kicker: "Step two",   title: "Get measured.",        body: "In atelier, or at your home in Delhi NCR / Mumbai / Bangalore.", image: "/generated/_sections/process-measure.webp" },
        { kicker: "Step three", title: "Receive in seven days.", body: "Pressed, packed, and delivered to your door.", image: "/generated/_sections/process-finish.webp" },
      ],
    }, 80],
    ["wedding_editorial", "The Wedding Wardrobe", "Festive", {
      image: "/generated/_sections/editorial-wedding.webp",
      headline: "The Wedding Wardrobe",
      body: "Sherwanis, lehengas, sarees and bandhgalas — for the season ahead.",
      cta: { label: "Shop Festive", href: "/collection?c=festive" },
    }, 90],
    ["bespoke_teaser", "Made to measure", "Bespoke", {
      headline: "From sketch to fitting in seven days.",
      body: "Sit with our master tailor in Delhi, or have us come to you.",
      cta: { label: "Begin a fitting", href: "/bespoke" },
    }, 100],
    ["trust_strip", "Trust strip", "Promise", {
      items: [
        { kicker: "01", label: "Free shipping over ₹5,000" },
        { kicker: "02", label: "Lifetime mending on tailoring" },
        { kicker: "03", label: "Seven-day made-to-measure" },
        { kicker: "04", label: "Returns within 14 days" },
      ],
    }, 110],
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
