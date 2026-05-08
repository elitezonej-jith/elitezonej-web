"use client";
import { useState } from "react";
import { deleteAssetAction, setAssetAltAction } from "../actions/media";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../components/Toast";
import { IconTrash } from "../components/Icons";
import type { MediaAsset } from "../../../lib/admin/repos/media-assets";

export default function MediaTile({ asset }: { asset: MediaAsset }) {
  const [open, setOpen] = useState(false);
  const [alt, setAlt] = useState(asset.alt);
  const { show } = useToast();
  const kb = asset.bytes ? Math.round(asset.bytes / 1024) : 0;

  return (
    <div className="stu-media-tile">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset.path} alt={alt} loading="lazy" />
      <div className="stu-media-tile__meta">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontFamily: "ui-monospace, monospace" }}>{kb}KB</span>
          <button type="button" className="stu-image-tile__btn stu-image-tile__btn--danger" onClick={() => setOpen(true)} title="Delete">
            <IconTrash width={12} height={12}/>
          </button>
        </div>
        <div title={asset.path} style={{ fontSize: 11, wordBreak: "break-all", color: "var(--stu-text-3)", marginBottom: 6 }}>
          {asset.path.split("/").slice(-1)[0]}
        </div>
        <form action={async (fd) => {
          await setAssetAltAction(fd);
          show("Saved", "success");
        }}>
          <input type="hidden" name="id" value={asset.id} />
          <input name="alt" value={alt} onChange={(e) => setAlt(e.target.value)}
                 placeholder="Alt text"
                 style={{ width: "100%", padding: "5px 7px", border: "1px solid var(--stu-border)", borderRadius: 6, fontSize: 11.5, background: "var(--stu-surface)" }}
                 onBlur={(e) => e.currentTarget.form?.requestSubmit()} />
        </form>
      </div>
      <ConfirmDialog open={open} onClose={() => setOpen(false)}
                     title="Delete this image?"
                     body={`Path: ${asset.path}. The file will be removed from disk and from any places that reference it must be updated manually.`}
                     formAction={deleteAssetAction} hidden={{ id: String(asset.id) }} />
    </div>
  );
}
