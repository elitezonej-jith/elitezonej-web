"use server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { createBooking, setBookingStatus, deleteBooking, type BookingInput } from "../../../lib/admin/repos/bookings";
import { logAudit } from "../../../lib/admin/repos/audit";
import { requireUser } from "../../../lib/admin/session";
import { rateLimit } from "../../../lib/admin/rate-limit";

const PublicBookingSchema = z.object({
  first_name: z.string().min(1, "First name required").max(60),
  last_name: z.string().min(1, "Last name required").max(60),
  phone: z.string().min(6, "Phone required").max(40),
  email: z.string().email().optional().or(z.literal("")),
  city: z.string().min(1, "Choose a city").max(80),
  service: z.string().min(1, "Choose a service").max(80),
  message: z.string().max(2000).optional(),
});

export type PublicBookingState = { ok?: boolean; error?: string };

// Called from the PUBLIC /bespoke form. No auth required.
export async function submitBespokeBooking(_prev: PublicBookingState, fd: FormData): Promise<PublicBookingState> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  // Max 5 bookings per IP per hour — generous for real users, throttles spam.
  const rl = rateLimit(`booking:${ip}`, 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return { error: "You've sent several requests already. Please WhatsApp us or try again later." };
  }

  const parsed = PublicBookingSchema.safeParse({
    first_name: fd.get("first_name") ?? fd.get("first") ?? "",
    last_name:  fd.get("last_name")  ?? fd.get("last")  ?? "",
    phone:      fd.get("phone") ?? "",
    email:      fd.get("email") ?? undefined,
    city:       fd.get("city") ?? "",
    service:    fd.get("service") ?? "",
    message:    fd.get("message") ?? undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please fill the form." };

  const input: BookingInput = {
    first_name: parsed.data.first_name,
    last_name: parsed.data.last_name,
    phone: parsed.data.phone,
    email: parsed.data.email || null,
    city: parsed.data.city,
    service: parsed.data.service,
    message: parsed.data.message || null,
    source: "web",
  };

  const id = await createBooking(input);
  await logAudit({ user_id: null, action: "create_booking", entity: "booking", entity_id: String(id), payload: { service: input.service, city: input.city } });
  revalidatePath("/admin/bespoke");
  return { ok: true };
}

export async function setBookingStatusAction(fd: FormData): Promise<void> {
  const me = await requireUser();
  const id = Number(fd.get("id") ?? 0);
  const STATUSES = ["new", "contacted", "scheduled", "done", "closed"] as const;
  const raw = String(fd.get("status") ?? "new");
  if (!id || !(STATUSES as readonly string[]).includes(raw)) return;
  const status = raw as (typeof STATUSES)[number];
  await setBookingStatus(id, status);
  await logAudit({ user_id: me.id, action: "set_booking_status", entity: "booking", entity_id: String(id), payload: { status } });
  revalidatePath("/admin/bespoke");
  revalidatePath(`/admin/bespoke/${id}`);
}

export async function deleteBookingAction(fd: FormData): Promise<void> {
  const me = await requireUser();
  const id = Number(fd.get("id") ?? 0);
  if (!id) return;
  await deleteBooking(id);
  await logAudit({ user_id: me.id, action: "delete_booking", entity: "booking", entity_id: String(id) });
  revalidatePath("/admin/bespoke");
}
