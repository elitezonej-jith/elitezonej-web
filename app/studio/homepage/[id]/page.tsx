import { notFound } from "next/navigation";
import Link from "next/link";
import { getBlock } from "../../../../lib/admin/repos/homepage";
import PageHead from "../../components/PageHead";
import StatusTag from "../../components/StatusTag";
import { FlashToast } from "../../components/Toast";
import BlockEditor from "./BlockEditor";
import BlockDangerZone from "./BlockDangerZone";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> };

export default async function EditBlockPage({ params, searchParams }: Params) {
  const { id } = await params;
  const { saved } = await searchParams;
  const block = getBlock(Number(id));
  if (!block) notFound();
  return (
    <div className="stu-page">
      <FlashToast flash={saved ? "Section saved" : undefined} />
      <PageHead title={block.title || block.type} sub={`Type: ${block.type}`}
                back={{ href: "/studio/homepage", label: "Back to homepage" }}>
        <StatusTag status={block.enabled ? "published" : "disabled"} />
        <Link href="/studio/homepage" className="stu-btn stu-btn--ghost">Done</Link>
      </PageHead>
      <BlockEditor block={block} />
      <div style={{ height: 32 }} />
      <BlockDangerZone id={block.id} />
    </div>
  );
}
