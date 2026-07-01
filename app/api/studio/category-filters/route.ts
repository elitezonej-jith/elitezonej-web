import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/admin/session";
import { getInheritedFilters } from "@/lib/admin/repos/category-filters";
import { getTagsForProduct } from "@/lib/admin/repos/product-filter-values";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await requireUser("/studio/login");
  const { searchParams } = req.nextUrl;
  const categoryId = Number(searchParams.get("id") || 0);
  const productSlug = searchParams.get("slug") || "";

  if (!categoryId) {
    return NextResponse.json({ filters: [], tags: [] });
  }

  const filters = await getInheritedFilters(categoryId);
  const simplified = filters.map((f) => ({
    id: f.id,
    name: f.name,
    field_key: f.field_key,
    filter_type: f.filter_type,
    sort_order: f.sort_order,
    options: f.options.map((o) => ({
      id: o.id,
      value: o.value,
      label: o.label,
      color_hex: o.color_hex,
    })),
  }));

  let tags: Array<{ filter_id: number; option_id: number }> = [];
  if (productSlug) {
    const allTags = await getTagsForProduct(productSlug);
    tags = allTags.map((t) => ({ filter_id: t.filter_id, option_id: t.option_id }));
  }

  return NextResponse.json({ filters: simplified, tags });
}
