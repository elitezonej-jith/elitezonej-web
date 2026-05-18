import Link from "next/link";
import { listPromotions } from "../../../../lib/admin/repos/promotions";
import PageHead from "../../components/PageHead";
import FlashSaleForm from "../[id]/FlashSaleForm";
import { requireUser } from "../../../../lib/admin/session";

export const metadata = { title: "New flash sale · Studio" };

export default async function NewFlashSalePage() {
  await requireUser("/studio/login");
  const promos = listPromotions();
  return (
    <div className="stu-page stu-page--narrow">
      <PageHead title="New flash sale" sub="A countdown banner that appears on the storefront. Optionally tie to a code."
                back={{ href: "/studio/flash-sales", label: "Back to flash sales" }}>
        <Link href="/studio/flash-sales" className="stu-btn stu-btn--ghost">Cancel</Link>
      </PageHead>
      <FlashSaleForm promos={promos} />
    </div>
  );
}
