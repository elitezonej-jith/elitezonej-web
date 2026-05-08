"use client";
import { useRef, useState } from "react";
import { useToast } from "./Toast";
import { IconUpload } from "./Icons";

type Uploaded = { path: string; bytes: number; width: number; height: number };

export default function ImageUploader({
  folder = "uploads",
  multiple = true,
  onUploaded,
  hint,
}: {
  folder?: string;
  multiple?: boolean;
  onUploaded: (asset: Uploaded) => void;
  hint?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const { show } = useToast();

  const upload = async (files: File[]) => {
    if (!files.length) return;
    setBusy(true);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", folder);
        const res = await fetch("/api/studio/upload", { method: "POST", body: fd });
        if (!res.ok) {
          const err = await res.text();
          show(`Upload failed — ${err.slice(0, 80)}`, "error");
          continue;
        }
        const data = (await res.json()) as Uploaded;
        onUploaded(data);
      }
      show(`${files.length} image${files.length === 1 ? "" : "s"} uploaded`, "success");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };

  return (
    <div
      className={`stu-uploader${drag ? " is-drag" : ""}`}
      onClick={() => ref.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault(); setDrag(false);
        const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
        upload(files);
      }}
    >
      <IconUpload className="stu-uploader__icon" width={36} height={36} />
      <div className="stu-uploader__title">
        {busy ? "Uploading…" : "Drop images here or click to browse"}
      </div>
      <div className="stu-uploader__sub">
        {hint ?? "PNG, JPG, WEBP — auto-resized + compressed."}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple={multiple}
        style={{ display: "none" }}
        onChange={(e) => upload(Array.from(e.target.files ?? []))}
      />
    </div>
  );
}
