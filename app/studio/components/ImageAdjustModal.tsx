"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  convertToPixelCrop,
  type Crop,
  type PixelCrop,
} from "react-image-crop";

const TO_RAD = Math.PI / 180;

/**
 * Render the user-adjusted crop (with zoom + rotation baked in) to a WebP blob.
 * Crop coordinates are in *displayed* pixels; we scale up to natural resolution
 * so the exported image keeps the source's full quality. Adapted from the
 * official react-image-crop canvasPreview example.
 */
async function renderCrop(
  image: HTMLImageElement,
  crop: PixelCrop,
  scale: number,
  rotate: number,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context");

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const pixelRatio = window.devicePixelRatio || 1;

  canvas.width = Math.max(1, Math.floor(crop.width * scaleX * pixelRatio));
  canvas.height = Math.max(1, Math.floor(crop.height * scaleY * pixelRatio));

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = "high";

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;
  const rotateRads = rotate * TO_RAD;
  const centerX = image.naturalWidth / 2;
  const centerY = image.naturalHeight / 2;

  ctx.save();
  ctx.translate(-cropX, -cropY);
  ctx.translate(centerX, centerY);
  ctx.rotate(rotateRads);
  ctx.scale(scale, scale);
  ctx.translate(-centerX, -centerY);
  ctx.drawImage(
    image,
    0, 0, image.naturalWidth, image.naturalHeight,
    0, 0, image.naturalWidth, image.naturalHeight,
  );
  ctx.restore();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Canvas export failed"))),
      "image/webp",
      0.92,
    );
  });
}

export default function ImageAdjustModal({
  src,
  fileName,
  aspect,
  onApply,
  onSkip,
  onCancel,
}: {
  src: string;
  fileName: string;
  /** Optional locked aspect ratio (width / height). Free crop when omitted. */
  aspect?: number;
  /** Receives the adjusted image as a WebP blob. */
  onApply: (blob: Blob) => void | Promise<void>;
  /** Upload the original, unadjusted file. */
  onSkip: () => void;
  /** Discard this file (and any remaining queued files). */
  onCancel: () => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completed, setCompleted] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [working, setWorking] = useState(false);

  // Lock background scroll while the modal is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      const next = aspect
        ? centerCrop(
            makeAspectCrop({ unit: "%", width: 90 }, aspect, width, height),
            width,
            height,
          )
        : ({ unit: "%", x: 0, y: 0, width: 100, height: 100 } as Crop);
      setCrop(next);
      setCompleted(convertToPixelCrop(next, width, height));
    },
    [aspect],
  );

  const reset = () => {
    setScale(1);
    setRotate(0);
    const img = imgRef.current;
    if (img) {
      onImageLoad({ currentTarget: img } as React.SyntheticEvent<HTMLImageElement>);
    }
  };

  const apply = async () => {
    const img = imgRef.current;
    if (!img) return;
    const area =
      completed && completed.width > 0 && completed.height > 0
        ? completed
        : convertToPixelCrop(
            { unit: "px", x: 0, y: 0, width: img.width, height: img.height },
            img.width,
            img.height,
          );
    setWorking(true);
    try {
      const blob = await renderCrop(img, area, scale, rotate);
      await onApply(blob);
    } finally {
      setWorking(false);
    }
  };

  return createPortal(
    <div className="stu-crop-overlay" role="dialog" aria-modal="true" aria-label="Adjust image">
      <div className="stu-crop">
        <header className="stu-crop__head">
          <h3>Adjust image</h3>
          <span className="stu-crop__name" title={fileName}>{fileName}</span>
        </header>

        <div className="stu-crop__stage">
          <ReactCrop
            crop={crop}
            onChange={(_, percent) => setCrop(percent)}
            onComplete={(c) => setCompleted(c)}
            aspect={aspect}
            keepSelection
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={src}
              alt=""
              style={{ transform: `scale(${scale}) rotate(${rotate}deg)` }}
              onLoad={onImageLoad}
            />
          </ReactCrop>
        </div>

        <div className="stu-crop__controls">
          <label className="stu-crop__ctrl">
            <span>Zoom</span>
            <input
              type="range"
              min={1}
              max={4}
              step={0.01}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
            />
          </label>
          <div className="stu-crop__ctrl">
            <span>Rotate</span>
            <button type="button" className="stu-btn stu-btn--sm" onClick={() => setRotate((r) => r - 90)} aria-label="Rotate left">⟲</button>
            <button type="button" className="stu-btn stu-btn--sm" onClick={() => setRotate((r) => r + 90)} aria-label="Rotate right">⟳</button>
          </div>
          <button type="button" className="stu-btn stu-btn--sm stu-btn--ghost" onClick={reset}>Reset</button>
        </div>

        <footer className="stu-crop__foot">
          <button type="button" className="stu-btn stu-btn--ghost" onClick={onCancel} disabled={working}>Cancel</button>
          <button type="button" className="stu-btn" onClick={onSkip} disabled={working}>Use original</button>
          <button type="button" className="stu-btn stu-btn--primary" onClick={apply} disabled={working}>
            {working ? "Applying…" : "Apply & upload"}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
