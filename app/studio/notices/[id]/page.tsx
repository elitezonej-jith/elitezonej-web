import { notFound } from "next/navigation";
import Link from "next/link";
import { getNotice } from "../../../../lib/admin/repos/notices";
import PageHead from "../../components/PageHead";
import StatusTag from "../../components/StatusTag";
import { FlashToast } from "../../components/Toast";
import NoticeForm from "./NoticeForm";
import NoticeDangerZone from "./NoticeDangerZone";
import { requireUser } from "../../../../lib/admin/session";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> };

export default async function EditNoticePage({ params, searchParams }: Params) {
  await requireUser("/studio/login");
  const { id } = await params;
  const { saved } = await searchParams;
  const notice = getNotice(Number(id));
  if (!notice) notFound();
  return (
    <div className="stu-page stu-page--narrow">
      <FlashToast flash={saved ? "Notice saved" : undefined} />
      <PageHead title="Edit notice" sub={notice.body.slice(0, 100)}
                back={{ href: "/studio/notices", label: "Back to notices" }}>
        <StatusTag status={notice.enabled ? "active" : "disabled"} />
        <Link href="/studio/notices" className="stu-btn stu-btn--ghost">Done</Link>
      </PageHead>
      <NoticeForm notice={notice} />
      <div style={{ height: 32 }} />
      <NoticeDangerZone id={notice.id} />
    </div>
  );
}
