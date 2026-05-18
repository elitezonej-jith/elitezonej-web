import PromoModal from "../../PromoModal";

type RC = Record<string, unknown>;

// Byte-parity wrapper: renders the real promo / "15% off" modal (sticker +
// dialog) exactly as it appeared on the homepage, driven by block config.
export default function PromoModalBlock({ cfg }: { cfg: RC }) {
  const countries = Array.isArray(cfg.countries)
    ? (cfg.countries as unknown[]).map(String)
    : undefined;
  return (
    <PromoModal
      stickerLabel={cfg.stickerLabel ? String(cfg.stickerLabel) : undefined}
      heading={cfg.heading ? String(cfg.heading) : undefined}
      deck={cfg.deck ? String(cfg.deck) : undefined}
      submitLabel={cfg.submitLabel ? String(cfg.submitLabel) : undefined}
      finePrint={cfg.finePrint ? String(cfg.finePrint) : undefined}
      successHeading={cfg.successHeading ? String(cfg.successHeading) : undefined}
      successBody={cfg.successBody ? String(cfg.successBody) : undefined}
      countries={countries}
    />
  );
}
