import MadeForYou, { type MadeForYouItem } from "../../MadeForYou";

type RC = Record<string, unknown>;

// Byte-parity wrapper: renders the real "Made for you" carousel/grid.
export default function ServiceCards({
  cards,
  heading,
  meta,
}: {
  cards: RC[];
  heading?: string;
  meta?: string;
}) {
  const items: MadeForYouItem[] = (cards ?? []).map((c) => ({
    href: String(c.href ?? "/bespoke"),
    photo: String(c.photo ?? ""),
    alt: String(c.alt ?? ""),
    eyebrow: String(c.eyebrow ?? c.kicker ?? ""),
    title: String(c.title ?? ""),
    body: String(c.body ?? ""),
    cta: String(c.cta ?? ""),
  }));
  return (
    <MadeForYou
      items={items.length ? items : undefined}
      heading={heading}
      meta={meta}
    />
  );
}
