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
    pos: String(t.pos ?? "center center"),
    veil: String(t.veil ?? "left"),
  }));
  if (!mapped.length) return null;
  return <HeroGrid tiles={mapped} />;
}
