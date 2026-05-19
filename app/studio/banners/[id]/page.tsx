import { notFound } from "next/navigation";
import Link from "next/link";
import { getBanner } from "../../../../lib/admin/repos/banners";
import PageHead from "../../components/PageHead";
import StatusTag from "../../components/StatusTag";
import { FlashToast } from "../../components/Toast";
import BannerForm from "./BannerForm";
import BannerDangerZone from "./BannerDangerZone";
import { requireUser } from "../../../../lib/admin/session";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> };

export default async function EditBannerPage({ params, searchParams }: Params) {
  await requireUser("/studio/login");
  const { id } = await params;
  const { saved } = await searchParams;
  const banner = await getBanner(Number(id));
  if (!banner) notFound();
  return (
    <div className="stu-page">
      <FlashToast flash={saved ? "Banner saved" : undefined} />
      <PageHead title={banner.title || "Edit banner"} sub={banner.subtitle}
                back={{ href: "/studio/banners", label: "Back to banners" }}>
        <StatusTag status={banner.status} />
        <Link href="/studio/banners" className="stu-btn stu-btn--ghost">Done</Link>
      </PageHead>
      <BannerForm banner={banner} />
      <div style={{ height: 32 }} />
      <BannerDangerZone id={banner.id} title={banner.title} />
    </div>
  );
}
