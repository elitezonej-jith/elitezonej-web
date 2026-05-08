"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "../../../lib/admin/session";
import { upsertFabricMeta, setFabricColours } from "../../../lib/admin/repos/fabrics";
import { logAudit } from "../../../lib/admin/repos/audit";

const MetaSchema = z.object({
  slug: z.string().min(2),
  width_inches: z.coerce.number().int().min(0).max(120),
  gsm: z.coerce.number().int().min(0).max(2000),
  composition: z.string().max(160).default(""),
  care: z.string().max(200).default(""),
  origin: z.string().max(160).default(""),
  stock_meters_total: z.coerce.number().int().min(0),
});

export async function saveFabricMetaAction(fd: FormData): Promise<void> {
  const me = await requireUser();
  const parsed = MetaSchema.safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return;
  const { slug, ...meta } = parsed.data;
  upsertFabricMeta(slug, meta);
  logAudit({ user_id: me.id, action: "save_fabric_meta", entity: "fabric", entity_id: slug });
  revalidatePath(`/admin/fabrics/${slug}`);
}

export async function saveFabricColoursAction(fd: FormData): Promise<void> {
  const me = await requireUser();
  const slug = String(fd.get("slug") ?? "");
  if (!slug) return;
  const names = fd.getAll("name").map(String);
  const hexes = fd.getAll("hex").map(String);
  const stocks = fd.getAll("stock_meters").map((v) => Math.max(0, Math.round(Number(v) || 0)));
  const dirs = fd.getAll("image_dir").map((v) => String(v) || null);

  const colours = names
    .map((n, i) => ({
      name: n,
      hex: hexes[i] ?? "#000000",
      stock_meters: stocks[i] ?? 0,
      image_dir: dirs[i],
    }))
    .filter((c) => c.name.trim().length > 0);

  setFabricColours(slug, colours);
  logAudit({ user_id: me.id, action: "save_fabric_colours", entity: "fabric", entity_id: slug, payload: { count: colours.length } });
  revalidatePath(`/admin/fabrics/${slug}`);
}
