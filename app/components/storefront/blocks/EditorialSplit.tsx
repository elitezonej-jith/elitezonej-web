import EditorialSplitView from "../../EditorialSplit";
import { listProductsForPage } from "@/lib/storefront/catalogue";

// Renders the real <EditorialSplit> (image one side, 6-up product grid the
// other) from the LIVE DB catalogue (static-index ordered) with the same
// gender/limit semantics as before.
export default async function EditorialSplit({
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
  let products = await listProductsForPage();
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
