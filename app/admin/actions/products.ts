"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "../../../lib/admin/session";
import {
  upsertProduct, deleteProduct, setStatus, getProduct, setInventory, type ProductInput,
} from "../../../lib/admin/repos/products";
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
});

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
  };

  const exists = !!getProduct(v.slug);
  upsertProduct(input);
  logAudit({
    user_id: me.id,
    action: exists ? "update_product" : "create_product",
    entity: "product",
    entity_id: v.slug,
  });

  // Re-derive default inventory rows for any new sizes that have no row yet.
  // (Keeps existing stock untouched on edit; on create gives sensible defaults.)
  if (!exists) {
    setInventory(
      v.slug,
      input.sizes.map((s) => ({ size: s, stock: 6, oos_flag: 0 })),
    );
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${v.slug}`);
  redirect(`/admin/products/${v.slug}?saved=1`);
}

export async function setProductStatusAction(fd: FormData): Promise<void> {
  const me = await requireUser();
  const slug = String(fd.get("slug") ?? "");
  const STATUSES = ["active", "draft", "archived"] as const;
  const raw = String(fd.get("status") ?? "active");
  if (!slug || !(STATUSES as readonly string[]).includes(raw)) return;
  const status = raw as (typeof STATUSES)[number];
  setStatus(slug, status);
  logAudit({ user_id: me.id, action: "set_product_status", entity: "product", entity_id: slug, payload: { status } });
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${slug}`);
}

export async function deleteProductAction(fd: FormData): Promise<void> {
  const me = await requireUser();
  const slug = String(fd.get("slug") ?? "");
  if (!slug) return;
  deleteProduct(slug);
  logAudit({ user_id: me.id, action: "delete_product", entity: "product", entity_id: slug });
  revalidatePath("/admin/products");
  revalidatePath(`/products/${slug}`);
  revalidatePath("/collection");
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
  setInventory(slug, rows);
  logAudit({ user_id: me.id, action: "set_inventory", entity: "product", entity_id: slug, payload: { rows } });
  revalidatePath(`/admin/products/${slug}`);
  revalidatePath("/admin/inventory");
}
