"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole, requireUser } from "../../../lib/admin/session";
import {
  createBlock, deleteBlock, getBlock, reorderBlocks, updateBlock,
  type HomepageBlockType,
} from "../../../lib/admin/repos/homepage";
import { logAudit } from "../../../lib/admin/repos/audit";

const VALID_TYPES: HomepageBlockType[] = [
  "hero_grid","hero_banner","banner_carousel","product_carousel",
  "editorial_split","service_cards","process_strip","full_banner",
  "trust_strip","wedding_editorial","bespoke_teaser","category_grid","custom_html",
];

const NewBlockSchema = z.object({
  type: z.string().refine((v) => VALID_TYPES.includes(v as HomepageBlockType)),
  title: z.string().max(160).default(""),
});

export async function addBlockAction(fd: FormData): Promise<void> {
  const parsed = NewBlockSchema.safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return;
  // Raw-HTML blocks are an XSS-sensitive surface — owner only.
  const me = parsed.data.type === "custom_html"
    ? await requireRole("owner")
    : await requireUser("/studio/login");
  const id = createBlock({
    type: parsed.data.type as HomepageBlockType,
    title: parsed.data.title,
    config: defaultConfigFor(parsed.data.type as HomepageBlockType),
  });
  logAudit({ user_id: me.id, action: "create_block", entity: "homepage_block", entity_id: String(id), payload: { type: parsed.data.type } });
  revalidatePath("/studio/homepage");
  revalidatePath("/");
  redirect(`/studio/homepage/${id}`);
}

export async function deleteBlockAction(fd: FormData): Promise<void> {
  const me = await requireUser("/studio/login");
  const id = Number(fd.get("id") ?? 0);
  if (!id) return;
  deleteBlock(id);
  logAudit({ user_id: me.id, action: "delete_block", entity: "homepage_block", entity_id: String(id) });
  revalidatePath("/studio/homepage");
  revalidatePath("/");
  redirect("/studio/homepage?flash=Section%20removed");
}

export async function toggleBlockAction(fd: FormData): Promise<void> {
  const me = await requireUser("/studio/login");
  const id = Number(fd.get("id") ?? 0);
  const enabled = String(fd.get("enabled") ?? "0") === "1" ? 1 : 0;
  if (!id) return;
  updateBlock(id, { enabled });
  logAudit({ user_id: me.id, action: "toggle_home_block", entity: "home_block", entity_id: String(id), payload: { enabled } });
  revalidatePath("/studio/homepage");
  revalidatePath("/");
}

export async function reorderBlocksAction(fd: FormData): Promise<void> {
  await requireUser("/studio/login");
  const ordered = String(fd.get("ordered") ?? "").split(",").map((n) => Number(n)).filter(Boolean);
  if (!ordered.length) return;
  reorderBlocks(ordered);
  revalidatePath("/studio/homepage");
  revalidatePath("/");
}

export async function saveBlockConfigAction(fd: FormData): Promise<void> {
  const id = Number(fd.get("id") ?? 0);
  if (!id) return;
  // Editing a raw-HTML block is owner-only (XSS-sensitive).
  const existing = getBlock(id);
  const me = existing?.type === "custom_html"
    ? await requireRole("owner")
    : await requireUser("/studio/login");
  const title = String(fd.get("title") ?? "");
  const kicker = String(fd.get("kicker") ?? "");
  const configRaw = String(fd.get("config_json") ?? "{}");
  let config: Record<string, unknown> = {};
  try { config = JSON.parse(configRaw); } catch { /* keep empty */ }
  updateBlock(id, { title, kicker, config });
  logAudit({ user_id: me.id, action: "update_block", entity: "homepage_block", entity_id: String(id) });
  revalidatePath(`/studio/homepage/${id}`);
  revalidatePath("/studio/homepage");
  revalidatePath("/");
  redirect(`/studio/homepage/${id}?saved=1`);
}

function defaultConfigFor(type: HomepageBlockType): Record<string, unknown> {
  switch (type) {
    case "hero_grid":
      return { tiles: [
        { kicker: "Premium", title: "The Heritage Edit", body: "", image: "", href: "", cta: "Shop the edit" },
      ] };
    case "hero_banner":
    case "full_banner":
      return { image: "", headline: "", body: "", cta: { label: "Shop now", href: "" } };
    case "product_carousel":
      return { filter: { kind: "tailored", status: "active", limit: 6 }, cta: { label: "View all", href: "/collection" } };
    case "editorial_split":
      return { image: "", headline: "", body: "", link: { label: "", href: "" }, align: "left" };
    case "service_cards":
      return { cards: [
        { kicker: "Service", title: "Bespoke Suit", body: "", image: "", cta: "Begin", href: "/bespoke" },
      ] };
    case "process_strip":
      return { steps: [
        { kicker: "Step one", title: "Choose your cloth.", body: "", image: "" },
      ] };
    case "trust_strip":
      return { items: [{ kicker: "01", label: "Free shipping over ₹5,000" }] };
    case "wedding_editorial":
      return { image: "", headline: "The Wedding Wardrobe", body: "", cta: { label: "Shop Festive", href: "/collection?c=festive" } };
    case "bespoke_teaser":
      return { headline: "From sketch to fitting in seven days.", body: "", cta: { label: "Begin a fitting", href: "/bespoke" } };
    case "category_grid":
      return { categories: [] };
    case "banner_carousel":
      return { autoplay_seconds: 6 };
    case "custom_html":
      return { html: "<p>Your custom HTML here</p>" };
    default:
      return {};
  }
}
