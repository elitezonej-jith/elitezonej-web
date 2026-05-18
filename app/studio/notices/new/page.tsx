import Link from "next/link";
import PageHead from "../../components/PageHead";
import NoticeForm from "../[id]/NoticeForm";
import { requireUser } from "../../../../lib/admin/session";

export const metadata = { title: "New notice · Studio" };

export default async function NewNoticePage() {
  await requireUser("/studio/login");
  return (
    <div className="stu-page stu-page--narrow">
      <PageHead title="New notice" sub="Pick a type, write the message, and decide when it should run."
                back={{ href: "/studio/notices", label: "Back to notices" }}>
        <Link href="/studio/notices" className="stu-btn stu-btn--ghost">Cancel</Link>
      </PageHead>
      <NoticeForm />
    </div>
  );
}
