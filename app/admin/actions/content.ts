"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "../../../lib/admin/session";
import { updateHomeSection } from "../../../lib/admin/repos/content";
import { logAudit } from "../../../lib/admin/repos/audit";

// link_href: allow an internal path ("/..."), an absolute http(s) URL, or empty.
const hrefSchema = z
  .string()
  .max(500)
  .refine(
    (v) => v === "" || v.startsWith("/") || /^https?:\/\//i.test(v),
    "Link must be a relative path or an http(s) URL",
  );

const HomeSectionSchema = z.object({
  key: z.string().min(1).max(80),
  title: z.string().max(200),
  kicker: z.string().max(120),
  body: z.string().max(4000),
  image_path: z.string().max(500),
  link_text: z.string().max(120),
  link_href: hrefSchema,
  enabled: z.boolean(),
});

export async function saveHomeSectionAction(fd: FormData): Promise<void> {
  const me = await requireUser();
  const parsed = HomeSectionSchema.safeParse({
    key: String(fd.get("key") ?? ""),
    title: String(fd.get("title") ?? ""),
    kicker: String(fd.get("kicker") ?? ""),
    body: String(fd.get("body") ?? ""),
    image_path: String(fd.get("image_path") ?? ""),
    link_text: String(fd.get("link_text") ?? ""),
    link_href: String(fd.get("link_href") ?? ""),
    enabled: !!fd.get("enabled"),
  });
  if (!parsed.success) return;
  const { key, ...rest } = parsed.data;
  const patch = { ...rest, enabled: rest.enabled ? 1 : 0 };
  updateHomeSection(key, patch);
  logAudit({ user_id: me.id, action: "update_home_section", entity: "home_section", entity_id: key });
  revalidatePath("/admin/content");
}
