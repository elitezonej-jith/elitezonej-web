import { notFound } from "next/navigation";
import Link from "next/link";
import { getBlock } from "../../../../lib/admin/repos/homepage";
import { listProducts } from "../../../../lib/admin/repos/products";
import { listImagesForSlugs, thumbnailFromImages } from "../../../../lib/admin/repos/product-images";
import PageHead from "../../components/PageHead";
import StatusTag from "../../components/StatusTag";
import { FlashToast } from "../../components/Toast";
import BlockEditor from "./BlockEditor";
import BlockDangerZone from "./BlockDangerZone";
import { requireUser } from "../../../../lib/admin/session";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> };

async function getSlimProducts() {
  const all = await listProducts({ status: "active", limit: 500 });
  const slugs = all.map((p) => p.slug);
  const [imageMap, metaMap] = await Promise.all([
    listImagesForSlugs(slugs),
    (async () => {
      const { getMetaForSlugs } = await import("../../../../lib/admin/repos/product-meta");
      return getMetaForSlugs(slugs);
    })(),
  ]);
  return all.map((p) => ({
    slug: p.slug,
    name: p.name,
    thumbnail: thumbnailFromImages(imageMap.get(p.slug) ?? []),
    gender: p.gender,
    category: p.category,
    isPremium: (metaMap.get(p.slug)?.is_premium ?? 0) === 1,
  }));
}

export default async function EditBlockPage({ params, searchParams }: Params) {
  await requireUser("/studio/login");
  const { id } = await params;
  const { saved } = await searchParams;
  const block = await getBlock(Number(id));
  if (!block) notFound();

  // Only fetch products for block types that use the picker
  const needsProducts = block.type === "product_carousel" || block.type === "editorial_split";
  const products = needsProducts ? await getSlimProducts() : undefined;

  return (
    <div className="stu-page">
      <FlashToast flash={saved ? "Section saved" : undefined} />
      <PageHead title={block.title || block.type} sub={`Type: ${block.type}`}
                back={{ href: "/studio/homepage", label: "Back to homepage" }}>
        <StatusTag status={block.enabled ? "published" : "disabled"} />
        <Link href="/studio/homepage" className="stu-btn stu-btn--ghost">Done</Link>
      </PageHead>
      <BlockEditor block={block} products={products} />
      <div style={{ height: 32 }} />
      <BlockDangerZone id={block.id} />
    </div>
  );
}
