"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/products";
import TailoredPDP from "./TailoredPDP";
import FabricPDP from "./FabricPDP";
import "../../styles/product.css";

export default function ProductPageClient({
  product,
  related,
}: {
  product: Product;
  related: Product[];
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
        <Link href={`/collection?c=${isFabric ? "fabrics" : product.gender}`}>{product.catLink}</Link>
        <span className="sep">/</span>
        <span>{product.name}</span>
      </div>

      {isFabric
        ? <FabricPDP product={product} />
        : <TailoredPDP product={product} setCurrentSlug={switchProduct} related={related} />}
    </>
  );
}
