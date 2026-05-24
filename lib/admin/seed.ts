import "server-only";
import type Database from "better-sqlite3";
import { PRODUCTS } from "../products";
import { CAT_DATA, SUBCATS } from "../subcats";

// First-run seed: copy lib/products.ts into the SQLite catalog so the admin
// has a working dataset on day one. Inventory is generated from `sizes` field
// (with `-oos` suffix → stock 0 + oos_flag).

export function seedFromCatalog(db: Database.Database): void {
  const insertProduct = db.prepare(`
    INSERT INTO products (
      slug, name, cat, cat_link, price, sale_price, line,
      sizes_json, features_json, spec_json, note, fit, fabric,
      occasion, badge, gender, category, sub, kind, status, description
    ) VALUES (
      @slug, @name, @cat, @cat_link, @price, @sale_price, @line,
      @sizes_json, @features_json, @spec_json, @note, @fit, @fabric,
      @occasion, @badge, @gender, @category, @sub, @kind, @status, @description
    )
  `);
  const insertInventory = db.prepare(
    `INSERT OR REPLACE INTO inventory (product_slug, size, stock, oos_flag) VALUES (?, ?, ?, ?)`,
  );
  const insertFabricMeta = db.prepare(`
    INSERT OR REPLACE INTO fabric_meta
      (product_slug, width_inches, gsm, composition, care, origin, stock_meters_total)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertFabricColour = db.prepare(`
    INSERT INTO fabric_colours (product_slug, name, hex, stock_meters, image_dir, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertCategory = db.prepare(
    `INSERT INTO categories (parent_id, name, slug, gender, kind, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
  );
  const insertHomeSection = db.prepare(`
    INSERT OR REPLACE INTO home_sections
      (key, title, kicker, body, image_path, link_text, link_href, sort_order, enabled, extras_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `);
  const insertSetting = db.prepare(
    `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
  );

  const tx = db.transaction(() => {
    for (const p of PRODUCTS) {
      insertProduct.run({
        slug: p.slug,
        name: p.name,
        cat: p.cat,
        cat_link: p.catLink,
        price: p.price,
        sale_price: p.salePrice ?? null,
        line: p.line,
        sizes_json: JSON.stringify(p.sizes ?? []),
        features_json: JSON.stringify(p.features ?? []),
        spec_json: JSON.stringify(p.spec ?? []),
        note: p.note ?? "",
        fit: p.fit,
        fabric: p.fabric,
        occasion: p.occasion,
        badge: p.badge,
        gender: p.gender,
        category: p.category,
        sub: p.sub ?? null,
        kind: p.kind === "fabric" ? "fabric" : "tailored",
        status: "active",
        description: p.description ?? null,
      });

      // Inventory rows from sizes[]; "-oos" suffix → out-of-stock marker.
      for (const raw of p.sizes ?? []) {
        const oos = raw.endsWith("-oos");
        const size = oos ? raw.slice(0, -4) : raw;
        insertInventory.run(p.slug, size, oos ? 0 : 6, oos ? 1 : 0);
      }

      // Fabric-only metadata.
      if (p.kind === "fabric" && p.fabricMeta) {
        insertFabricMeta.run(
          p.slug,
          p.fabricMeta.widthInches,
          p.fabricMeta.gsm,
          p.fabricMeta.composition,
          p.fabricMeta.care,
          p.fabricMeta.origin,
          p.fabricMeta.stockMeters,
        );
        const variants = p.colourVariants ??
          (p.colour ? [{ name: p.colour, hex: p.colourHex ?? "#000000" }] : []);
        const baseStock = Math.max(
          1,
          Math.floor((p.fabricMeta.stockMeters ?? 0) / Math.max(variants.length, 1)),
        );
        variants.forEach((v, i) => {
          insertFabricColour.run(
            p.slug,
            v.name,
            v.hex,
            baseStock + (i === 0 ? (p.fabricMeta!.stockMeters % variants.length) : 0),
            `${p.slug}/${v.name.toLowerCase()}`,
            i,
          );
        });
      }
    }

    // Top-level categories from CAT_DATA.
    let order = 0;
    for (const slug of Object.keys(CAT_DATA)) {
      insertCategory.run(null, CAT_DATA[slug].title, slug, null, null, order++);
    }
    // Sub-categories under men/women.
    const parentOf = (slug: string): number | null => {
      const row = db
        .prepare("SELECT id FROM categories WHERE slug = ? AND parent_id IS NULL")
        .get(slug) as { id: number } | undefined;
      return row?.id ?? null;
    };
    for (const gender of Object.keys(SUBCATS) as Array<keyof typeof SUBCATS>) {
      const pid = parentOf(gender as string);
      if (!pid) continue;
      let so = 0;
      for (const sub of Object.keys(SUBCATS[gender])) {
        const meta = SUBCATS[gender][sub];
        insertCategory.run(pid, meta.title, sub, gender as string, null, so++);
      }
    }

    // Home sections — seeded with the editorial copy currently hardcoded on /.
    const sections: Array<[string, string, string, string, string, string, string, number, string?]> = [
      ["hero-premium", "The Premium Edit", "Premium", "Heritage tailoring at its most considered.", "/generated/_hero/premium.webp", "Shop the edit", "/collection?c=men&sub=wedding-suits", 1],
      ["hero-new-arrivals", "Just Arrived", "New", "The freshest tailoring of the season.", "/generated/_hero/new-arrivals.webp", "See what's new", "/collection?c=new", 2],
      ["hero-made-to-measure", "Made to Measure", "Bespoke", "Choose your cloth. Get measured. Receive in seven days.", "/generated/_hero/made-to-measure.webp", "Begin a fitting", "/bespoke", 3],
      ["editorial-atelier", "How it's made.", "Studio note", "By hand, in our atelier.", "/generated/_sections/atelier.webp", "View Men's edit", "/collection?c=men", 10],
      ["editorial-women", "Designed in our studio.", "Women's edit", "Stitched by our master tailors.", "/generated/aria-pant-suit/01-front.webp", "View Women's edit", "/collection?c=women", 11],
      ["process-cloth", "Choose your cloth.", "Step one", "From a library of Italian wools, Egyptian poplins, hand-woven silks.", "/generated/_sections/process-cloth.webp", "", "", 20],
      ["process-measure", "Get measured.", "Step two", "At your home, anywhere in India.", "/generated/_sections/process-measure.webp", "", "", 21],
      ["process-finish", "Receive in seven days.", "Step three", "Pressed, packed, and delivered to your door.", "/generated/_sections/process-finish.webp", "", "", 22],
      ["service-bespoke", "Bespoke Suit", "Service", "From the cloth library, to your door, in seven days.", "/generated/_sections/service-bespoke.webp", "Begin", "/bespoke", 30],
      ["service-sherwani", "Custom Sherwani", "Service", "Hand-worked zardozi, drafted to your block.", "/generated/_sections/service-sherwani.webp", "Begin", "/bespoke", 31],
      ["service-shirts", "Tailored Shirts", "Service", "Egyptian poplin, single-needle, twenty-two stitches per inch.", "/generated/_sections/service-shirts.webp", "Begin", "/bespoke", 32],
      ["banner-collection", "The Women's Edit", "Cinematic", "A capsule for the modern Indian woman.", "/generated/_sections/swim-banner.webp", "Shop Women", "/collection?c=women", 40],
      ["editorial-wedding", "The Wedding Wardrobe", "Festive", "Sherwanis, lehengas, sarees, and bandhgalas — for the season ahead.", "/generated/_sections/editorial-wedding.webp", "Shop Festive", "/collection?c=festive", 50],
    ];
    for (const s of sections) {
      insertHomeSection.run(s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7], null);
    }

    // Default settings.
    const defaults: Array<[string, string]> = [
      ["brand_name", "Elite Zone J"],
      ["brand_tagline", "Cut to fit. Built to last."],
      ["currency", "INR"],
      ["currency_symbol", "₹"],
      ["contact_email", "atelier@elitezonej.com"],
      ["contact_phone", "+91 98XXX XXXXX"],
      ["atelier_address", "India"],
      ["instagram", "https://instagram.com/elitezonej"],
      ["lead_time_days", "7"],
      ["low_stock_threshold", "3"],
    ];
    for (const [k, v] of defaults) insertSetting.run(k, v);
  });

  tx();
}
