import Link from "next/link";
import { sql } from "../../../lib/admin/db";
import PageHead from "../components/PageHead";
import StatusTag from "../components/StatusTag";
import EmptyState from "../components/EmptyState";
import { FlashToast } from "../components/Toast";
import { IconFolder, IconPlus, IconEdit } from "../components/Icons";
import { requireUser } from "../../../lib/admin/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Categories · Studio" };

type SP = { searchParams: Promise<{ flash?: string }> };

type Cat = {
  id: number; parent_id: number | null; name: string; slug: string;
  gender: string | null; kind: string | null; sort_order: number;
  image_path: string; enabled: number;
};

export default async function CategoriesPage({ searchParams }: SP) {
  await requireUser("/studio/login");
  const sp = await searchParams;
  const all = await sql.all<Cat>("SELECT * FROM categories ORDER BY parent_id IS NULL DESC, parent_id ASC, sort_order ASC");
  const tops = all.filter((c) => c.parent_id === null);
  const subs = all.filter((c) => c.parent_id !== null);

  return (
    <div className="stu-page">
      <FlashToast flash={sp.flash} />
      <PageHead title="Categories"
                sub="The taxonomy customers browse by. Top-level entries appear in the main nav.">
        <Link href="/studio/categories/new" className="stu-btn stu-btn--primary">
          <IconPlus width={16} height={16}/> New category
        </Link>
      </PageHead>

      {all.length === 0 ? (
        <EmptyState icon={<IconFolder />} title="No categories yet" body="Create your first category to start organizing the storefront." />
      ) : (
        <div className="stu-stack">
          <section className="stu-card">
            <header className="stu-card__head"><h3>Top-level categories</h3></header>
            <div className="stu-card__body--flush">
              <div className="stu-tbl-wrap">
                <table className="stu-tbl">
                  <thead><tr><th>Name</th><th>Handle</th><th>Sub-entries</th><th>State</th><th></th></tr></thead>
                  <tbody>
                    {tops.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <Link href={`/studio/categories/${c.id}`} className="stu-tbl__name">{c.name}</Link>
                        </td>
                        <td className="stu-tbl__sub" style={{ fontFamily: "ui-monospace, monospace" }}>{c.slug}</td>
                        <td>{subs.filter((s) => s.parent_id === c.id).length}</td>
                        <td><StatusTag status={c.enabled ? "active" : "disabled"} /></td>
                        <td><Link className="stu-btn stu-btn--ghost stu-btn--sm" href={`/studio/categories/${c.id}`}><IconEdit width={14} height={14}/> Edit</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {subs.length > 0 && (
            <section className="stu-card">
              <header className="stu-card__head"><h3>Sub-categories</h3></header>
              <div className="stu-card__body--flush">
                <div className="stu-tbl-wrap">
                  <table className="stu-tbl">
                    <thead><tr><th>Name</th><th>Handle</th><th>Parent</th><th>State</th><th></th></tr></thead>
                    <tbody>
                      {subs.map((c) => {
                        const parent = tops.find((t) => t.id === c.parent_id);
                        return (
                          <tr key={c.id}>
                            <td><Link href={`/studio/categories/${c.id}`} className="stu-tbl__name">{c.name}</Link></td>
                            <td className="stu-tbl__sub" style={{ fontFamily: "ui-monospace, monospace" }}>{c.slug}</td>
                            <td>{parent?.name ?? "—"}</td>
                            <td><StatusTag status={c.enabled ? "active" : "disabled"} /></td>
                            <td><Link className="stu-btn stu-btn--ghost stu-btn--sm" href={`/studio/categories/${c.id}`}><IconEdit width={14} height={14}/> Edit</Link></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
