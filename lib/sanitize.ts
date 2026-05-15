import sanitizeHtml from "sanitize-html";

const HTML_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "strong", "em", "u", "s", "blockquote",
    "h2", "h3", "h4", "ul", "ol", "li",
    "a", "img", "figure", "figcaption", "span", "div",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    "*": ["class"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesAppliedToAttributes: ["href", "src"],
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        rel: "noopener noreferrer",
        target: attribs.target === "_blank" ? "_blank" : attribs.target ?? "",
      },
    }),
  },
};

export function sanitizeRichHtml(input: string | null | undefined): string {
  if (!input) return "";
  return sanitizeHtml(input, HTML_OPTIONS);
}

const SAFE_HREF_RE = /^(https?:\/\/|mailto:|\/(?!\/))/i;

export function safeHref(href: string | null | undefined): string | null {
  if (!href) return null;
  const trimmed = href.trim();
  if (!trimmed) return null;
  if (!SAFE_HREF_RE.test(trimmed)) return null;
  return trimmed;
}
