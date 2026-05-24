export type FabricColour = { name: string; hex: string };

export type FabricMeta = {
  widthInches: number;
  gsm: number;
  composition: string;
  care: string;
  origin: string;
  stockMeters: number;
};

export type Product = {
  slug: string;
  name: string;
  cat: string;        // breadcrumb-style "Category · Subcategory"
  catLink: "Men" | "Women" | "Fabrics";
  price: number;
  salePrice?: number;
  line: string;       // editorial one-liner
  sizes: string[];    // a "-oos" suffix marks out-of-stock
  features: string[];
  spec: [string, string][];
  note: string;
  fit: string;
  fabric: string;
  occasion: string;
  badge: string | null;
  gender: "men" | "women" | "unisex";
  category: string;
  sub?: string;
  // Fabric-only fields. Set kind:"fabric" to opt this row into the
  // fabric listing/PDP layout (no filters, meter selector, swatches).
  kind?: "fabric";
  description?: string;
  colour?: string;
  colourHex?: string;
  colourVariants?: FabricColour[];
  fabricMeta?: FabricMeta;
  // ISO timestamp from the DB row; absent for static-only entries.
  // Used by the collection "Newest" sort.
  createdAt?: string;
  // Per-product size guide (free-form text). Empty string = use the generic
  // /size-guide page link only.
  sizeGuide?: string;
};

export const PRODUCTS: Product[] = [
  // ── Men ──
  {
    slug: "heritage-three-piece",
    name: "The Heritage Three-Piece",
    cat: "Suits · Three-Piece",
    catLink: "Men",
    price: 62000,
    line: "A tailored three-piece in 280gsm Italian wool, cut for the eight hours of a wedding day.",
    sizes: ["36", "38", "40", "42", "44", "46-oos"],
    features: [
      "Two-button single-breasted, notch lapels, side vents",
      "Half-canvas construction with hand-padded lapels",
      "Six-button waistcoat, adjustable back",
      "Flat-front trousers, side adjusters, unfinished hem",
    ],
    spec: [
      ["Cloth", "Super 120s pure wool"],
      ["Weight", "280 gsm"],
      ["Mill", "Vitale Barberis Canonico, Biella, Italy"],
      ["Lining", "Bemberg cupro"],
      ["Construction", "Half-canvas, hand-padded lapels"],
      ["Fit", "Tailored, modern"],
      ["Closure", "Two-button, single-breasted, side vents"],
      ["Made in", "Delhi, India"],
    ],
    note: "We drafted this three-piece for Indian wedding seasons — eight or nine hours on the body, sometimes longer. The 280gsm cloth is heavy enough to hold its shape through the day, light enough to wear in October.",
    fit: "Tailored", fabric: "Wool", occasion: "Wedding", badge: "Bespoke",
    gender: "men", category: "suits", sub: "wedding-suits",
  },
  {
    slug: "two-piece-italian",
    name: "Two-Piece in Italian Wool",
    cat: "Suits · Two-Piece",
    catLink: "Men",
    price: 48000,
    salePrice: 36000,
    line: "A modern two-piece in fine Italian wool — the boardroom and the dinner table, in one suit.",
    sizes: ["36", "38-oos", "40", "42", "44", "46"],
    features: [
      "Slim-fit, two-button single-breasted, notch lapels",
      "Pick-stitched lapel edge",
      "Side adjusters, flat-front trousers",
      "Pure Italian wool, 240 gsm",
    ],
    spec: [
      ["Cloth", "Italian wool"], ["Weight", "240 gsm"],
      ["Mill", "Reda 1865, Biella, Italy"], ["Lining", "Bemberg cupro"],
      ["Construction", "Half-canvas"], ["Fit", "Slim, modern"],
      ["Closure", "Two-button, side vents"], ["Made in", "Delhi, India"],
    ],
    note: "Navy is the most-worn colour in our showroom. We made this one slimmer through the chest and waist than our heritage cut — built for younger professionals who wear a suit four days a week.",
    fit: "Slim", fabric: "Wool", occasion: "Boardroom", badge: "Sale",
    gender: "men", category: "suits", sub: "business-suits",
  },
  {
    slug: "black-tie-tuxedo",
    name: "Black-Tie Tuxedo",
    cat: "Suits · Tuxedo",
    catLink: "Men",
    price: 78000,
    line: "A midnight-black tuxedo in pure wool with hand-finished satin lapels — for the rooms that still ask.",
    sizes: ["36", "38", "40", "42-oos", "44", "46"],
    features: [
      "Single-button, peak-lapel, hand-finished satin",
      "Satin side-stripe trousers",
      "Hand-tied silk bow tie included",
      "Pleated wing-collar shirt sold separately",
    ],
    spec: [
      ["Cloth", "Pure wool, midnight black"], ["Weight", "290 gsm"],
      ["Lapel", "Silk satin, hand-finished"], ["Lining", "Black silk-blend"],
      ["Construction", "Full-canvas"], ["Fit", "Tailored, modern"],
      ["Closure", "Single-button, peak-lapel, no vents"], ["Made in", "Delhi, India"],
    ],
    note: "A tuxedo should be the second-most-noticed thing in the room. The satin should catch one light, not three. We chose midnight over jet black because it photographs cleaner under tungsten.",
    fit: "Tailored", fabric: "Wool", occasion: "Black Tie", badge: "New",
    gender: "men", category: "suits", sub: "tuxedos",
  },
  {
    slug: "festive-sherwani",
    name: "Festive Sherwani",
    cat: "Sherwani · Festive",
    catLink: "Men",
    price: 38500,
    salePrice: 28900,
    line: "Ivory raw silk with hand-worked zardozi — the sherwani for the front row at the family wedding.",
    sizes: ["36", "38", "40", "42", "44", "46"],
    features: [
      "Ivory raw silk, mandarin band collar",
      "Hand-worked zardozi gold thread embroidery",
      "Knee-length, structured fit",
      "Includes matching churidar trousers and dupatta",
    ],
    spec: [
      ["Fabric", "Raw silk, ivory"], ["Embroidery", "Zardozi, hand-worked gold thread"],
      ["Length", "Knee, fitted"], ["Trousers", "Ivory churidar, matching"],
      ["Dupatta", "Deep maroon silk, embroidered border"], ["Lining", "Cotton mulmul"],
      ["Made in", "Lucknow & Delhi, India"],
    ],
    note: "The zardozi on this piece is done by a karkhana in old Lucknow; the work takes seventeen days. We shortened the length from our heritage cut by two inches — the proportion sits better on a 5'10\" frame.",
    fit: "Tailored", fabric: "Silk", occasion: "Festive", badge: "Sale",
    gender: "men", category: "sherwani", sub: "wedding-suits",
  },
  {
    slug: "linen-bandhgala",
    name: "Linen Bandhgala",
    cat: "Suits · Bandhgala",
    catLink: "Men",
    price: 26800,
    line: "Beige linen with bone buttons — Indian summer formal, cut for sun and ceiling fans.",
    sizes: ["36", "38", "40", "42", "44", "46-oos"],
    features: [
      "Single-breasted, mandarin collar",
      "Hand-finished bone buttons",
      "Heavy-weight Indian linen, 280 gsm",
      "Matching trousers included",
    ],
    spec: [
      ["Fabric", "Indian linen, beige"], ["Weight", "280 gsm"],
      ["Buttons", "Hand-finished bone"], ["Lining", "Bemberg cupro, half-lined"],
      ["Construction", "Half-canvas"], ["Fit", "Tailored"],
      ["Closure", "Single-breasted, mandarin collar"], ["Made in", "Delhi, India"],
    ],
    note: "Linen creases. That is part of the cloth. We finish ours so the creases sit on the right places — at the elbow, the inner thigh — rather than the wrong ones. Steam between wears, do not iron.",
    fit: "Tailored", fabric: "Linen", occasion: "Festive", badge: "Sale", salePrice: 17900,
    gender: "men", category: "suits", sub: "wedding-suits",
  },
  {
    slug: "grandad-collar-shirt",
    name: "Grandad Collar Poplin Shirt",
    cat: "Shirts · Casual",
    catLink: "Men",
    price: 3200,
    line: "A clean-cut grandad shirt in Egyptian cotton poplin — the one you'll reach for first.",
    sizes: ["36", "38", "40", "42", "44", "46"],
    features: [
      "Egyptian cotton poplin, 100s 2-ply",
      "Grandad collar (no top button)",
      "Mother-of-pearl buttons",
      "Slim modern fit, single-needle stitching",
    ],
    spec: [
      ["Fabric", "Egyptian cotton poplin"], ["Yarn", "100s 2-ply"],
      ["Mill", "Thomas Mason, Italy"], ["Buttons", "Mother-of-pearl"],
      ["Stitching", "Single-needle, 22 stitches per inch"], ["Fit", "Slim modern"],
      ["Made in", "Mumbai, India"],
    ],
    note: "Most of our customers buy three of these in their first order and then keep ordering. The cloth softens after six washes and is at its best at fifty.",
    fit: "Slim", fabric: "Cotton", occasion: "Casual", badge: "Sale", salePrice: 1999,
    gender: "men", category: "shirts", sub: "mandarin-shirts",
  },
  // ── Women ──
  {
    slug: "aria-pant-suit",
    name: "The Aria Pant Suit",
    cat: "Women · Tailoring",
    catLink: "Women",
    price: 54000,
    line: "Ivory wool, double-breasted, sharp shoulders — the suit for women who run the room.",
    sizes: ["XS", "S", "M", "L", "XL", "XXL-oos"],
    features: [
      "Double-breasted, peaked satin lapel, six-button",
      "Structured shoulder, hand-padded canvas",
      "High-waisted wide-leg trouser, sharp pleat",
      "Ink-black silk camisole included",
    ],
    spec: [
      ["Cloth", "Italian wool, ivory"], ["Weight", "240 gsm"],
      ["Lining", "Bemberg cupro"], ["Construction", "Half-canvas"],
      ["Fit", "Tailored, modern"], ["Closure", "Double-breasted, six-button"],
      ["Made in", "Delhi, India"],
    ],
    note: "Power tailoring for women is finally being made by women, in India. We drafted the shoulder line on this piece for an Indian frame — narrower than European blocks.",
    fit: "Tailored", fabric: "Wool", occasion: "Boardroom", badge: "New",
    gender: "women", category: "suits", sub: "office-wear",
  },
  {
    slug: "midnight-slip-dress",
    name: "Midnight Silk Slip Dress",
    cat: "Women · Eveningwear",
    catLink: "Women",
    price: 22500,
    salePrice: 16800,
    line: "Bias-cut silk, midnight black — the dress that lets the wearer be the loudest thing in the room.",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    features: [
      "100% pure silk-satin, bias-cut",
      "Spaghetti straps, plunging V-neckline",
      "Mid-calf length, fluid drape",
      "Hand-rolled hem",
    ],
    spec: [
      ["Fabric", "100% pure silk-satin"], ["Weight", "19 momme"],
      ["Cut", "Bias"], ["Length", "Mid-calf"],
      ["Hem", "Hand-rolled"], ["Fit", "Slim, fluid"],
      ["Made in", "Delhi, India"],
    ],
    note: "A bias-cut silk dress is the hardest thing in fashion to make properly — the cloth has to relax for forty-eight hours after cutting before we sew.",
    fit: "Slim", fabric: "Silk", occasion: "Black Tie", badge: "Sale",
    gender: "women", category: "dresses", sub: "evening-gowns",
  },
  {
    slug: "embroidered-lehenga",
    name: "Embroidered Festive Lehenga",
    cat: "Women · Festive",
    catLink: "Women",
    price: 84000,
    line: "Maroon raw silk, hand-worked zardozi, gold sheer dupatta — for the front row at the wedding.",
    sizes: ["XS", "S", "M", "L", "XL"],
    features: [
      "Maroon raw silk, deep maroon velvet blouse",
      "Hand-worked zardozi gold thread embroidery",
      "Floor-length flared lehenga skirt",
      "Embroidered sheer gold dupatta included",
    ],
    spec: [
      ["Fabric", "Raw silk, velvet, sheer net"],
      ["Embroidery", "Zardozi, gold thread, sequins"],
      ["Length", "Floor-length, flared"], ["Lining", "Cotton mulmul"],
      ["Set", "Blouse + lehenga + dupatta"], ["Made in", "Lucknow & Delhi, India"],
    ],
    note: "Three karkhanas in old Lucknow worked twenty-eight days on the embroidery. We sized the silhouette for an Indian frame — the mid-section sits closer to the natural waist.",
    fit: "Tailored", fabric: "Silk", occasion: "Festive", badge: "Festive",
    gender: "women", category: "festive", sub: "evening-gowns",
  },
  {
    slug: "velvet-blazer-dress",
    name: "Velvet Blazer Dress",
    cat: "Women · Eveningwear",
    catLink: "Women",
    price: 32800,
    salePrice: 24600,
    line: "Burgundy velvet, single-breasted, mid-thigh — the blazer dress for evenings that go late.",
    sizes: ["XS", "S", "M", "L-oos", "XL", "XXL"],
    features: [
      "Burgundy cotton-velvet, structured",
      "Single-breasted, peaked lapel",
      "Single-button waist cinch",
      "Mid-thigh length",
    ],
    spec: [
      ["Fabric", "Cotton velvet, deep burgundy"], ["Weight", "260 gsm"],
      ["Lining", "Bemberg cupro"], ["Construction", "Half-canvas"],
      ["Fit", "Tailored, fitted"], ["Length", "Mid-thigh"],
      ["Made in", "Delhi, India"],
    ],
    note: "Velvet draws light differently from wool, so we cut the lapel at a deeper angle — you read the silhouette before you read the cloth.",
    fit: "Tailored", fabric: "Velvet", occasion: "Black Tie", badge: "Sale",
    gender: "women", category: "dresses", sub: "evening-gowns",
  },
  {
    slug: "camel-trench",
    name: "The Camel Trench",
    cat: "Women · Outerwear",
    catLink: "Women",
    price: 46500,
    line: "Wool-cashmere, double-breasted, the colour of an October afternoon — quietly perfect.",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    features: [
      "85% wool / 15% cashmere blend",
      "Double-breasted with self-tie belt",
      "Epaulettes, gun flap, storm shield",
      "Knee-length, slightly oversized cut",
    ],
    spec: [
      ["Fabric", "Wool-cashmere blend"], ["Weight", "420 gsm"],
      ["Lining", "Bemberg cupro, half-lined"], ["Buttons", "Horn"],
      ["Length", "Knee"], ["Fit", "Slightly oversized"],
      ["Made in", "Delhi, India"],
    ],
    note: "A trench is the only coat you'll buy once and wear for the next fifteen winters. We chose wool-cashmere over the traditional gabardine because it sits softer on the body and ages more beautifully.",
    fit: "Regular", fabric: "Wool", occasion: "Casual", badge: null,
    gender: "women", category: "outerwear", sub: "office-wear",
  },
  {
    slug: "raw-silk-saree",
    name: "Raw Silk Drape Saree",
    cat: "Women · Festive",
    catLink: "Women",
    price: 28500,
    line: "Dusky rose with a wine border, draped open-pallu — the modern saree for the modern woman.",
    sizes: ["One size — Drape adjusted to height"],
    features: [
      "Dusky rose raw silk, deep wine embroidered border",
      "Modern open-pallu drape",
      "Sleeveless deep-V wine silk blouse included",
      "Pre-stitched optional (₹2,000)",
    ],
    spec: [
      ["Fabric", "Raw silk"], ["Border", "Hand-embroidered, wine + gold"],
      ["Length", "5.5 metres"], ["Blouse", "Wine silk, deep-V, sleeveless"],
      ["Set", "Saree + blouse + petticoat"], ["Made in", "Varanasi & Delhi, India"],
    ],
    note: "We cut blouses on a women's-frame block, not the inherited men's-tailoring shoulder line that most ateliers still use.",
    fit: "Tailored", fabric: "Silk", occasion: "Festive", badge: "Sale", salePrice: 19500,
    gender: "women", category: "festive", sub: "evening-gowns",
  },

  // ── Men · Pants ──
  {
    slug: "tapered-wool-trouser",
    name: "Tapered Wool Trouser",
    cat: "Men · Pants",
    catLink: "Men",
    price: 8400,
    salePrice: 5900,
    line: "Charcoal Italian wool, flat-front, slim through the leg — the trouser to wear with everything.",
    sizes: ["28","30","32","34","36","38"],
    features: [
      "Italian wool, flat-front, slim tapered cut",
      "Side adjusters, no belt loops",
      "Clean break at the ankle",
      "Hand-finished waistband",
    ],
    spec: [
      ["Cloth","Italian wool"], ["Weight","220 gsm"],
      ["Cut","Flat-front, tapered"], ["Closure","Hidden zip, hook-and-bar"],
      ["Adjusters","Side adjusters, no belt loops"], ["Made in","Delhi, India"],
    ],
    note: "The hardest thing in trouser-making is the line from knee to ankle. We pin and re-pin three times before we cut. Worn with sneakers, oxfords, or loafers — these work for the next ten years.",
    fit: "Tailored", fabric: "Wool", occasion: "Boardroom", badge: "Sale",
    gender: "men", category: "pants", sub: "tapered-pants",
  },
  {
    slug: "italian-pleated-trouser",
    name: "Italian Pleated Trouser",
    cat: "Men · Pants",
    catLink: "Men",
    price: 9800,
    line: "High-rise, single-pleated cream wool — the Italian sartorial cut, made for an Indian frame.",
    sizes: ["28","30","32","34-oos","36","38"],
    features: [
      "Cream Italian wool, high-rise",
      "Single front pleat, sharp pressed crease",
      "Side adjusters, turn-up cuff option",
      "Hand-finished waistband",
    ],
    spec: [
      ["Cloth","Italian wool"], ["Weight","260 gsm"],
      ["Cut","Single-pleated, high-rise"], ["Closure","Hook-and-bar, hidden zip"],
      ["Cuff","2-inch turn-up (default)"], ["Made in","Delhi, India"],
    ],
    note: "A pleated trouser should sit at the natural waist. We've kept the rise high — it makes the leg longer, the silhouette sharper. Most Indian brands cut these too low.",
    fit: "Tailored", fabric: "Wool", occasion: "Boardroom", badge: "New",
    gender: "men", category: "pants", sub: "pleated-pants",
  },

  // ── Men · Accessories ──
  {
    slug: "lapel-brooch-set",
    name: "Mughal Brass Lapel Brooch",
    cat: "Men · Accessories · Brooch",
    catLink: "Men",
    price: 4800,
    line: "Hand-finished antique brass, set with a single freshwater pearl — small punctuation for the lapel.",
    sizes: ["One size"],
    features: [
      "Hand-finished antique brass",
      "Single freshwater pearl, 6mm",
      "Mughal flower silhouette, 22mm",
      "Pin-back fitting, individually packaged",
    ],
    spec: [
      ["Material","Antique brass, hand-finished"], ["Stone","Freshwater pearl, 6mm"],
      ["Dimensions","22mm × 22mm"], ["Fitting","Pin-back"],
      ["Packaging","Wooden box, hand-stamped"], ["Made in","Jaipur, India"],
    ],
    note: "A brooch is the only piece of menswear hardware that lets you say something without speaking. We made this one small on purpose — the wearer leans in, then you see it.",
    fit: "Tailored", fabric: "Cotton", occasion: "Wedding", badge: null,
    gender: "men", category: "accessories", sub: "brooches",
  },
  {
    slug: "calfskin-belt",
    name: "Italian Calfskin Belt",
    cat: "Men · Accessories · Belt",
    catLink: "Men",
    price: 6200,
    line: "Tan Italian calfskin, hand-finished brass buckle — the only belt you'll need this year.",
    sizes: ["32","34","36","38","40","42"],
    features: [
      "Italian full-grain calfskin",
      "Hand-finished antique brass buckle",
      "1.4-inch width, formal proportion",
      "Hand-burnished edges, lifetime mending",
    ],
    spec: [
      ["Leather","Italian full-grain calfskin"], ["Buckle","Antique brass, hand-finished"],
      ["Width","1.4 inches (35mm)"], ["Edges","Hand-burnished"],
      ["Lining","Calfskin, full-grain"], ["Made in","Delhi, India"],
    ],
    note: "You buy a belt once. We chose Italian calfskin because it darkens beautifully over five years; brass because it ages better than chrome. Mend it with us, free, for life.",
    fit: "Tailored", fabric: "Cotton", occasion: "Boardroom", badge: null,
    gender: "men", category: "accessories", sub: "belts",
  },
  {
    slug: "acetate-glasses",
    name: "Tortoiseshell Acetate Frames",
    cat: "Men · Accessories · Glasses",
    catLink: "Men",
    price: 12800,
    line: "Italian acetate, gold-metal hinges — the third item on the lapel, the first thing remembered.",
    sizes: ["52mm", "54mm"],
    features: [
      "Italian acetate, hand-polished",
      "Gold-metal hinges and bridge",
      "Round 52mm or 54mm lens",
      "Prescription or plano lens",
    ],
    spec: [
      ["Material","Italian acetate"], ["Hardware","Gold-tone metal hinges"],
      ["Lens shape","Round, 52/54mm"], ["Bridge","Keyhole, 22mm"],
      ["Lens","Prescription or plano"], ["Made in","Mumbai · Frames from Italy"],
    ],
    note: "Glasses change a face more than any other accessory. We carry only round and rectangular — between them, every Indian face is well-served. Bring your prescription or your eyes; we have an optician in-house.",
    fit: "Slim", fabric: "Cotton", occasion: "Casual", badge: "New",
    gender: "men", category: "accessories", sub: "glasses",
  },

  // ── Women · Corsets ──
  {
    slug: "hand-laced-corset",
    name: "Hand-laced Maroon Corset",
    cat: "Women · Corsets",
    catLink: "Women",
    price: 18500,
    line: "Boned raw silk, hand-laced, sweetheart neckline — sculpted, structured, and built to be worn outside.",
    sizes: ["XS","S","M","L","XL","XXL-oos"],
    features: [
      "Maroon raw silk, gold thread edging",
      "Hand-boned, fully steel-boned",
      "Sweetheart neckline, narrow shoulder straps",
      "Hand-laced silk ribbon at the back",
    ],
    spec: [
      ["Fabric","Raw silk, deep maroon"], ["Boning","Steel, fully hand-set"],
      ["Lining","Cotton mulmul, breathable"], ["Closure","Hand-laced silk ribbon, back"],
      ["Edging","Gold thread, hand-stitched"], ["Made in","Delhi, India"],
    ],
    note: "A corset is engineering, not fashion. We hand-bone every piece — eighteen steel bones, set to your block. Worn outside the house, paired with a long ivory skirt or wide-leg trouser, it reads as power, not lingerie.",
    fit: "Tailored", fabric: "Silk", occasion: "Black Tie", badge: null,
    gender: "women", category: "corsets", sub: "corsets",
  },

  // ── Women · Skirts ──
  {
    slug: "tailored-pencil-skirt",
    name: "Tailored Pencil Skirt",
    cat: "Women · Skirts · Pencil",
    catLink: "Women",
    price: 11400,
    line: "Charcoal wool crepe, knee-length, single rear vent — the working wardrobe's shortest sentence.",
    sizes: ["XS","S","M","L","XL","XXL"],
    features: [
      "Fine charcoal wool crepe",
      "High-waisted, hidden back zip",
      "Single rear vent",
      "Hand-finished hem",
    ],
    spec: [
      ["Cloth","Fine wool crepe"], ["Weight","220 gsm"],
      ["Length","Knee, 24 inches"], ["Closure","Hidden invisible zip, hook-and-bar"],
      ["Vent","Single rear"], ["Made in","Delhi, India"],
    ],
    note: "We block women's skirts on a different curve from European patterns — Indian frames carry more curve through the hip. The line from waist to hem is what makes a pencil skirt; we draft it three times before we cut.",
    fit: "Tailored", fabric: "Wool", occasion: "Boardroom", badge: null,
    gender: "women", category: "skirts", sub: "pencil-skirts",
  },

  // ── Women · Accessories ──
  {
    slug: "wide-calfskin-belt",
    name: "Wide Corseted Calfskin Belt",
    cat: "Women · Accessories · Belt",
    catLink: "Women",
    price: 7800,
    line: "Tan Italian calfskin, antique brass corset buckle — to cinch the trench, the silk, the linen.",
    sizes: ["XS","S","M","L"],
    features: [
      "Italian full-grain calfskin, tan",
      "Antique brass corset-style buckle",
      "2.4-inch width, dramatic proportion",
      "Hand-burnished edges",
    ],
    spec: [
      ["Leather","Italian full-grain calfskin"], ["Buckle","Antique brass, corset-style"],
      ["Width","2.4 inches (60mm)"], ["Edges","Hand-burnished"],
      ["Lining","Calfskin, full-grain"], ["Made in","Delhi, India"],
    ],
    note: "A wide belt does what a corset does at half the price and twice the versatility. Wear it over a slip dress, a kurta, a trench. It cinches and silhouettes — that's its whole job.",
    fit: "Tailored", fabric: "Cotton", occasion: "Casual", badge: "New",
    gender: "women", category: "accessories", sub: "belts",
  },

  // ── Fabrics · sold by the metre ──
  {
    slug: "fabric-italian-wool-super-120s",
    name: "Italian Wool · Super 120s",
    cat: "Fabrics · Suiting",
    catLink: "Fabrics",
    price: 3500,
    line: "Vitale Barberis Canonico, 280 gsm — the cloth our heritage three-piece is built on.",
    sizes: [], features: [], spec: [], note: "",
    fit: "—", fabric: "Wool", occasion: "—", badge: null,
    gender: "unisex", category: "fabrics",
    kind: "fabric",
    description:
      "Pure Super 120s wool, 280 gsm, woven by Vitale Barberis Canonico in Biella. Soft hand, deep drape, and enough body to hold a pressed crease through eight hours on the body. Sold by the metre, cut from a single piece. Ships unfinished from our Delhi cloth library.",
    colour: "Charcoal",
    colourHex: "#2E2A26",
    colourVariants: [
      { name: "Charcoal", hex: "#2E2A26" },
      { name: "Navy",     hex: "#1A2333" },
      { name: "Stone",    hex: "#82776A" },
      { name: "Bone",     hex: "#D8CFC2" },
    ],
    fabricMeta: {
      widthInches: 60, gsm: 280, composition: "100% Super 120s Wool",
      care: "Dry clean only · Steam between wears",
      origin: "Vitale Barberis Canonico · Biella, Italy",
      stockMeters: 42,
    },
  },
  {
    slug: "fabric-egyptian-poplin",
    name: "Egyptian Cotton Poplin",
    cat: "Fabrics · Shirting",
    catLink: "Fabrics",
    price: 1200,
    line: "Thomas Mason 100s 2-ply poplin — the shirting cloth at its purest.",
    sizes: [], features: [], spec: [], note: "",
    fit: "—", fabric: "Cotton", occasion: "—", badge: null,
    gender: "unisex", category: "fabrics",
    kind: "fabric",
    description:
      "Thomas Mason 100s two-ply Egyptian cotton, woven in Italy. A clean, dense poplin that softens after six washes and reaches its best at fifty. Recommend 2.4m for a long-sleeve shirt with single cuffs.",
    colour: "Ivory",
    colourHex: "#EFE7D7",
    fabricMeta: {
      widthInches: 58, gsm: 110, composition: "100% Egyptian Cotton, 100s 2-ply",
      care: "Machine wash cold · Iron when damp",
      origin: "Thomas Mason · Olgiate Comasco, Italy",
      stockMeters: 36,
    },
  },
  {
    slug: "fabric-raw-silk-handwoven",
    name: "Raw Silk · Hand-Woven",
    cat: "Fabrics · Festive",
    catLink: "Fabrics",
    price: 2800,
    line: "Hand-woven raw silk from Varanasi — for sherwanis, lehengas, and saree blouses.",
    sizes: [], features: [], spec: [], note: "",
    fit: "—", fabric: "Silk", occasion: "—", badge: "New",
    gender: "unisex", category: "fabrics",
    kind: "fabric",
    description:
      "Hand-woven raw silk from a single karkhana in Varanasi. Subtle slub texture across the weave, a soft natural sheen, and a weight that drapes without flattening. Three-week turnaround if dyed to a custom colour.",
    colour: "Wine",
    colourHex: "#5C1B25",
    colourVariants: [
      { name: "Wine",    hex: "#5C1B25" },
      { name: "Ivory",   hex: "#EBE2D2" },
      { name: "Emerald", hex: "#1F4938" },
    ],
    fabricMeta: {
      widthInches: 44, gsm: 95, composition: "100% Raw Silk, hand-woven",
      care: "Dry clean only · Store flat, away from light",
      origin: "Varanasi, Uttar Pradesh, India",
      stockMeters: 24,
    },
  },
  {
    slug: "fabric-heavy-linen",
    name: "Indian Linen · Heavy",
    cat: "Fabrics · Summer Suiting",
    catLink: "Fabrics",
    price: 1800,
    line: "Heavy Indian linen, 280 gsm — bandhgalas, easy trousers, weekend jackets.",
    sizes: [], features: [], spec: [], note: "",
    fit: "—", fabric: "Linen", occasion: "—", badge: null,
    gender: "unisex", category: "fabrics",
    kind: "fabric",
    description:
      "Heavy-weight Indian linen at 280 gsm — substantial enough for a structured bandhgala, soft enough for a relaxed summer trouser. Creases gracefully along the elbow and inner thigh; steam between wears.",
    colour: "Sand",
    colourHex: "#C9B79A",
    colourVariants: [
      { name: "Sand",  hex: "#C9B79A" },
      { name: "Slate", hex: "#5A6068" },
    ],
    fabricMeta: {
      widthInches: 58, gsm: 280, composition: "100% Indian Linen, heavyweight",
      care: "Hand wash cool · Steam between wears, do not iron",
      origin: "Kerala, India",
      stockMeters: 31,
    },
  },
];

export function getProduct(slug: string): Product | undefined {
  return PRODUCTS.find(p => p.slug === slug);
}
