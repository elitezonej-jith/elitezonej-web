"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/products";
import type { ProductReview, ReviewAggregate } from "@/lib/admin/repos/product-reviews";
import TailoredPDP from "./TailoredPDP";
import FabricPDP from "./FabricPDP";
import ReviewsSection from "./ReviewsSection";
import "../../styles/product.css";

export default function ProductPageClient({
  product,
  related,
  leadTimeDays,
  reviews,
  reviewAggregate,
  canWrite,
  reviewState,
}: {
  product: Product;
  related: Product[];
  leadTimeDays: number;
  reviews: ProductReview[];
  reviewAggregate: ReviewAggregate;
  canWrite: boolean;
  reviewState: "anon" | "not_purchased" | "already_reviewed" | "can_write";
}) {
  const router = useRouter();
  const isFabric = product.kind === "fabric";

  const switchProduct = (nextSlug: string) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    router.push(`/products/${nextSlug}`);
  };

  return (
    <>
      <div className="crumb t-mono-xs">
        <Link href="/">Home</Link><span className="sep">/</span>
        <Link href={`/collection?c=${isFabric ? "fabrics" : product.category === "accessories" ? "accessories" : product.gender}`}>{product.catLink}</Link>
        <span className="sep">/</span>
        <span>{product.name}</span>
      </div>

      {isFabric
        ? <FabricPDP product={product} leadTimeDays={leadTimeDays} reviewAggregate={reviewAggregate} />
        : <TailoredPDP product={product} setCurrentSlug={switchProduct} related={related} leadTimeDays={leadTimeDays} reviewAggregate={reviewAggregate} />}

      <div className="pdp-reviews-wrap">
        <ReviewsSection
          slug={product.slug}
          aggregate={reviewAggregate}
          reviews={reviews}
          canWrite={canWrite}
          reviewState={reviewState}
        />
      </div>
    </>
  );
}
