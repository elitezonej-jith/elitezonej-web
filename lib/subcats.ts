export type SubcatMeta = { title: string; stand: string; empty?: boolean };

export const CAT_DATA: Record<string, SubcatMeta> = {
  new:        { title: "New Arrivals", stand: "Just arrived to the atelier — the freshest tailoring, festive pieces, and accessories of the season, photographed in our workroom this month." },
  men:        { title: "Men",       stand: "Tailored pieces for the eight hours of a wedding day, the boardroom on Tuesday, and the dinner table on Saturday. Cut in our atelier in Italian wool, finished by hand." },
  women:      { title: "Women",     stand: "A capsule for the modern Indian woman — sharp tailoring, bias-cut silks, and festive lehengas, photographed in the same warm cream of our atelier. Designed with quiet confidence." },
  festive:    { title: "Festive",   stand: "For the Indian wedding season. Sherwanis, lehengas, sarees and bandhgalas — each piece either ready-to-wear or made-to-measure in seven days." },
  suits:      { title: "Suits",     stand: "Tailored two-piece, three-piece, and bandhgala suits in fine wool and linen — the foundation of the Elite Zone J wardrobe." },
  sherwani:   { title: "Sherwani",  stand: "Festive sherwanis cut for the front row at the family wedding — ivory raw silks, hand-worked zardozi, full ensembles with churidar and dupatta included." },
  shirts:     { title: "Shirts",    stand: "Italian-mill cottons, Egyptian poplin, single-needle stitching at twenty-two stitches per inch. The shirt you'll keep reaching for." },
  fabrics:    { title: "Fabrics",   stand: "Cloth from our library — Italian wools, Egyptian poplins, hand-woven Indian silks and heavy linens. Sold by the metre, cut from a single piece, ships from our atelier." },
  essentials: { title: "Essentials",stand: "The wardrobe foundations — cotton tees, fine-gauge knitwear, soft-shoulder jackets — all in the same restrained palette." },
};

export const SUBCATS: Record<string, Record<string, SubcatMeta>> = {
  men: {
    "tuxedos":         { title: "Tuxedos",        stand: "Single-button peak-lapel tuxedos in midnight black wool with hand-finished satin lapels — for the rooms that still ask." },
    "business-suits":  { title: "Business Suits", stand: "Two-piece tailored suits in Italian wool — boardroom on Tuesday, dinner on Saturday, in one well-cut piece." },
    "wedding-suits":   { title: "Wedding Suits",  stand: "Three-piece, sherwani, and bandhgala — cut for the eight hours of an Indian wedding day, in cloth heavy enough to hold the silhouette." },
    "classic-shirts":  { title: "Classic Shirts", stand: "Spread and semi-spread collars in Egyptian poplin — the foundation of the formal wardrobe." },
    "mandarin-shirts": { title: "Mandarin Collar Shirts", stand: "Grandad and Nehru collars in Egyptian cotton poplin and fine linen." },
    "pointed-shirts":  { title: "Pointed Collar Shirts",  stand: "Forward-point and cutaway collars for closer-cut tie knots and wider lapels." },
    "tapered-pants":   { title: "Tapered Fit Pants", stand: "Flat-front modern trousers cut close through the leg, finished with a clean break." },
    "bell-bottoms":    { title: "Bell Bottoms",      stand: "Mid-rise, fitted at the thigh, flared from the knee — the trouser the seventies got right." },
    "relaxed-pants":   { title: "Relaxed Fit Pants", stand: "Easy through the leg, soft pleats, the trouser to wear when you'd rather not be wearing one." },
    "pleated-pants":   { title: "Pleated Pants",     stand: "Single and double-pleat front, high-rise, sharp through the leg — Italian-cut wool." },
    "brooches":        { title: "Lapel Brooches",    stand: "Hand-finished brass and silver brooches for lapel and sherwani — small punctuation." },
    "chains":          { title: "Chains",            stand: "Pocket-watch and collar chains in oxidised silver and aged brass." },
    "rings":           { title: "Rings",             stand: "Sterling silver signet rings, hand-engraved on request — your monogram, our craftsmanship." },
    "glasses":         { title: "Glasses",           stand: "Italian acetate and titanium frames, prescription or plano — the third item on the lapel." },
    "belts":           { title: "Belts",             stand: "Italian calfskin and reversible black/brown — the only belt you'll need this year." },
  },
  women: {
    "corsets":         { title: "Corsets",         stand: "Hand-laced boned corsets in raw silk and matte satin — sculpted, structured, and built to be worn outside the house." },
    "pencil-skirts":   { title: "Pencil Skirts",   stand: "Knee-length tailored pencil skirts in fine wool and crepe — the working wardrobe's shortest sentence." },
    "a-line-skirts":   { title: "A-line Skirts",   stand: "Mid-calf pleated A-line skirts in raw silk and lightweight wool — movement without compromise." },
    "office-wear":     { title: "Office Wear",     stand: "Shirt-dresses, blazer-dresses, and suiting cut for women who run the room — clean lines, sharp shoulders, soft Indian palette." },
    "evening-gowns":   { title: "Evening Gowns",   stand: "Bias-cut silk slips, velvet blazer-dresses, and embroidered lehengas — gowns for the rooms that still light their candles." },
    "brooches":        { title: "Brooches",        stand: "Statement and minimal brooches in oxidised silver, brass, and pearl — for the lapel, the saree pleat, the kurta neckline." },
    "chains":          { title: "Chains",          stand: "Layered and dainty chains in 22k gold-plate and oxidised silver — the necklace stack you'll travel in." },
    "rings":           { title: "Rings",           stand: "Sterling silver stacking rings — alone, restrained; together, a quiet declaration." },
    "glasses":         { title: "Glasses",         stand: "Italian acetate and metal frames — prescription or plano, the modern Indian woman's third accessory." },
    "belts":           { title: "Belts",           stand: "Calfskin belts in classic and corseted widths — to cinch the trench, the silk slip, or the linen kurta." },
  },
};
