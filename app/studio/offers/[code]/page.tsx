import { notFound } from "next/navigation";
import Link from "next/link";
import { getPromotion } from "../../../../lib/admin/repos/promotions";
import { listTargets } from "../../../../lib/admin/repos/offer-targets";
import { listProducts } from "../../../../lib/admin/repos/products";
import { sql } from "../../../../lib/admin/db";
import PageHead from "../../components/PageHead";
import StatusTag from "../../components/StatusTag";
import { FlashToast } from "../../components/Toast";
import OfferForm from "./OfferForm";
import OfferDangerZone from "./OfferDangerZone";
import { requireUser } from "../../../../lib/admin/session";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ code: string }>; searchParams: Promise<{ saved?: string }> };

export default async function EditOfferPage({ params, searchParams }: Params) {
  await requireUser("/studio/login");
  const { code } = await params;
  const { saved } = await searchParams;
  const promo = await getPromotion(code.toUpperCase());
  if (!promo) notFound();
  const targets = await listTargets(promo.code);
  const products = await listProducts({ status: "all", limit: 200 });
  const cats = await sql.all<{ id: number; name: string; slug: string; parent_id: number | null }>("SELECT id, name, slug, parent_id FROM categories ORDER BY name ASC");
  const featuredRow = await sql.get<{ is_featured: number }>("SELECT is_featured FROM promotions WHERE code = ?", [promo.code]);

  return (
    <div className="stu-page">
      <FlashToast flash={saved ? "Offer saved" : undefined} />
      <PageHead title={promo.code} sub={promo.description ?? undefined}
                back={{ href: "/studio/offers", label: "Back to offers" }}>
        <StatusTag status={promo.status} />
        <Link href="/studio/offers" className="stu-btn stu-btn--ghost">Done</Link>
      </PageHead>
      <OfferForm promo={promo} targets={targets} products={products} categories={cats} isFeatured={featuredRow?.is_featured === 1} />
      <div style={{ height: 32 }} />
      <OfferDangerZone code={promo.code} />
    </div>
  );
}
