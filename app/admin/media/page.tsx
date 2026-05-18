import { listMediaFiles } from "../../../lib/admin/repos/media";
import PageHead from "../components/PageHead";
import EditorsNote from "../components/EditorsNote";
import EmptyState from "../components/EmptyState";
import FilterBar from "../components/FilterBar";
import { requireUser } from "../../../lib/admin/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Media · Atelier" };

type SP = { searchParams: Promise<{ q?: string }> };

function bytesToKb(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function MediaPage({ searchParams }: SP) {
  await requireUser();
  const sp = await searchParams;
  const files = listMediaFiles({ q: sp.q });

  return (
    <div className="adm-page">
      <EditorsNote body={`The media library lists every webp / jpg / png / svg under /public/generated/ and /public/admin-uploads/. Click a tile to copy its path.`} />
      <PageHead
        kicker="Workbook · 11"
        emphasis="Media"
        title="library"
        stand={`${files.length} asset${files.length === 1 ? "" : "s"} catalogued. Search by filename or folder.`}
      />

      <FilterBar chips={[]} placeholder="Search by file path…" />

      {files.length === 0 ? (
        <EmptyState body="No media found. Drop assets into /public/generated/ to populate the library." />
      ) : (
        <div className="adm-media-grid">
          {files.slice(0, 240).map((f) => (
            <a key={f.path} className="adm-media-tile" href={f.path} target="_blank" rel="noreferrer" title="Open in new tab">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="adm-media-tile__img" src={f.path} alt="" loading="lazy" />
              <span className="adm-media-tile__name">{f.path.split("/").slice(-1)[0]}</span>
              <span className="adm-media-tile__meta">
                <span>{f.folder.replace(/^public\//, "")}</span>
                <span>{bytesToKb(f.bytes)}</span>
              </span>
            </a>
          ))}
        </div>
      )}
      {files.length > 240 && (
        <p className="adm-italic" style={{ marginTop: 16 }}>Showing first 240 entries — refine with the search above.</p>
      )}
    </div>
  );
}
