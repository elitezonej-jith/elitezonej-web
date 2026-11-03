// Widths the image resizer will produce. Shared by next.config.ts
// (deviceSizes/imageSizes, which drive <Image> srcset) and /api/img (which
// rejects anything else, so the endpoint can't be used to mint unlimited
// variants).
export const IMAGE_DEVICE_SIZES = [640, 828, 1080, 1600] as const;
export const IMAGE_SIZES = [256, 384] as const;
export const ALLOWED_IMAGE_WIDTHS: readonly number[] = [...IMAGE_SIZES, ...IMAGE_DEVICE_SIZES];

// Our Vercel Blob store. Only images from here (or our own /generated and
// /uploads folders) are resized.
export const BLOB_HOST = "t2bului15a6swabr.public.blob.vercel-storage.com";
