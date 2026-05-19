import { notFound } from "next/navigation";
import Link from "next/link";
import { getFlashSale } from "../../../../lib/admin/repos/flash-sales";
import { listPromotions } from "../../../../lib/admin/repos/promotions";
import PageHead from "../../components/PageHead";
import StatusTag from "../../components/StatusTag";
import { FlashToast } from "../../components/Toast";
import FlashSaleForm from "./FlashSaleForm";
import FlashDangerZone from "./FlashDangerZone";
import { requireUser } from "../../../../lib/admin/session";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> };

export default async function EditFlashSalePage({ params, searchParams }: Params) {
  await requireUser("/studio/login");
  const { id } = await params;
  const { saved } = await searchParams;
  const sale = await getFlashSale(Number(id));
  if (!sale) notFound();
  const promos = await listPromotions();
  return (
    <div className="stu-page stu-page--narrow">
      <FlashToast flash={saved ? "Flash sale saved" : undefined} />
      <PageHead title={sale.title} back={{ href: "/studio/flash-sales", label: "Back" }}>
        <StatusTag status={sale.enabled ? "active" : "disabled"} />
        <Link href="/studio/flash-sales" className="stu-btn stu-btn--ghost">Done</Link>
      </PageHead>
      <FlashSaleForm sale={sale} promos={promos} />
      <div style={{ height: 32 }} />
      <FlashDangerZone id={sale.id} />
    </div>
  );
}
