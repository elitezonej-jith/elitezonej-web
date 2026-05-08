// Server component — reads homepage_blocks from the admin DB and renders the
// matching component per block. Drives the entire homepage from /studio/homepage.

import { listBlocks, type HomepageBlockResolved } from "../../../lib/admin/repos/homepage";
import { listProducts } from "../../../lib/storefront/products";
import { listFlashSales } from "../../../lib/admin/repos/flash-sales";
import { listBanners } from "../../../lib/admin/repos/banners";
import HeroGridDynamic from "./blocks/HeroGridDynamic";
import BannerCarousel from "./blocks/BannerCarousel";
import ProductCarousel from "./blocks/ProductCarousel";
import EditorialSplit from "./blocks/EditorialSplit";
import ServiceCards from "./blocks/ServiceCards";
import ProcessStrip from "./blocks/ProcessStrip";
import FullBanner from "./blocks/FullBanner";
import TrustStrip from "./blocks/TrustStrip";
import WeddingEditorial from "./blocks/WeddingEditorial";
import BespokeTeaser from "./blocks/BespokeTeaser";
import CategoryGrid from "./blocks/CategoryGrid";
import FlashSaleBanner from "./blocks/FlashSaleBanner";
import CustomHtml from "./blocks/CustomHtml";
import type { StorefrontProduct } from "../../../lib/storefront/products";

type RC = Record<string, unknown>;

export default function HomepageRenderer() {
  const blocks = listBlocks({ onlyEnabled: true });
  const liveSale = listFlashSales({ onlyLive: true })[0];
  const banners = listBanners({ onlyPublished: true });

  return (
    <>
      {liveSale && <FlashSaleBanner sale={liveSale} />}
      {blocks.map((b) => (
        <Block key={b.id} block={b} banners={banners} />
      ))}
    </>
  );
}

function Block({
  block, banners,
}: {
  block: HomepageBlockResolved;
  banners: Awaited<ReturnType<typeof listBanners>>;
}) {
  const cfg = block.config as RC;
  switch (block.type) {
    case "hero_grid":
      return <HeroGridDynamic tiles={(cfg.tiles as Array<RC>) ?? []} />;
    case "hero_banner":
    case "full_banner":
      return <FullBanner title={String(cfg.headline ?? "")} body={String(cfg.body ?? "")} image={String(cfg.image ?? "")} cta={cfg.cta as RC} variant={block.type} />;
    case "banner_carousel":
      return <BannerCarousel banners={banners} autoplay={Number(cfg.autoplay_seconds ?? 6)} />;
    case "product_carousel": {
      const f = (cfg.filter as RC) ?? {};
      const prods = listProducts({
        kind: (f.kind as "tailored" | "fabric" | undefined) || undefined,
        gender: (f.gender as "men" | "women" | "unisex" | undefined) || undefined,
        category: (f.category as string | undefined) || undefined,
        featured: f.featured === true,
        limit: Number(f.limit ?? 6),
      });
      return <ProductCarousel title={block.title} cta={cfg.cta as RC} products={prods as unknown as StorefrontProduct[]} />;
    }
    case "editorial_split":
      return <EditorialSplit
                image={String(cfg.image ?? "")}
                headline={String(cfg.headline ?? "")}
                body={String(cfg.body ?? "")}
                link={cfg.link as RC}
                align={(cfg.align as "left" | "right" | undefined) ?? "left"} />;
    case "service_cards":
      return <ServiceCards cards={(cfg.cards as Array<RC>) ?? []} />;
    case "process_strip":
      return <ProcessStrip steps={(cfg.steps as Array<RC>) ?? []} />;
    case "trust_strip":
      return <TrustStrip items={(cfg.items as Array<RC>) ?? []} />;
    case "wedding_editorial":
      return <WeddingEditorial image={String(cfg.image ?? "")} headline={String(cfg.headline ?? "")} body={String(cfg.body ?? "")} cta={cfg.cta as RC} />;
    case "bespoke_teaser":
      return <BespokeTeaser headline={String(cfg.headline ?? "")} body={String(cfg.body ?? "")} cta={cfg.cta as RC} />;
    case "category_grid":
      return <CategoryGrid categories={(cfg.categories as Array<RC>) ?? []} />;
    case "custom_html":
      return <CustomHtml html={String(cfg.html ?? "")} />;
    default:
      return null;
  }
}
