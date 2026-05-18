import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getInventory } from "../../../../lib/admin/repos/products";
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
  const product = getProduct(slug);
  if (!product) notFound();
  const inventory = getInventory(slug);

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
