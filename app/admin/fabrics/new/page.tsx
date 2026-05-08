import Link from "next/link";
import PageHead from "../../components/PageHead";
import EditorsNote from "../../components/EditorsNote";
import NewProductForm from "../../products/new/NewProductForm";

export const metadata = { title: "New cloth · Atelier" };

export default function NewFabricPage() {
  return (
    <div className="adm-page">
      <EditorsNote body="A new cloth begins as a draft entry. Add weight, mill, and at least one colourway from the editor once saved." />
      <PageHead kicker="New cloth" emphasis="Begin" title="a new cloth"
        stand="Set kind to Fabric — the editor will then reveal the meta and colourway sections.">
        <Link href="/admin/fabrics" className="adm-btn adm-btn--ghost">← Back to library</Link>
      </PageHead>
      <NewProductForm />
    </div>
  );
}
