import { listAssets, listFolders } from "../../../lib/admin/repos/media-assets";
import PageHead from "../components/PageHead";
import EmptyState from "../components/EmptyState";
import { IconImage } from "../components/Icons";
import MediaUploader from "./MediaUploader";
import MediaTile from "./MediaTile";
import { requireUser } from "../../../lib/admin/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Media · Studio" };

type SP = { searchParams: Promise<{ q?: string; folder?: string }> };

export default async function MediaPage({ searchParams }: SP) {
  await requireUser("/studio/login");
  const sp = await searchParams;
  const folders = listFolders();
  const assets = listAssets({ q: sp.q, folder: sp.folder });

  return (
    <div className="stu-page">
      <PageHead title="Media library"
                sub="Every image you've uploaded across products, banners, categories, and homepage. Drag-drop more, organize, delete." />

      <MediaUploader />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 22, marginBottom: 14 }}>
        <a href="/studio/media" className={`stu-filters__chip${!sp.folder ? " active" : ""}`}>All folders</a>
        {folders.map((f) => (
          <a key={f} href={`/studio/media?folder=${encodeURIComponent(f)}`}
             className={`stu-filters__chip${sp.folder === f ? " active" : ""}`}>
            {f}
          </a>
        ))}
      </div>

      {assets.length === 0 ? (
        <EmptyState icon={<IconImage />} title="No images here yet" body="Drop files into the area above to add them." />
      ) : (
        <div className="stu-media-grid">
          {assets.map((a) => <MediaTile key={a.id} asset={a} />)}
        </div>
      )}
    </div>
  );
}
