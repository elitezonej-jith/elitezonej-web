"use client";
import { useRef, useState } from "react";
import { useToast } from "./Toast";
import { IconUpload } from "./Icons";
import ImageAdjustModal from "./ImageAdjustModal";

type Uploaded = { path: string; bytes: number; width: number; height: number };

export default function ImageUploader({
  folder = "uploads",
  multiple = true,
  onUploaded,
  hint,
  aspect,
}: {
  folder?: string;
  multiple?: boolean;
  onUploaded: (asset: Uploaded) => void;
  hint?: string;
  /** Optional locked aspect ratio (width / height) for the adjust step. */
  aspect?: number;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const pending = useRef<File[]>([]);
  const okCount = useRef(0);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState<{ file: File; url: string } | null>(null);
  const { show } = useToast();

  // POST a single file to the upload route. Returns true on success.
  const uploadOne = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", folder);
    const res = await fetch("/api/studio/upload", { method: "POST", body: fd });
    if (!res.ok) {
      const err = await res.text();
      show(`Upload failed — ${err.slice(0, 80)}`, "error");
      return false;
    }
    onUploaded((await res.json()) as Uploaded);
    okCount.current += 1;
    return true;
  };

  // Open the adjust modal for the next queued file, or finish the batch.
  const next = () => {
    if (current) {
      URL.revokeObjectURL(current.url);
      setCurrent(null);
    }
    const file = pending.current.shift();
    if (!file) {
      const n = okCount.current;
      if (n > 0) show(`${n} image${n === 1 ? "" : "s"} uploaded`, "success");
      setBusy(false);
      if (ref.current) ref.current.value = "";
      return;
    }
    setCurrent({ file, url: URL.createObjectURL(file) });
  };

  const start = (files: File[]) => {
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    if (!imgs.length) return;
    pending.current = imgs;
    okCount.current = 0;
    setBusy(true);
    next();
  };

  const handleApply = async (blob: Blob) => {
    if (!current) return;
    const adjusted = new File([blob], current.file.name.replace(/\.\w+$/, "") + ".webp", {
      type: blob.type || "image/webp",
    });
    await uploadOne(adjusted);
    next();
  };

  const handleSkip = async () => {
    if (!current) return;
    await uploadOne(current.file);
    next();
  };

  const handleCancel = () => {
    pending.current = [];
    next(); // flushes the (now empty) queue and resets state
  };

  return (
    <>
      <div
        className={`stu-uploader${drag ? " is-drag" : ""}`}
        onClick={() => ref.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault(); setDrag(false);
          start(Array.from(e.dataTransfer.files));
        }}
      >
        <IconUpload className="stu-uploader__icon" width={36} height={36} />
        <div className="stu-uploader__title">
          {busy ? "Adjust & upload…" : "Drop images here or click to browse"}
        </div>
        <div className="stu-uploader__sub">
          {hint ?? "PNG, JPG, WEBP — zoom & crop before upload."}
        </div>
        <input
          ref={ref}
          type="file"
          accept="image/*"
          multiple={multiple}
          style={{ display: "none" }}
          onChange={(e) => start(Array.from(e.target.files ?? []))}
        />
      </div>

      {current && (
        <ImageAdjustModal
          key={current.url}
          src={current.url}
          fileName={current.file.name}
          aspect={aspect}
          onApply={handleApply}
          onSkip={handleSkip}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}
