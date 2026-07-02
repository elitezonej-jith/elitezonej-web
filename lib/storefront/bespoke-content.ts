import "server-only";
import { unstable_cache } from "next/cache";
import { getSetting } from "../admin/repos/settings";
import { CACHE_TAGS } from "./cache";

// ─── Types ─────────────────────────────────────────────────────────
export type BespokeService = {
  id: string;
  category: string;
  title: string;
  price: string;
  features: string[];
  cta_text: string;
  image_path: string;
};

export type ProcessStep = {
  id: string;
  title: string;
  description: string;
  image_path: string;
};

export type Testimonial = {
  id: string;
  quote: string;
  author: string;
  title: string;
};

export type BespokeContent = {
  hero: {
    eyebrow: string;
    headline: string;
    subtitle: string;
    lead_time_days: number;
    image_path: string;
  };
  services: BespokeService[];
  process_steps: ProcessStep[];
  testimonials: Testimonial[];
  booking_services: string[];
};

// ─── Default content (matches current hardcoded page) ──────────────
const DEFAULT_CONTENT: BespokeContent = {
  hero: {
    eyebrow: "Bespoke · Made-to-Measure · Alterations",
    headline: "A suit cut to your figure.\nDelivered in {leadTime}.",
    subtitle: "Twelve in-house designers and twenty-six master tailors. Visit us by appointment, or book a home fitting at your address.",
    lead_time_days: 14,
    image_path: "/generated/_sections/service-bespoke.webp",
  },
  services: [
    {
      id: "svc-1",
      category: "Bespoke",
      title: "The Bespoke Suit",
      price: "From ₹45,000 · 4 to 6 weeks",
      features: [
        "Drafted to a paper pattern unique to your figure",
        "Three fittings — basted, forward, finish",
        "Hand-padded canvas, hand-stitched buttonholes",
        "Lifetime mending",
      ],
      cta_text: "Begin your suit",
      image_path: "/generated/_sections/service-bespoke.webp",
    },
    {
      id: "svc-2",
      category: "Made-to-Measure",
      title: "Custom Sherwani",
      price: "From ₹28,000 · {leadTime}",
      features: [
        "Built on our base block, adjusted to your fourteen measurements",
        "Choose cloth, lining, collar, length, and embroidery",
        "One fitting included",
        "Festive-ready in {leadTime}",
      ],
      cta_text: "Configure yours",
      image_path: "/generated/_sections/service-sherwani.webp",
    },
    {
      id: "svc-3",
      category: "Alterations",
      title: "Alterations & Fit Correction",
      price: "From ₹3,500 · 5 to 7 days",
      features: [
        "Bring in a piece you love; we'll re-cut it to fit",
        "Trousers, jackets, shirts, sherwanis",
        "Free for any Elite Zone J piece in its first year",
        "Pickup & return across India",
      ],
      cta_text: "Book alterations",
      image_path: "/generated/_sections/service-shirts.webp",
    },
  ],
  process_steps: [
    { id: "step-1", title: "Choose your cloth", description: "Browse our cloth library — wools from Vitale Barberis Canonico and Reda 1865, Egyptian poplins from Thomas Mason, handwoven Indian silks. Order swatches free of charge.", image_path: "/generated/_sections/process-cloth.webp" },
    { id: "step-2", title: "Get measured", description: "Book a home fitting at your address. Fourteen measurements, taken by our master tailors. Forty minutes, complimentary refreshment.", image_path: "/generated/_sections/service-bespoke.webp" },
    { id: "step-3", title: "We cut and stitch", description: "Cut by hand from your paper pattern, basted for the first fitting, then constructed with hand-padded canvas and hand-stitched lapels.", image_path: "/generated/_sections/process-measure.webp" },
    { id: "step-4", title: "Receive in {leadTime}", description: "Delivered free across India in a hand-stitched garment bag. Lifetime mending.", image_path: "/generated/_sections/process-finish.webp" },
  ],
  testimonials: [
    { id: "q-1", quote: "I've worn one of Aman's three-piece suits for every wedding I've attended in the last four years. They've taken it in twice for free and it still drapes like the day I bought it.", author: "Rohan Mehra", title: "Investment Manager" },
    { id: "q-2", quote: "The home fitting was the deciding factor. The tailor came to my apartment, took fourteen measurements, asked questions a Savile Row cutter would ask. The sherwani arrived right on schedule.", author: "Arjun Shah", title: "Architect" },
  ],
  booking_services: [
    "Bespoke Suit",
    "Custom Sherwani",
    "Tailored Shirts",
    "Alterations",
    "Just exploring",
  ],
};

// ─── Reader (cached, invalidated by bustSettings) ──────────────────
async function _getBespokeContent(): Promise<BespokeContent> {
  try {
    const raw = await getSetting("bespoke_content");
    if (!raw) return DEFAULT_CONTENT;
    const parsed = JSON.parse(raw);
    // Merge with defaults for any missing fields (forward compat)
    return {
      hero: { ...DEFAULT_CONTENT.hero, ...parsed.hero },
      services: Array.isArray(parsed.services) && parsed.services.length > 0 ? parsed.services : DEFAULT_CONTENT.services,
      process_steps: Array.isArray(parsed.process_steps) && parsed.process_steps.length > 0 ? parsed.process_steps : DEFAULT_CONTENT.process_steps,
      testimonials: Array.isArray(parsed.testimonials) ? parsed.testimonials : DEFAULT_CONTENT.testimonials,
      booking_services: Array.isArray(parsed.booking_services) && parsed.booking_services.length > 0 ? parsed.booking_services : DEFAULT_CONTENT.booking_services,
    };
  } catch {
    return DEFAULT_CONTENT;
  }
}

export const getBespokeContent = unstable_cache(
  _getBespokeContent,
  ["bespoke-content"],
  { revalidate: 3600, tags: [CACHE_TAGS.settings] },
);

export { DEFAULT_CONTENT };
