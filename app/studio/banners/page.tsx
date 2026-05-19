import Link from "next/link";
import { listBanners } from "../../../lib/admin/repos/banners";
import PageHead from "../components/PageHead";
import StatusTag from "../components/StatusTag";
import EmptyState from "../components/EmptyState";
import BannersList from "./BannersList";
import { IconImage, IconPlus } from "../components/Icons";
import { FlashToast } from "../components/Toast";
import { requireUser } from "../../../lib/admin/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Banners · Studio" };

type SP = { searchParams: Promise<{ flash?: string }> };

export default async function BannersListPage({ searchParams }: SP) {
  await requireUser("/studio/login");
  const banners = await listBanners();
  const sp = await searchParams;
  void StatusTag;
  return (
    <div className="stu-page">
      <FlashToast flash={sp.flash} />
      <PageHead title="Homepage banners"
                sub="Hero banners that appear at the top of your store. Drag to change the order, schedule a window, hide without deleting.">
        <Link href="/studio/banners/new" className="stu-btn stu-btn--primary">
          <IconPlus width={16} height={16} /> New banner
        </Link>
      </PageHead>

      {banners.length === 0 ? (
        <EmptyState icon={<IconImage />} title="No banners yet"
                    body="Create your first banner. Upload an image, set a title and a button, decide when to publish."
                    action={<Link href="/studio/banners/new" className="stu-btn stu-btn--primary"><IconPlus width={14} height={14}/> Add a banner</Link>} />
      ) : (
        <BannersList banners={banners} />
      )}
    </div>
  );
}
