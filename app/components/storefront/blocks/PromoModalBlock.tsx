import PromoModal from "../../PromoModal";

type RC = Record<string, unknown>;

// Renders the 15% first-order promo sticker + modal, driven by block config.
export default function PromoModalBlock({ cfg }: { cfg: RC }) {
  return (
    <PromoModal
      stickerLabel={cfg.stickerLabel ? String(cfg.stickerLabel) : undefined}
      heading={cfg.heading ? String(cfg.heading) : undefined}
      ctaLabel={cfg.ctaLabel ? String(cfg.ctaLabel) : undefined}
      ctaHref={cfg.ctaHref ? String(cfg.ctaHref) : undefined}
    />
  );
}
