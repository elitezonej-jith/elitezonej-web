// Custom image loader: all images are pre-optimized WebP. Serve directly
// without going through /_next/image (Vercel quota exceeded on Hobby plan).

type LoaderProps = { src: string; width: number; quality?: number };

export default function imageLoader({ src }: LoaderProps): string {
  // Blob URLs — serve directly from CDN
  if (src.includes("blob.vercel-storage.com")) {
    return src;
  }
  // Local images are already compressed WebP — serve as-is
  return src;
}
