import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct } from "../../../../lib/admin/repos/products";
import { listImages, fallbackImages } from "../../../../lib/admin/repos/product-images";
import { getMeta } from "../../../../lib/admin/repos/product-meta";
import PageHead from "../../components/PageHead";
import StatusTag from "../../components/StatusTag";
import { FlashToast } from "../../components/Toast";
import { archiveProductAction, duplicateProductAction } from "../../actions/products";
import ProductForm from "./ProductForm";
import ProductImageManager from "./ProductImageManager";
import ProductDangerZone from "./ProductDangerZone";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }>; searchParams: Promise<{ saved?: string; flash?: string }> };

export default async function ProductEditorPage({ params, searchParams }: Params) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  const { saved, flash } = await searchParams;
  const meta = getMeta(slug);
  const images = listImages(slug);
  const fallback = images.length === 0 ? fallbackImages(slug) : [];

  return (
    <div className="stu-page">
      <FlashToast flash={saved ? "Product saved" : flash} />
      <PageHead title={product.name} sub={product.line || product.cat}
                back={{ href: "/studio/products", label: "Back to products" }}>
        <StatusTag status={product.status} />
        <form action={duplicateProductAction}>
          <input type="hidden" name="slug" value={slug} />
          <button type="submit" className="stu-btn stu-btn--ghost">Duplicate</button>
        </form>
        {product.status === "active" ? (
          <form action={archiveProductAction}>
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="status" value="draft" />
            <button type="submit" className="stu-btn stu-btn--ghost">Move to draft</button>
          </form>
        ) : (
          <form action={archiveProductAction}>
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="status" value="active" />
            <button type="submit" className="stu-btn stu-btn--brand">Publish</button>
          </form>
        )}
      </PageHead>

      <ProductImageManager slug={slug} images={images} fallback={fallback} />

      <div style={{ height: 32 }} />

      <ProductForm mode="edit" product={product} meta={meta} />

      <div style={{ height: 32 }} />

      <ProductDangerZone slug={slug} name={product.name} />
    </div>
  );
}
