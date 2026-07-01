"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { bustProducts, bustInventory } from "../../../lib/storefront/cache";
import { z } from "zod";
import { requireUser } from "../../../lib/admin/session";
import {
  upsertProduct, deleteProduct, setStatus, getProduct, setInventory, type ProductInput,
} from "../../../lib/admin/repos/products";
import { createColour, updateColour, deleteColour, reorderColours } from "../../../lib/admin/repos/product-colours";
import { assignImageColour } from "../../../lib/admin/repos/product-images";
import { logAudit } from "../../../lib/admin/repos/audit";

const ProductSchema = z.object({
  slug: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/, "lowercase, digits, dashes only"),
  name: z.string().min(2).max(120),
  cat: z.string().max(160).default(""),
  cat_link: z.enum(["Men", "Women", "Fabrics"]),
  price: z.coerce.number().int().min(0),
  sale_price: z.union([z.literal(""), z.coerce.number().int().min(0)]).optional(),
  line: z.string().max(500).default(""),
  sizes: z.string().default(""),
  features: z.string().default(""),
  spec: z.string().default(""),
  note: z.string().max(2000).default(""),
  fit: z.string().max(40).default(""),
  fabric: z.string().max(40).default(""),
  occasion: z.string().max(40).default(""),
  badge: z.string().max(40).optional(),
  gender: z.enum(["men", "women", "unisex"]),
  category: z.string().max(60).default(""),
  sub: z.string().max(60).optional(),
  kind: z.enum(["tailored", "fabric"]),
  status: z.enum(["active", "draft", "archived"]),
  description: z.string().max(2000).optional(),
  delivery_min_days: z.union([z.literal(""), z.coerce.number().int().min(1).max(60)]).optional(),
  delivery_max_days: z.union([z.literal(""), z.coerce.number().int().min(1).max(60)]).optional(),
}).refine(
  (d) => {
    const min = d.delivery_min_days === "" || d.delivery_min_days === undefined ? null : d.delivery_min_days;
    const max = d.delivery_max_days === "" || d.delivery_max_days === undefined ? null : d.delivery_max_days;
    if (min !== null && max !== null) return max >= min;
    return true;
  },
  { message: "Max delivery days must be ≥ min delivery days", path: ["delivery_max_days"] },
);

function splitLines(raw: string): string[] {
  return raw
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseSpec(raw: string): [string, string][] {
  return splitLines(raw)
    .map((line) => {
      const idx = line.indexOf(":");
      if (idx === -1) return null;
      const k = line.slice(0, idx).trim();
      const v = line.slice(idx + 1).trim();
      return k && v ? ([k, v] as [string, string]) : null;
    })
    .filter(Boolean) as [string, string][];
}

export type ActionState = { error?: string; ok?: boolean };

export async function saveProductAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireUser();
  const raw = Object.fromEntries(fd.entries()) as Record<string, string>;
  const parsed = ProductSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const v = parsed.data;

  const deliveryMin = v.delivery_min_days === "" || v.delivery_min_days === undefined ? null : Number(v.delivery_min_days);
  const deliveryMax = v.delivery_max_days === "" || v.delivery_max_days === undefined ? null : Number(v.delivery_max_days);

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
    note: v.note,
    fit: v.fit,
    fabric: v.fabric,
    occasion: v.occasion,
    badge: v.badge?.trim() || null,
    gender: v.gender,
    category: v.category,
    sub: v.sub?.trim() || null,
    kind: v.kind,
    status: v.status,
    description: v.description?.trim() || null,
    size_guide: "",
    delivery_min_days: deliveryMin,
    delivery_max_days: deliveryMax,
  };

  const exists = !!(await getProduct(v.slug));
  await upsertProduct(input);
  await logAudit({
    user_id: me.id,
    action: exists ? "update_product" : "create_product",
    entity: "product",
    entity_id: v.slug,
  });

  // Re-derive default inventory rows for any new sizes that have no row yet.
  // (Keeps existing stock untouched on edit; on create gives sensible defaults.)
  if (!exists) {
    await setInventory(
      v.slug,
      input.sizes.map((s) => ({ size: s, stock: 6, oos_flag: 0 })),
    );
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${v.slug}`);
  bustProducts(); // also busts the stock map (tagged "products")
  redirect(`/admin/products/${v.slug}?saved=1`);
}

export async function setProductStatusAction(fd: FormData): Promise<void> {
  const me = await requireUser();
  const slug = String(fd.get("slug") ?? "");
  const STATUSES = ["active", "draft", "archived"] as const;
  const raw = String(fd.get("status") ?? "active");
  if (!slug || !(STATUSES as readonly string[]).includes(raw)) return;
  const status = raw as (typeof STATUSES)[number];
  await setStatus(slug, status);
  await logAudit({ user_id: me.id, action: "set_product_status", entity: "product", entity_id: slug, payload: { status } });
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${slug}`);
  bustProducts();
}

export async function deleteProductAction(fd: FormData): Promise<void> {
  const me = await requireUser();
  const slug = String(fd.get("slug") ?? "");
  if (!slug) return;
  await deleteProduct(slug);
  await logAudit({ user_id: me.id, action: "delete_product", entity: "product", entity_id: slug });
  revalidatePath("/admin/products");
  revalidatePath(`/products/${slug}`);
  revalidatePath("/collection");
  bustProducts();
  redirect(`/admin/products?flash=${encodeURIComponent("Product removed")}`);
}

export async function saveInventoryAction(fd: FormData): Promise<void> {
  const me = await requireUser();
  const slug = String(fd.get("slug") ?? "");
  if (!slug) return;
  const sizes = fd.getAll("size").map(String);
  const stocks = fd.getAll("stock").map((v) => Math.max(0, Math.round(Number(v) || 0)));
  const oos = fd.getAll("oos").map((v) => (String(v) === "on" ? 1 : 0));
  const rows = sizes.map((size, i) => ({
    size,
    stock: oos[i] ? 0 : stocks[i] ?? 0,
    oos_flag: oos[i] ?? 0,
  }));
  await setInventory(slug, rows);
  await logAudit({ user_id: me.id, action: "set_inventory", entity: "product", entity_id: slug, payload: { rows } });
  revalidatePath(`/admin/products/${slug}`);
  revalidatePath("/admin/inventory");
  bustInventory();
}

export async function saveProductColourAction(fd: FormData): Promise<void> {
  const me = await requireUser();
  const slug = String(fd.get("product_slug") ?? "");
  const colourId = Number(fd.get("colour_id") || 0);
  const name = String(fd.get("name") ?? "").trim();
  const hex = String(fd.get("hex") ?? "#000000").trim();
  const is_default = fd.get("is_default") === "on" ? 1 : 0;
  if (!slug || !name) return;

  if (colourId) {
    await updateColour(colourId, { name, hex, is_default });
    await logAudit({ user_id: me.id, action: "update_colour", entity: "product", entity_id: slug, payload: { colourId } });
  } else {
    await createColour({ product_slug: slug, name, hex, is_default });
    await logAudit({ user_id: me.id, action: "create_colour", entity: "product", entity_id: slug, payload: { name, hex } });
  }
  revalidatePath(`/admin/products/${slug}`);
}

export async function deleteProductColourAction(fd: FormData): Promise<void> {
  const me = await requireUser();
  const slug = String(fd.get("product_slug") ?? "");
  const colourId = Number(fd.get("colour_id") || 0);
  if (!slug || !colourId) return;
  await deleteColour(colourId);
  await logAudit({ user_id: me.id, action: "delete_colour", entity: "product", entity_id: slug, payload: { colourId } });
  revalidatePath(`/admin/products/${slug}`);
}

export async function reorderProductColoursAction(fd: FormData): Promise<void> {
  await requireUser();
  const slug = String(fd.get("product_slug") ?? "");
  const ordered: number[] = JSON.parse(String(fd.get("ordered_ids") ?? "[]"));
  if (!slug || !ordered.length) return;
  await reorderColours(slug, ordered);
  revalidatePath(`/admin/products/${slug}`);
}

export async function assignImageColourAction(fd: FormData): Promise<void> {
  const me = await requireUser();
  const slug = String(fd.get("product_slug") ?? "");
  const imageId = Number(fd.get("image_id") ?? 0);
  const colourId = String(fd.get("colour_id") ?? "");
  if (!slug || !imageId) return;
  await assignImageColour(imageId, slug, colourId ? Number(colourId) : null);
  await logAudit({ user_id: me.id, action: "assign_image_colour", entity: "product", entity_id: slug, payload: { imageId, colourId: colourId || null } });
  revalidatePath(`/admin/products/${slug}`);
}
