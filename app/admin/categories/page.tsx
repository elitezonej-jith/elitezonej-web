import { listCategories } from "../../../lib/admin/repos/categories";
import PageHead from "../components/PageHead";
import EditorsNote from "../components/EditorsNote";
import SectionRule from "../components/SectionRule";
import EmptyState from "../components/EmptyState";
import CategoryEditor from "./CategoryEditor";
import NewCategoryForm from "./NewCategoryForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Categories · Atelier" };

export default function CategoriesPage() {
  const cats = listCategories();
  const tops = cats.filter((c) => c.parent_id === null);
  const subs = cats.filter((c) => c.parent_id !== null);

  return (
    <div className="adm-page">
      <EditorsNote body={`The category tree shapes the storefront filters: ${tops.length} top-level, ${subs.length} sub-entries.`} />
      <PageHead
        kicker="Workbook · 09"
        emphasis="Categories"
        title="& filters"
        stand="The taxonomy that customers browse by. Top-level entries appear in the main nav; sub-entries refine collections."
      />

      <SectionRule kicker="Add" title="Inscribe a new entry" />
      <NewCategoryForm tops={tops} />

      <SectionRule kicker="Top-level" title="Main categories" />
      <div className="adm-panel adm-panel--ledger">
        {tops.length === 0 ? (
          <div style={{ padding: 24 }}><EmptyState body="No categories yet." /></div>
        ) : (
          <div className="adm-tbl-wrap">
            <table className="adm-tbl">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th className="adm-tbl__num">Order</th>
                  <th>Sub-entries</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tops.map((c) => (
                  <CategoryEditor
                    key={c.id}
                    cat={c}
                    childCount={subs.filter((s) => s.parent_id === c.id).length}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SectionRule kicker="Sub" title="Sub-categories" />
      <div className="adm-panel adm-panel--ledger">
        {subs.length === 0 ? (
          <div style={{ padding: 24 }}><EmptyState body="No sub-entries yet." /></div>
        ) : (
          <div className="adm-tbl-wrap">
            <table className="adm-tbl">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Parent</th>
                  <th className="adm-tbl__num">Order</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {subs.map((c) => {
                  const parent = tops.find((t) => t.id === c.parent_id);
                  return (
                    <CategoryEditor
                      key={c.id}
                      cat={c}
                      parentLabel={parent?.name ?? "—"}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
