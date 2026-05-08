import Link from "next/link";
import PageHead from "../../components/PageHead";
import EditorsNote from "../../components/EditorsNote";
import PromoForm from "../PromoForm";

export const metadata = { title: "New promotion · Atelier" };

export default function NewPromotionPage() {
  return (
    <div className="adm-page">
      <EditorsNote body="Discount codes are uppercased at save. Use a memorable code — the bespoke desk reads it aloud over the phone." />
      <PageHead kicker="New promotion" emphasis="Inscribe" title="a new promotion">
        <Link href="/admin/promotions" className="adm-btn adm-btn--ghost">← Back</Link>
      </PageHead>
      <PromoForm />
    </div>
  );
}
