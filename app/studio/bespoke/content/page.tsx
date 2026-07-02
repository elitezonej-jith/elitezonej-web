import { requireUser } from "../../../../lib/admin/session";
import { getBespokeContent } from "../../../../lib/storefront/bespoke-content";
import PageHead from "../../components/PageHead";
import BespokeContentEditor from "./BespokeContentEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bespoke Page Content · Studio" };

export default async function BespokeContentPage() {
  await requireUser("/studio/login");
  const content = await getBespokeContent();

  return (
    <div className="stu-page">
      <PageHead
        title="Bespoke page content"
        sub="Edit the public /bespoke page — services, process, testimonials, and booking options"
        back={{ href: "/studio/bespoke", label: "Back to leads" }}
      />
      <BespokeContentEditor initial={content} />
    </div>
  );
}
