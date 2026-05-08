import Link from "next/link";
import { listNotices } from "../../../lib/admin/repos/notices";
import PageHead from "../components/PageHead";
import StatusTag from "../components/StatusTag";
import EmptyState from "../components/EmptyState";
import { FlashToast } from "../components/Toast";
import { toggleNoticeAction } from "../actions/notices";
import { IconBell, IconPlus, IconEye, IconEyeOff, IconEdit } from "../components/Icons";
import { dateShort } from "../../../lib/admin/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notices · Studio" };
type SP = { searchParams: Promise<{ flash?: string }> };

export default async function NoticesPage({ searchParams }: SP) {
  const all = listNotices();
  const sp = await searchParams;
  const groups: Array<{ key: "scroll" | "popup" | "festive"; label: string; sub: string }> = [
    { key: "scroll", label: "Scrolling tickers", sub: "Top of every page" },
    { key: "popup",  label: "Popups",            sub: "Modal on first visit" },
    { key: "festive", label: "Festive notices",  sub: "Site-wide soft bar" },
  ];

  return (
    <div className="stu-page">
      <FlashToast flash={sp.flash} />
      <PageHead title="Notices" sub="Tickers, popups, and festive bars across your storefront. Higher priority shows first.">
        <Link href="/studio/notices/new" className="stu-btn stu-btn--primary">
          <IconPlus width={16} height={16} /> New notice
        </Link>
      </PageHead>

      {all.length === 0 ? (
        <EmptyState icon={<IconBell />} title="No notices yet"
                    body="Use a notice to announce shipping cutoffs, sales, or studio holidays."
                    action={<Link href="/studio/notices/new" className="stu-btn stu-btn--primary"><IconPlus width={14} height={14}/> New notice</Link>} />
      ) : (
        <div className="stu-stack">
          {groups.map((g) => {
            const list = all.filter((n) => n.type === g.key);
            if (list.length === 0) return null;
            return (
              <section className="stu-card" key={g.key}>
                <header className="stu-card__head">
                  <h3>{g.label}</h3>
                  <span className="stu-card__head__sub">{g.sub}</span>
                </header>
                <div className="stu-card__body--flush">
                  <div className="stu-tbl-wrap">
                    <table className="stu-tbl">
                      <thead>
                        <tr>
                          <th>Notice</th>
                          <th>Priority</th>
                          <th>Window</th>
                          <th>State</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((n) => (
                          <tr key={n.id}>
                            <td>
                              <Link href={`/studio/notices/${n.id}`} className="stu-tbl__name">
                                {n.body.slice(0, 80)}{n.body.length > 80 ? "…" : ""}
                              </Link>
                              {n.link_href && <span className="stu-tbl__sub">→ {n.link_text || n.link_href}</span>}
                            </td>
                            <td className="stu-tbl__num">{n.priority}</td>
                            <td className="stu-tbl__num" style={{ fontSize: 12 }}>
                              {n.starts_at ? dateShort(n.starts_at) : "—"} → {n.ends_at ? dateShort(n.ends_at) : "open"}
                            </td>
                            <td><StatusTag status={n.enabled ? "active" : "disabled"} /></td>
                            <td style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                              <form action={toggleNoticeAction}>
                                <input type="hidden" name="id" value={n.id} />
                                <input type="hidden" name="enabled" value={n.enabled ? "0" : "1"} />
                                <button type="submit" className="stu-btn stu-btn--ghost stu-btn--icon"
                                        title={n.enabled ? "Hide" : "Show"}>
                                  {n.enabled ? <IconEye width={16} height={16}/> : <IconEyeOff width={16} height={16}/>}
                                </button>
                              </form>
                              <Link href={`/studio/notices/${n.id}`} className="stu-btn stu-btn--ghost stu-btn--sm">
                                <IconEdit width={14} height={14}/> Edit
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
