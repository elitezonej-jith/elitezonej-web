import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct } from "../../../../lib/admin/repos/products";
import { listImages, fallbackImages } from "../../../../lib/admin/repos/product-images";
import { getMeta } from "../../../../lib/admin/repos/product-meta";
import { listColours } from "../../../../lib/admin/repos/product-colours";
import { sql } from "../../../../lib/admin/db";
import { getInheritedFilters } from "../../../../lib/admin/repos/category-filters";
import PageHead from "../../components/PageHead";
import StatusTag from "../../components/StatusTag";
import { FlashToast } from "../../components/Toast";
import { archiveProductAction, duplicateProductAction } from "../../actions/products";
import ProductForm from "./ProductForm";
import ProductImageManager from "./ProductImageManager";
import ColourManager from "./ColourManager";
import ProductDangerZone from "./ProductDangerZone";
import { requireUser } from "../../../../lib/admin/session";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }>; searchParams: Promise<{ saved?: string; flash?: string }> };

export default async function ProductEditorPage({ params, searchParams }: Params) {
  await requireUser("/studio/login");
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const { saved, flash } = await searchParams;
  const meta = await getMeta(slug);
  const images = await listImages(slug);
  const colours = await listColours(slug);
  const fallback = images.length === 0 ? fallbackImages(slug) : [];

  // Load categories for picker
  const categories = await sql.all<{ id: number; name: string; slug: string; parent_id: number | null }>(
    "SELECT id, name, slug, parent_id FROM categories ORDER BY sort_order ASC, name ASC"
  );

  // Load filters for the product's current category
  let filterDefs: Array<{ name: string; field_key: string; options: string[] }> = [];
  const catSlug = product.sub || product.category;
  if (catSlug) {
    const catRow = await sql.get<{ id: number }>(
      "SELECT id FROM categories WHERE slug = ? OR LOWER(name) = LOWER(?)",
      [catSlug, catSlug]
    );
    if (catRow) {
      const inherited = await getInheritedFilters(catRow.id);
      filterDefs = inherited
        .filter(f => ["fit", "fabric", "occasion"].includes(f.field_key))
        .map(f => ({ name: f.name, field_key: f.field_key, options: f.options.map(o => o.value) }));
    }
  }

  return (
    <div className="stu-page">
      <FlashToast flash={saved ? "Product saved" : flash} />
      <PageHead title={product.name} sub={product.line || product.cat}
                back={{ href: "/studio/products", label: "Back to products" }}>
        <StatusTag status={product.status} />
        <Link href={`/products/${slug}`} target="_blank" className="stu-btn stu-btn--ghost">View on store ↗</Link>
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

      <ColourManager slug={slug} colours={colours} images={images} />

      <div style={{ height: 32 }} />

      <ProductForm mode="edit" product={product} meta={meta} categories={categories} filters={filterDefs} />

      <div style={{ height: 32 }} />

      <ProductDangerZone slug={slug} name={product.name} />
    </div>
  );
}
