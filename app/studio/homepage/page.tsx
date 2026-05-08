import Link from "next/link";
import { listBlocks } from "../../../lib/admin/repos/homepage";
import PageHead from "../components/PageHead";
import EmptyState from "../components/EmptyState";
import { FlashToast } from "../components/Toast";
import HomepageList from "./HomepageList";
import AddBlockMenu from "./AddBlockMenu";
import { IconLayers } from "../components/Icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Homepage · Studio" };

type SP = { searchParams: Promise<{ flash?: string }> };

export default async function HomepagePage({ searchParams }: SP) {
  const blocks = listBlocks();
  const sp = await searchParams;
  return (
    <div className="stu-page">
      <FlashToast flash={sp.flash} />
      <PageHead title="Homepage layout"
                sub="The sections that build your storefront homepage. Drag to reorder. Click to edit any one. Add or remove freely.">
        <Link href="/" className="stu-btn stu-btn--ghost" target="_blank">Preview store ↗</Link>
        <AddBlockMenu />
      </PageHead>

      {blocks.length === 0 ? (
        <EmptyState icon={<IconLayers />} title="Your homepage is empty"
                    body="Add the first section to start building your homepage."
                    action={<AddBlockMenu />} />
      ) : (
        <HomepageList blocks={blocks} />
      )}
    </div>
  );
}
