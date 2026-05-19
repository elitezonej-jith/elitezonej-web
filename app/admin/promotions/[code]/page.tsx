import Link from "next/link";
import { notFound } from "next/navigation";
import { getPromotion } from "../../../../lib/admin/repos/promotions";
import PageHead from "../../components/PageHead";
import EditorsNote from "../../components/EditorsNote";
import SectionRule from "../../components/SectionRule";
import StatusPill from "../../components/StatusPill";
import PromoForm from "../PromoForm";
import PromoDelete from "./PromoDelete";
import { requireUser } from "../../../../lib/admin/session";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ code: string }>; searchParams: Promise<{ saved?: string }> };

export default async function PromoEditorPage({ params, searchParams }: Params) {
  await requireUser();
  const { code } = await params;
  const { saved } = await searchParams;
  const promo = await getPromotion(code.toUpperCase());
  if (!promo) notFound();

  return (
    <div className="adm-page">
      <EditorsNote body={`Code ${promo.code} has been redeemed ${promo.usage_count} time${promo.usage_count === 1 ? "" : "s"}.`} />
      <PageHead
        kicker={`Code · ${promo.code}`}
        emphasis="Promotion"
        title={promo.description ?? promo.code}
      >
        <Link href="/admin/promotions" className="adm-btn adm-btn--ghost">← All</Link>
        <StatusPill status={promo.status} />
      </PageHead>

      {saved && <p className="adm-form__ok">Stitched. The promotion is saved.</p>}

      <SectionRule kicker="Form" title="Code & rules" />
      <PromoForm initial={promo} />

      <SectionRule kicker="Danger" title="Remove from ledger" />
      <PromoDelete code={promo.code} />
    </div>
  );
}
