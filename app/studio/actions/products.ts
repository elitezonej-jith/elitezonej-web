"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { bustProducts } from "../../../lib/storefront/cache";
import { z } from "zod";
import { requireUser } from "../../../lib/admin/session";
import {
  upsertProduct, deleteProduct, setStatus, getProduct, setInventory,
  type ProductInput,
} from "../../../lib/admin/repos/products";
import {
  addImage, deleteImage as deleteProductImage, reorderImages, setThumbnail, setHover, updateAlt, assignImageColour,
} from "../../../lib/admin/repos/product-images";
import { upsertMeta, getMeta } from "../../../lib/admin/repos/product-meta";
import { logAudit } from "../../../lib/admin/repos/audit";

const ProductSchema = z.object({
  slug: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(140),
  cat: z.string().max(180).default(""),
  cat_link: z.enum(["Men", "Women", "Fabrics"]),
  price: z.coerce.number().int().min(0),
  sale_price: z.union([z.literal(""), z.coerce.number().int().min(0)]).optional(),
  line: z.string().max(500).default(""),
  short_description: z.string().max(800).default(""),
  long_description: z.string().max(4000).default(""),
  sizes: z.string().default(""),
  features: z.string().default(""),
  spec: z.string().default(""),
  fit: z.string().max(60).default(""),
  fabric: z.string().max(60).default(""),
  occasion: z.string().max(60).default(""),
  badge: z.string().max(40).optional(),
  gender: z.enum(["men", "women", "unisex"]),
  category: z.string().max(60).default(""),
  sub: z.string().max(60).optional(),
  kind: z.enum(["tailored", "fabric"]),
  status: z.enum(["active", "draft", "archived"]),
  is_featured: z.union([z.literal("on"), z.literal("")]).optional(),
  is_trending: z.union([z.literal("on"), z.literal("")]).optional(),
  is_new_arrival: z.union([z.literal("on"), z.literal("")]).optional(),
  is_premium: z.union([z.literal("on"), z.literal("")]).optional(),
  meta_title: z.string().max(120).default(""),
  meta_description: z.string().max(240).default(""),
  og_image_path: z.string().max(240).default(""),
  size_guide: z.string().max(8000).default(""),
});

function splitLines(raw: string): string[] {
  return raw.split(/\n+/).map((s) => s.trim()).filter(Boolean);
}
function parseSpec(raw: string): [string, string][] {
  return splitLines(raw).map((line) => {
    const i = line.indexOf(":");
    if (i === -1) return null;
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim();
    return k && v ? ([k, v] as [string, string]) : null;
  }).filter(Boolean) as [string, string][];
}

export type ProductSaveState = { error?: string };

export async function saveProductAction(_prev: ProductSaveState, fd: FormData): Promise<ProductSaveState> {
  const me = await requireUser("/studio/login");
  const raw = Object.fromEntries(fd.entries()) as Record<string, string>;
  const parsed = ProductSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please review the form." };
  const v = parsed.data;

  const exists = !!(await getProduct(v.slug));
  const input: ProductInput = {
    slug: v.slug,
    name: v.name,
    cat: v.cat,
    cat_link: v.cat_link,
    price: v.price,
    sale_price: v.sale_price === "" || v.sale_price === undefined ? null : Number(v.sale_price),
    line: v.line,
    sizes: splitLines(v.sizes),
    features: splitLines(v.features),
    spec: parseSpec(v.spec),
    note: "",
    fit: v.fit, fabric: v.fabric, occasion: v.occasion,
    badge: v.badge?.trim() || null,
    gender: v.gender, category: v.category, sub: v.sub?.trim() || null,
    kind: v.kind, status: v.status,
    description: v.long_description || null,
    size_guide: v.size_guide,
  };
  await upsertProduct(input);

  await upsertMeta({
    product_slug: v.slug,
    is_featured: v.is_featured === "on" ? 1 : 0,
    is_trending: v.is_trending === "on" ? 1 : 0,
    is_new_arrival: v.is_new_arrival === "on" ? 1 : 0,
    is_premium: v.is_premium === "on" ? 1 : 0,
    short_description: v.short_description,
    long_description: v.long_description,
    meta_title: v.meta_title,
    meta_description: v.meta_description,
    og_image_path: v.og_image_path,
  });

  if (!exists) {
    await setInventory(v.slug, splitLines(v.sizes).map((s) => ({ size: s, stock: 6, oos_flag: 0 })));
  }

  await logAudit({
    user_id: me.id,
    action: exists ? "update_product" : "create_product",
    entity: "product", entity_id: v.slug,
  });

  revalidatePath("/studio/products");
  revalidatePath(`/studio/products/${v.slug}`);
  revalidatePath("/");
  revalidatePath(`/products/${v.slug}`);
  bustProducts(); // also busts the stock map (tagged "products")
  redirect(`/studio/products/${v.slug}?saved=1`);
}

export async function deleteProductAction(fd: FormData): Promise<void> {
  const me = await requireUser("/studio/login");
  const slug = String(fd.get("slug") ?? "");
  if (!slug) return;
  await deleteProduct(slug);
  await logAudit({ user_id: me.id, action: "delete_product", entity: "product", entity_id: slug });
  revalidatePath("/studio/products");
  bustProducts();
  redirect("/studio/products?flash=Product%20removed");
}

export async function archiveProductAction(fd: FormData): Promise<void> {
  const me = await requireUser("/studio/login");
  const slug = String(fd.get("slug") ?? "");
  const status = String(fd.get("status") ?? "archived") as "active" | "draft" | "archived";
  if (!slug) return;
  await setStatus(slug, status);
  await logAudit({ user_id: me.id, action: "set_product_status", entity: "product", entity_id: slug, payload: { status } });
  revalidatePath("/studio/products");
  revalidatePath(`/studio/products/${slug}`);
  bustProducts();
}

export async function duplicateProductAction(fd: FormData): Promise<void> {
  const me = await requireUser("/studio/login");
  const slug = String(fd.get("slug") ?? "");
  if (!slug) return;
  const src = await getProduct(slug);
  if (!src) return;
  let newSlug = `${slug}-copy`;
  let n = 2;
  while (await getProduct(newSlug)) {
    newSlug = `${slug}-copy-${n++}`;
  }
  await upsertProduct({
    slug: newSlug,
    name: `${src.name} (Copy)`,
    cat: src.cat, cat_link: src.cat_link,
    price: src.price, sale_price: src.sale_price ?? null,
    line: src.line, sizes: src.sizes, features: src.features, spec: src.spec,
    note: src.note, fit: src.fit, fabric: src.fabric, occasion: src.occasion,
    badge: src.badge, gender: src.gender, category: src.category, sub: src.sub,
    kind: src.kind, status: "draft", description: src.description,
    size_guide: src.size_guide,
  });
  const meta = await getMeta(slug);
  await upsertMeta({ ...meta, product_slug: newSlug });
  await logAudit({ user_id: me.id, action: "duplicate_product", entity: "product", entity_id: newSlug, payload: { src: slug } });
  revalidatePath("/studio/products");
  bustProducts();
  redirect(`/studio/products/${newSlug}?flash=Duplicate%20created`);
}

// — Image manager actions —

export async function attachImageAction(fd: FormData): Promise<void> {
  const me = await requireUser("/studio/login");
  const slug = String(fd.get("slug") ?? "");
  const imagePath = String(fd.get("image_path") ?? "");
  const alt = String(fd.get("alt") ?? "");
  if (!slug || !imagePath) return;
  const id = await addImage(slug, imagePath, alt);
  await logAudit({ user_id: me.id, action: "attach_image", entity: "product", entity_id: slug, payload: { id, imagePath } });
  revalidatePath(`/studio/products/${slug}`);
  bustProducts();
}

export async function deleteImageAction(fd: FormData): Promise<void> {
  const me = await requireUser("/studio/login");
  const id = Number(fd.get("id") ?? 0);
  const slug = String(fd.get("slug") ?? "");
  if (!id || !slug) return;
  await deleteProductImage(id, slug);
  await logAudit({ user_id: me.id, action: "delete_image", entity: "product", entity_id: slug, payload: { id } });
  revalidatePath(`/studio/products/${slug}`);
  bustProducts();
}

export async function reorderImagesAction(fd: FormData): Promise<void> {
  await requireUser("/studio/login");
  const slug = String(fd.get("slug") ?? "");
  const ordered = String(fd.get("ordered") ?? "").split(",").map((n) => Number(n)).filter(Boolean);
  if (!slug || !ordered.length) return;
  await reorderImages(slug, ordered);
  revalidatePath(`/studio/products/${slug}`);
  bustProducts();
}

export async function setThumbnailAction(fd: FormData): Promise<void> {
  await requireUser("/studio/login");
  const slug = String(fd.get("slug") ?? "");
  const id = Number(fd.get("id") ?? 0);
  if (!slug || !id) return;
  await setThumbnail(slug, id);
  revalidatePath(`/studio/products/${slug}`);
  bustProducts();
}

export async function setHoverAction(fd: FormData): Promise<void> {
  await requireUser("/studio/login");
  const slug = String(fd.get("slug") ?? "");
  const id = Number(fd.get("id") ?? 0);
  if (!slug || !id) return;
  await setHover(slug, id);
  revalidatePath(`/studio/products/${slug}`);
  bustProducts();
}

export async function updateAltAction(fd: FormData): Promise<void> {
  const me = await requireUser("/studio/login");
  const id = Number(fd.get("id") ?? 0);
  const alt = String(fd.get("alt") ?? "").slice(0, 300);
  const slug = String(fd.get("slug") ?? "");
  if (!id || !slug) return;
  await updateAlt(id, alt, slug);
  await logAudit({ user_id: me.id, action: "update_image_alt", entity: "product", entity_id: slug, payload: { id } });
}

// — Product colour actions —

import {
  createColour, updateColour, deleteColour, reorderColours,
} from "../../../lib/admin/repos/product-colours";

const ColourSchema = z.object({
  product_slug: z.string().min(1),
  colour_id: z.string().optional(),
  name: z.string().min(1).max(60),
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  is_default: z.string().optional(),
});

export async function saveProductColourAction(fd: FormData): Promise<void> {
  const me = await requireUser("/studio/login");
  const raw = Object.fromEntries(fd.entries()) as Record<string, string>;
  const v = ColourSchema.parse(raw);
  const isDefault = v.is_default === "on" ? 1 : 0;

  if (v.colour_id) {
    await updateColour(Number(v.colour_id), { name: v.name, hex: v.hex, is_default: isDefault });
    await logAudit({ user_id: me.id, action: "update_colour", entity: "product", entity_id: v.product_slug, payload: { colour_id: v.colour_id } });
  } else {
    const id = await createColour({ product_slug: v.product_slug, name: v.name, hex: v.hex, is_default: isDefault });
    await logAudit({ user_id: me.id, action: "create_colour", entity: "product", entity_id: v.product_slug, payload: { id } });
  }
  revalidatePath(`/studio/products/${v.product_slug}`);
  bustProducts();
}

export async function deleteProductColourAction(fd: FormData): Promise<void> {
  const me = await requireUser("/studio/login");
  const slug = String(fd.get("product_slug") ?? "");
  const colourId = Number(fd.get("colour_id") ?? 0);
  if (!slug || !colourId) return;
  await deleteColour(colourId);
  await logAudit({ user_id: me.id, action: "delete_colour", entity: "product", entity_id: slug, payload: { colourId } });
  revalidatePath(`/studio/products/${slug}`);
  bustProducts();
}

export async function reorderProductColoursAction(fd: FormData): Promise<void> {
  await requireUser("/studio/login");
  const slug = String(fd.get("product_slug") ?? "");
  const ordered: number[] = JSON.parse(String(fd.get("ordered_ids") ?? "[]"));
  if (!slug || !ordered.length) return;
  await reorderColours(slug, ordered);
  revalidatePath(`/studio/products/${slug}`);
  bustProducts();
}

export async function assignImageColourAction(fd: FormData): Promise<void> {
  const me = await requireUser("/studio/login");
  const slug = String(fd.get("product_slug") ?? "");
  const imageId = Number(fd.get("image_id") ?? 0);
  const colourId = String(fd.get("colour_id") ?? "");
  if (!slug || !imageId) return;
  await assignImageColour(imageId, slug, colourId ? Number(colourId) : null);
  await logAudit({ user_id: me.id, action: "assign_image_colour", entity: "product", entity_id: slug, payload: { imageId, colourId: colourId || null } });
  revalidatePath(`/studio/products/${slug}`);
  bustProducts();
}

