import { preload } from "react-dom";
import HeroGrid, { type HeroTile } from "../../HeroGrid";

type RC = Record<string, unknown>;

// Byte-parity wrapper: renders the real <HeroGrid> (identical markup, CSS and
// carousel behaviour to the original homepage) driven by block config.
export default function HeroGridDynamic({ tiles }: { tiles: RC[] }) {
  const mapped: HeroTile[] = (tiles ?? []).map((t) => ({
    eyebrow: String(t.eyebrow ?? ""),
    title: String(t.title ?? ""),
    sub: String(t.sub ?? ""),
    cta: String(t.cta ?? ""),
    href: String(t.href ?? ""),
    img: String(t.img ?? t.image ?? ""),
    imgMobile: t.imgMobile ? String(t.imgMobile) : undefined,
    pos: String(t.pos ?? "center center"),
    veil: String(t.veil ?? "left"),
  }));
  if (!mapped.length) return null;

  // The hero is a CSS background-image, which the browser only discovers
  // after the stylesheet and layout are ready (~3 s late on a mid-range
  // phone). Preloading the first slide makes it the first image fetched,
  // and it is the page's Largest Contentful Paint. The breakpoint mirrors
  // the .hg-img--mobile rule in app/styles/home.css (max-width: 1024px).
  const first = mapped[0];
  if (first.imgMobile) {
    preload(first.imgMobile, { as: "image", fetchPriority: "high", media: "(max-width: 1024px)" });
    if (first.img) preload(first.img, { as: "image", fetchPriority: "high", media: "(min-width: 1025px)" });
  } else if (first.img) {
    preload(first.img, { as: "image", fetchPriority: "high" });
  }

  return <HeroGrid tiles={mapped} />;
}
