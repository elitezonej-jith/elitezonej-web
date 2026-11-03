import "server-only";
import { getBespokeContent } from "./bespoke-content";
import { getStorefrontNav } from "./nav";
import { listProductsForPage } from "./catalogue";
import { FREE_SHIP_OVER } from "./checkout";
import { WHATSAPP_DISPLAY, WHATSAPP_LINK } from "../contact";

// Plain-text summaries for AI assistants and AI search (ChatGPT, Perplexity,
// Claude, Gemini / AI Overviews), served at /llms.txt and /llms-full.txt
// (https://llmstxt.org). Built only from live site data (Studio content,
// menu, catalogue, checkout config) so AI tools quote current, accurate facts.

export const SITE = "https://elitezonej.com";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export async function buildLlmsTxt(): Promise<string> {
  const [bespoke, nav] = await Promise.all([getBespokeContent(), getStorefrontNav()]);
  const lead = `${bespoke.hero.lead_time_days} days`;
  const fill = (s: string) => s.replaceAll("{leadTime}", lead);

  const services = bespoke.services
    .map((s) => `- **${s.title}** (${fill(s.price)}): ${s.features.map(fill).join("; ")}`)
    .join("\n");
  const steps = bespoke.process_steps
    .map((p, i) => `${i + 1}. ${fill(p.title)}: ${p.description}`)
    .join("\n");

  const categories = nav
    .filter((c) => c.href.startsWith("/collection"))
    .map((c) => {
      const subs = (c.groups ?? []).flatMap((g) => g.items).filter((it) => it.href.includes("sub="));
      const subList = subs.length ? `: ${subs.map((it) => `[${it.label}](${SITE}${it.href})`).join(", ")}` : "";
      return `- [${c.label}](${SITE}${c.href})${subList}`;
    })
    .join("\n");

  const shipping = FREE_SHIP_OVER > 0
    ? `Free delivery across India on orders over ${inr(FREE_SHIP_OVER)}.`
    : "Delivery across India.";

  return `# Elite Zone J (EliteZoneJ)

> Elite Zone J is a designer tailoring house in Injambakkam, Chennai (Tamil Nadu, India), selling bespoke, made-to-measure and ready-to-wear clothing for men and women: suits, tuxedos, wedding suits, sherwanis, shirts, trousers, women's tailoring and evening wear, plus suiting fabrics by the metre and accessories (brooches, lapel pins, buttons, ties, chains, rings, glasses, belts). Online store: ${SITE}. Prices in Indian rupees (INR).

Also written as: EliteZoneJ, Elite Zone J Fashion, Zone J. Not affiliated with other shops named "Elite Zone".

## Bespoke and made-to-measure services

${services}

${fill(bespoke.hero.subtitle)}

How it works:
${steps}

## Shop by category

${categories}
- [Bespoke & made-to-measure](${SITE}/bespoke)
- [Premium collection](${SITE}/premium)
- [Size guide](${SITE}/size-guide)

## Ordering and contact

- Based in Injambakkam, Chennai, Tamil Nadu. Fittings by appointment or at your address; delivery across India.
- ${shipping}
- WhatsApp: ${WHATSAPP_DISPLAY} (${WHATSAPP_LINK})
- Instagram: https://www.instagram.com/zone_j__/
- Facebook: https://www.facebook.com/elitezonej

## More

- [Full product catalogue with prices](${SITE}/llms-full.txt)
- [Sitemap](${SITE}/sitemap.xml)
`;
}

export async function buildLlmsFullTxt(): Promise<string> {
  const products = await listProductsForPage();
  const groups = new Map<string, typeof products>();
  for (const p of products) {
    const key = p.catLink ?? "Other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }
  const sections = [...groups.entries()]
    .map(([cat, items]) => {
      const lines = items
        .map((p) => {
          const price = p.salePrice ? `${inr(p.salePrice)} (sale; was ${inr(p.price)})` : inr(p.price);
          const desc = (p.line ?? "").replace(/\s+/g, " ").trim();
          return `- [${p.name}](${SITE}/products/${p.slug}): ${price}${desc ? `. ${desc}` : ""}`;
        })
        .join("\n");
      return `## ${cat} (${items.length})\n\n${lines}`;
    })
    .join("\n\n");

  return `${await buildLlmsTxt()}
# Full catalogue

${products.length} products. Prices in INR, current as of ${new Date().toISOString().slice(0, 10)}.

${sections}
`;
}
