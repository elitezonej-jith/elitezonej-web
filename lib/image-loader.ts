// Custom next/image loader. Product photos (Vercel Blob uploads and the
// pre-generated /generated/ set) go through our own resizer at /api/img so
// phones get a ~640 px image instead of the 1000–2400 px original.
// Everything else (logos, SVGs, other paths) is served as-is.
// Vercel's built-in optimizer is not used (Hobby quota).

type LoaderProps = { src: string; width: number; quality?: number };

const RESIZABLE = /^(https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/|\/generated\/|\/uploads\/)/i;

export default function imageLoader({ src, width, quality }: LoaderProps): string {
  if (!RESIZABLE.test(src) || /\.svg($|\?)/i.test(src)) return src;
  const q = quality ?? 75;
  return `/api/img?url=${encodeURIComponent(src)}&w=${width}&q=${q}`;
}
