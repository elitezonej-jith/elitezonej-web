// Custom image loader: blob-hosted images (already WebP, already compressed)
// are served directly from the blob CDN. Local images still go through the
// default Next.js optimization pipeline via /_next/image.

type LoaderProps = { src: string; width: number; quality?: number };

export default function imageLoader({ src, width, quality }: LoaderProps): string {
  // Blob URLs are already optimized at upload — serve directly from CDN
  if (src.includes("blob.vercel-storage.com")) {
    return src;
  }
  // Local/relative images → use Vercel's Image Optimization API as normal
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`;
}
