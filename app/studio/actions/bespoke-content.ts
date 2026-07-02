"use server";
import { z } from "zod";
import { requireUser } from "../../../lib/admin/session";
import { setSetting } from "../../../lib/admin/repos/settings";
import { bustSettings } from "../../../lib/storefront/cache";
import { revalidatePath } from "next/cache";

const ServiceSchema = z.object({
  id: z.string().min(1),
  category: z.string().min(1),
  title: z.string().min(1),
  price: z.string().min(1),
  features: z.array(z.string()),
  cta_text: z.string().min(1),
  image_path: z.string().default(""),
});

const StepSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  image_path: z.string().default(""),
});

const TestimonialSchema = z.object({
  id: z.string().min(1),
  quote: z.string().min(1),
  author: z.string().min(1),
  title: z.string().default(""),
});

const ContentSchema = z.object({
  hero: z.object({
    eyebrow: z.string().min(1),
    headline: z.string().min(1),
    subtitle: z.string().min(1),
    lead_time_days: z.number().int().min(1).max(365),
    image_path: z.string().default(""),
  }),
  services: z.array(ServiceSchema).min(1),
  process_steps: z.array(StepSchema).min(1),
  testimonials: z.array(TestimonialSchema),
  booking_services: z.array(z.string().min(1)).min(1),
});

export type BespokeContentState = { error?: string; saved?: boolean };

export async function saveBespokeContentAction(_prev: BespokeContentState, fd: FormData): Promise<BespokeContentState> {
  await requireUser("/studio/login");

  let data: unknown;
  try {
    data = JSON.parse(String(fd.get("payload") ?? "{}"));
  } catch {
    return { error: "Invalid form data." };
  }

  const parsed = ContentSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please review the form." };
  }

  const content = parsed.data;

  // Save as JSON to settings table
  await setSetting("bespoke_content", JSON.stringify(content));

  // Also update the top-level lead_time_days setting for backward compat
  await setSetting("lead_time_days", String(content.hero.lead_time_days));

  // Bust cache so the public page reflects changes immediately
  bustSettings();
  revalidatePath("/bespoke");
  revalidatePath("/studio/bespoke/content");

  return { saved: true };
}
