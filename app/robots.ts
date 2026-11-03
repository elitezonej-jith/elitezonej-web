import type { MetadataRoute } from "next";

// Keep in sync with metadataBase in app/layout.tsx. Overridable per-env.
const BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://elitezonej.com"
).replace(/\/$/, "");

// Operator surfaces + customer-private + API: never crawl. /api/img is the
// exception: it serves the product photos shown on every page, so Google
// Images and AI crawlers must be able to fetch it (longest match wins).
const DISALLOW = ["/admin", "/studio", "/account", "/checkout", "/api"];
const ALLOW = ["/", "/api/img", "/llms.txt", "/llms-full.txt"];

// AI search and assistant crawlers, named explicitly so the intent is clear:
// we want to be found and cited by ChatGPT, Perplexity, Claude, Gemini /
// Google AI Overviews, Copilot and Apple Intelligence. (Without a named group
// they would fall back to "*", which allows the same paths.)
const AI_CRAWLERS = [
  "OAI-SearchBot", "ChatGPT-User", "GPTBot",          // OpenAI
  "PerplexityBot", "Perplexity-User",                // Perplexity
  "ClaudeBot", "Claude-User", "Claude-SearchBot",    // Anthropic
  "Google-Extended",                                 // Gemini / AI Overviews
  "Applebot", "Applebot-Extended",                   // Apple
  "Bingbot",                                         // Bing / Copilot (ChatGPT search uses Bing's index)
  "DuckAssistBot", "Meta-ExternalAgent", "Amazonbot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: ALLOW, disallow: DISALLOW },
      { userAgent: AI_CRAWLERS, allow: ALLOW, disallow: DISALLOW },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
