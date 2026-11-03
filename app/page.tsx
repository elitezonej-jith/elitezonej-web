import HomepageRenderer from "./components/storefront/HomepageRenderer";
import type { Metadata } from "next";
import "./styles/home.css";
import { WHATSAPP_DISPLAY } from "@/lib/contact";

// ISR: served from Vercel's edge cache (in India for Indian visitors)
// instead of being rendered in the US on every visit. Refreshes in the
// background at most every 60 s, and /studio saves that affect it call
// revalidatePath("/") / updateTag("homepage"), so edits show straight away.
// Nothing on this page reads cookies or headers; cart/wishlist are client-side.
// The build prerenders "/" once, so DB_DRIVER=postgres + DATABASE_URL must be
// available to the build (they are for Production; Preview lacks DB_DRIVER).
export const revalidate = 60;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  description:
    "Elite Zone J (EliteZoneJ): designer-led bespoke and ready-to-wear tailoring from India. Suits, sherwanis, blazers, lehengas, fabrics and accessories, made-to-measure in seven days.",
};

const SITE = "https://elitezonej.com";

// Structured data for Google: who the business is (logo, social profiles)
// and how to search the site (eligible for a sitelinks search box).
const LD = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Elite Zone J",
    // Spellings people search for; helps Google tie them to this brand.
    alternateName: ["EliteZoneJ", "Elite Zone J Fashion", "Zone J"],
    description:
      "Indian designer tailoring house: bespoke, made-to-measure and ready-to-wear suits, sherwanis, shirts, women's tailoring, suiting fabrics and accessories, with home fittings and delivery across India.",
    url: SITE,
    logo: `${SITE}/logo/favicon-512.png`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: WHATSAPP_DISPLAY.replace(/\s/g, ""),
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: ["en"],
    },
    sameAs: [
      "https://www.instagram.com/zone_j__/",
      "https://www.facebook.com/elitezonej",
      "https://www.youtube.com/@jithcoke28",
      "https://in.pinterest.com/jithcoke/",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Elite Zone J",
    alternateName: "EliteZoneJ",
    url: SITE,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  },
];

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(LD).replace(/</g, "\\u003c") }}
      />
      <HomepageRenderer />
    </>
  );
}
