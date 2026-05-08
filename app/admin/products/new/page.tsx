import Link from "next/link";
import PageHead from "../../components/PageHead";
import EditorsNote from "../../components/EditorsNote";
import NewProductForm from "./NewProductForm";

export const metadata = { title: "New piece · Atelier" };

export default function NewProductPage() {
  return (
    <div className="adm-page">
      <EditorsNote body="A blank entry. Fill in the fundamentals — name, slug, price — and revise the rest after the photoshoot lands." />
      <PageHead
        kicker="New entry"
        emphasis="Begin"
        title="a new piece"
        stand="The slug is the address — it cannot change once set without rewriting links."
      >
        <Link href="/admin/products" className="adm-btn adm-btn--ghost">← Back to catalogue</Link>
      </PageHead>

      <NewProductForm />
    </div>
  );
}
