// Server component — reads homepage_blocks from the admin DB and renders the
// matching component per block, fully driving the homepage from
// /studio/homepage. Site chrome (Header/Footer) is fixed and placed here so
// the DOM/visual order matches the original hardcoded homepage exactly:
//   announce_bar block(s) → <Header/> → promo_modal block(s) →
//   remaining blocks in sort order → <Footer/>

import { listBlocks, type HomepageBlockResolved } from "../../../lib/admin/repos/homepage";
import { listFlashSales } from "../../../lib/admin/repos/flash-sales";
import { listBanners } from "../../../lib/admin/repos/banners";
import { getSiteSettings } from "../../../lib/storefront/site-settings";
import Header from "../Header";
import Footer from "../Footer";
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
import AnnounceBar from "./blocks/AnnounceBar";
import PromoModalBlock from "./blocks/PromoModalBlock";

type RC = Record<string, unknown>;

export default async function HomepageRenderer() {
  const blocks = await listBlocks({ onlyEnabled: true });
  const liveSale = (await listFlashSales({ onlyLive: true }))[0];
  const banners = await listBanners({ onlyPublished: true });
  const { brandName } = await getSiteSettings();

  const announce = blocks.filter((b) => b.type === "announce_bar");
  const promos = blocks.filter((b) => b.type === "promo_modal");
  const rest = blocks.filter(
    (b) => b.type !== "announce_bar" && b.type !== "promo_modal",
  );

  return (
    <>
      {liveSale && <FlashSaleBanner sale={liveSale} />}
      {announce.map((b) => (
        <Block key={b.id} block={b} banners={banners} />
      ))}
      <Header />
      {promos.map((b) => (
        <Block key={b.id} block={b} banners={banners} />
      ))}
      <main>
        <h1
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: "hidden",
            clip: "rect(0 0 0 0)",
            whiteSpace: "nowrap",
            border: 0,
          }}
        >
          {brandName} — Bespoke tailoring &amp; ready-to-wear
        </h1>
        {rest.map((b) => (
          <Block key={b.id} block={b} banners={banners} />
        ))}
      </main>
      <Footer />
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
    case "announce_bar":
      return <AnnounceBar cfg={cfg} />;
    case "promo_modal":
      return <PromoModalBlock cfg={cfg} />;
    case "hero_grid":
      return <HeroGridDynamic tiles={(cfg.tiles as RC[]) ?? []} />;
    case "hero_banner":
    case "full_banner":
      return <FullBanner cfg={cfg} />;
    case "banner_carousel":
      return <BannerCarousel banners={banners} autoplay={Number(cfg.autoplay_seconds ?? 6)} />;
    case "product_carousel": {
      const f = (cfg.filter as RC) ?? {};
      const cta = (cfg.cta as RC) ?? {};
      return (
        <ProductCarousel
          title={block.title}
          ctaLabel={cfg.ctaLabel ? String(cfg.ctaLabel) : (cta.label ? String(cta.label) : undefined)}
          ctaHref={String(cfg.ctaHref ?? cta.href ?? "/collection")}
          headingSide={(cfg.headingSide as "left" | "right" | undefined) ?? "left"}
          gender={f.gender ? String(f.gender) : undefined}
          category={f.category ? String(f.category) : undefined}
          limit={Number(f.limit ?? 6)}
        />
      );
    }
    case "editorial_split": {
      const f = (cfg.filter as RC) ?? {};
      return (
        <EditorialSplit
          title={String(cfg.title ?? block.title)}
          ctaLabel={String(cfg.ctaLabel ?? "")}
          ctaHref={String(cfg.ctaHref ?? "")}
          image={String(cfg.image ?? "")}
          imageAlt={String(cfg.imageAlt ?? "")}
          imageSide={(cfg.imageSide as "left" | "right" | undefined) ?? "left"}
          gender={f.gender ? String(f.gender) : undefined}
          limit={Number(f.limit ?? 6)}
        />
      );
    }
    case "service_cards":
      return (
        <ServiceCards
          cards={(cfg.items as RC[]) ?? (cfg.cards as RC[]) ?? []}
          heading={cfg.heading ? String(cfg.heading) : undefined}
          meta={cfg.meta ? String(cfg.meta) : undefined}
        />
      );
    case "process_strip":
      return <ProcessStrip cfg={cfg} />;
    case "trust_strip":
      return <TrustStrip />;
    case "wedding_editorial":
      return <WeddingEditorial cfg={cfg} />;
    case "bespoke_teaser":
      return <BespokeTeaser cfg={cfg} />;
    case "category_grid":
      return <CategoryGrid categories={(cfg.categories as Array<RC>) ?? []} />;
    case "custom_html":
      return <CustomHtml html={String(cfg.html ?? "")} />;
    default:
      return null;
  }
}
