import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct } from "../../../../lib/admin/repos/products";
import { getFabricMeta, listFabricColours } from "../../../../lib/admin/repos/fabrics";
import PageHead from "../../components/PageHead";
import EditorsNote from "../../components/EditorsNote";
import StatusPill from "../../components/StatusPill";
import SectionRule from "../../components/SectionRule";
import ProductEditor from "../../products/[slug]/ProductEditor";
import DangerZone from "../../products/[slug]/DangerZone";
import FabricMetaForm from "./FabricMetaForm";
import ColourwayMatrix from "./ColourwayMatrix";
import { dateShort, rupees } from "../../../../lib/admin/format";
import { requireUser } from "../../../../lib/admin/session";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }>; searchParams: Promise<{ saved?: string }> };

export default async function FabricEditorPage({ params, searchParams }: Params) {
  await requireUser();
  const { slug } = await params;
  const { saved } = await searchParams;
  const product = await getProduct(slug);
  if (!product || product.kind !== "fabric") notFound();
  const meta = await getFabricMeta(slug);
  const colours = await listFabricColours(slug);

  return (
    <div className="adm-page">
      <EditorsNote body={`Last revised ${dateShort(product.updated_at)}. Sold by the metre — colourway changes ripple to the storefront.`} />

      <PageHead
        kicker={`Slug · ${product.slug}`}
        emphasis="Cloth ·"
        title={product.name}
        stand={product.line}
      >
        <Link href="/admin/fabrics" className="adm-btn adm-btn--ghost">← All cloths</Link>
        <StatusPill status={product.status} />
        <span className="adm-mono" style={{ marginLeft: 4 }}>{rupees(product.price)} / m</span>
      </PageHead>

      {saved && <p className="adm-form__ok">Stitched. The cloth is saved.</p>}

      <SectionRule kicker="Form" title="Cloth details" />
      <ProductEditor product={product} />

      <SectionRule kicker="Meta" title="Weight, mill, care" />
      <FabricMetaForm slug={slug} meta={meta} />

      <SectionRule kicker="Library" title="Colourways">
        <span className="adm-italic">Each colourway is one folder under /public/generated/{slug}/.</span>
      </SectionRule>
      <ColourwayMatrix slug={slug} colours={colours} />

      <SectionRule kicker="Danger" title="Archive or remove" />
      <DangerZone slug={slug} status={product.status} name={product.name} />
    </div>
  );
}
