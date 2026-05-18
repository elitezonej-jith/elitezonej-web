import EditorialSplitView from "../../EditorialSplit";
import { PRODUCTS } from "@/lib/products";

// Byte-parity wrapper: renders the real <EditorialSplit> (image one side,
// 6-up product grid the other) with the same static catalog the original
// homepage used: PRODUCTS.filter(gender).slice(0, limit).
export default function EditorialSplit({
  title,
  ctaLabel,
  ctaHref,
  image,
  imageAlt,
  imageSide,
  gender,
  limit,
}: {
  title: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
  imageAlt: string;
  imageSide?: "left" | "right";
  gender?: string;
  limit?: number;
}) {
  let products = PRODUCTS;
  if (gender) products = products.filter((p) => p.gender === gender);
  const sliced = products.slice(0, limit ?? 6);
  return (
    <EditorialSplitView
      title={title}
      ctaLabel={ctaLabel}
      ctaHref={ctaHref}
      image={image}
      imageAlt={imageAlt}
      imageSide={imageSide}
      products={sliced}
    />
  );
}
