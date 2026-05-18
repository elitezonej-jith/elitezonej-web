import { listHomeSections } from "../../../lib/admin/repos/content";
import PageHead from "../components/PageHead";
import EditorsNote from "../components/EditorsNote";
import SectionRule from "../components/SectionRule";
import HomeSectionForm from "./HomeSectionForm";
import { requireUser } from "../../../lib/admin/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Content · Atelier" };

const GROUPS: Array<{ kicker: string; title: string; prefixes: string[] }> = [
  { kicker: "Surface", title: "Hero tiles",         prefixes: ["hero-"] },
  { kicker: "Surface", title: "Editorial splits",   prefixes: ["editorial-"] },
  { kicker: "Surface", title: "Process strip",      prefixes: ["process-"] },
  { kicker: "Surface", title: "Service cards",      prefixes: ["service-"] },
  { kicker: "Surface", title: "Banners",            prefixes: ["banner-"] },
];

export default async function ContentPage() {
  await requireUser();
  const all = listHomeSections();

  return (
    <div className="adm-page">
      <EditorsNote body={`The homepage is built from ${all.length} editable surfaces. Each saves independently.`} />
      <PageHead
        kicker="Workbook · 08"
        emphasis="The storefront,"
        title="surface by surface"
        stand="Hero tiles, editorial splits, process strip, service cards, banners — each is one record. Disable to remove from the page; revise to refine."
      />

      {GROUPS.map((g) => {
        const items = all.filter((s) => g.prefixes.some((p) => s.key.startsWith(p)));
        if (!items.length) return null;
        return (
          <div key={g.title}>
            <SectionRule kicker={g.kicker} title={g.title} />
            <div className="adm-stack">
              {items.map((s) => <HomeSectionForm key={s.key} section={s} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
