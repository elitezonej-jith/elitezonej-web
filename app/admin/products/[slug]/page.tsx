import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getProduct, getInventory } from "../../../../lib/admin/repos/products";
import { listImages, fallbackImages } from "../../../../lib/admin/repos/product-images";
import PageHead from "../../components/PageHead";
import EditorsNote from "../../components/EditorsNote";
import StatusPill from "../../components/StatusPill";
import SectionRule from "../../components/SectionRule";
import ProductEditor from "./ProductEditor";
import InventoryEditor from "./InventoryEditor";
import DangerZone from "./DangerZone";
import { dateShort, rupees } from "../../../../lib/admin/format";
import { requireUser } from "../../../../lib/admin/session";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }>, searchParams: Promise<{ saved?: string }> };

export default async function ProductEditorPage({ params, searchParams }: Params) {
  await requireUser();
  const { slug } = await params;
  const { saved } = await searchParams;
  const product = await getProduct(slug);
  if (!product) notFound();
  const inventory = await getInventory(slug);
  const dbImages = await listImages(slug);
  const photos = dbImages.length
    ? dbImages.map((i) => ({ src: i.image_path, alt: i.alt }))
    : fallbackImages(slug).map((src) => ({ src, alt: "" }));

  return (
    <div className="adm-page">
      <EditorsNote
        body={`Last revised ${dateShort(product.updated_at)}. ${
          product.kind === "fabric"
            ? "Fabric entry — colourways and meta sit on the fabric editor."
            : "Tailored piece — sizes are tracked in stock units."
        }`}
      />

      <PageHead
        kicker={`Slug · ${product.slug}`}
        emphasis={product.name.split(" ").slice(0, 2).join(" ")}
        title={product.name.split(" ").slice(2).join(" ") || product.cat}
        stand={product.line}
      >
        <Link href="/admin/products" className="adm-btn adm-btn--ghost">← All pieces</Link>
        <StatusPill status={product.status} />
        <span className="adm-mono" style={{ marginLeft: 4 }}>{rupees(product.sale_price ?? product.price)}</span>
      </PageHead>

      {saved && <p className="adm-form__ok">Stitched. The piece is saved.</p>}

      <SectionRule kicker="Photos" title="Imagery">
        <Link href={`/studio/products/${slug}`} className="adm-btn adm-btn--sm adm-btn--ghost">
          Manage in Studio →
        </Link>
      </SectionRule>
      <div className="adm-panel">
        {photos.length === 0 ? (
          <p className="adm-italic" style={{ margin: 0, color: "var(--adm-text-3)" }}>
            No photos attached. Upload via Studio.
          </p>
        ) : (
          <>
            <p className="adm-italic" style={{ margin: "0 0 12px", color: "var(--adm-text-3)" }}>
              Photos are managed in Studio — this is a read-only preview ({photos.length} image{photos.length === 1 ? "" : "s"}).
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12 }}>
              {photos.map((p, i) => (
                <div key={`${p.src}-${i}`} style={{ position: "relative", aspectRatio: "3/4", background: "var(--adm-paper-2)", border: "1px solid var(--adm-border)" }}>
                  <Image src={p.src} alt={p.alt} fill sizes="120px" style={{ objectFit: "cover" }} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <SectionRule kicker="Form" title="Details & specifications" />
      <ProductEditor product={product} />

      {product.kind === "tailored" && (
        <>
          <SectionRule kicker="Stock" title="Sizes & inventory">
            <Link href="/admin/inventory" className="adm-btn adm-btn--sm adm-btn--ghost">Stock matrix →</Link>
          </SectionRule>
          <InventoryEditor slug={slug} rows={inventory} />
        </>
      )}

      <SectionRule kicker="Danger" title="Archive or remove" />
      <DangerZone slug={slug} status={product.status} name={product.name} />
    </div>
  );
}
