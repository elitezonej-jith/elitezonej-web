"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireCustomer } from "../../lib/storefront/session";
import {
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../../lib/admin/repos/addresses";
import { logAudit } from "../../lib/admin/repos/audit";

// Same address field rules as the authoritative checkout CheckoutSchema —
// one source of truth for what a valid shipping address is.
const AddressSchema = z.object({
  label: z.string().max(60).optional().default(""),
  first_name: z.string().min(1, "First name is required").max(60),
  last_name: z.string().min(1, "Last name is required").max(60),
  line1: z.string().trim().min(1, "Enter your address").max(200),
  line2: z.string().max(200).optional().default(""),
  city: z.string().min(1, "City is required").max(80),
  state: z.string().min(1, "State is required").max(80),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  country: z.string().max(60).optional().default("India"),
});

export type AddressActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Partial<Record<keyof typeof AddressSchema.shape, string>>;
};

const idOf = z.coerce.number().int().positive();

function parseAddress(fd: FormData) {
  return AddressSchema.safeParse({
    label: fd.get("label") ?? "",
    first_name: fd.get("first_name") ?? "",
    last_name: fd.get("last_name") ?? "",
    line1: fd.get("line1") ?? "",
    line2: fd.get("line2") ?? "",
    city: fd.get("city") ?? "",
    state: fd.get("state") ?? "",
    pincode: fd.get("pincode") ?? "",
    country: fd.get("country") ?? "India",
  });
}

function shapeErrors(err: z.ZodError): AddressActionState {
  const flat = z.flattenError(err);
  const fieldErrors = Object.fromEntries(
    Object.entries(flat.fieldErrors).map(([k, msgs]) => [
      k,
      (msgs as string[] | undefined)?.[0] ?? "",
    ]),
  ) as Partial<Record<keyof typeof AddressSchema.shape, string>>;
  return {
    error: err.issues[0]?.message ?? "Please check the form.",
    fieldErrors,
  };
}

export async function createAddressAction(
  _prev: AddressActionState,
  fd: FormData,
): Promise<AddressActionState> {
  const me = await requireCustomer();
  const parsed = parseAddress(fd);
  if (!parsed.success) return shapeErrors(parsed.error);
  const makeDefault = fd.get("set_default") === "1";
  const id = createAddress(me.id, parsed.data, makeDefault);
  logAudit({
    user_id: null,
    action: "customer_address_create",
    entity: "address",
    entity_id: String(id),
  });
  revalidatePath("/account");
  return { ok: true };
}

export async function updateAddressAction(
  _prev: AddressActionState,
  fd: FormData,
): Promise<AddressActionState> {
  const me = await requireCustomer();
  const addressId = idOf.safeParse(fd.get("address_id"));
  if (!addressId.success) return { error: "Address not found." };
  const parsed = parseAddress(fd);
  if (!parsed.success) return shapeErrors(parsed.error);
  // Ownership is enforced in the WHERE clause: a foreign id changes 0 rows.
  if (!updateAddress(addressId.data, me.id, parsed.data)) {
    return { error: "Address not found." };
  }
  logAudit({
    user_id: null,
    action: "customer_address_update",
    entity: "address",
    entity_id: String(addressId.data),
  });
  revalidatePath("/account");
  return { ok: true };
}

export async function deleteAddressAction(
  _prev: AddressActionState,
  fd: FormData,
): Promise<AddressActionState> {
  const me = await requireCustomer();
  const addressId = idOf.safeParse(fd.get("address_id"));
  if (!addressId.success) return { error: "Address not found." };
  if (!deleteAddress(addressId.data, me.id)) {
    return { error: "Address not found." };
  }
  logAudit({
    user_id: null,
    action: "customer_address_delete",
    entity: "address",
    entity_id: String(addressId.data),
  });
  revalidatePath("/account");
  return { ok: true };
}

export async function setDefaultAddressAction(
  _prev: AddressActionState,
  fd: FormData,
): Promise<AddressActionState> {
  const me = await requireCustomer();
  const addressId = idOf.safeParse(fd.get("address_id"));
  if (!addressId.success) return { error: "Address not found." };
  if (!setDefaultAddress(addressId.data, me.id)) {
    return { error: "Address not found." };
  }
  logAudit({
    user_id: null,
    action: "customer_address_set_default",
    entity: "address",
    entity_id: String(addressId.data),
  });
  revalidatePath("/account");
  return { ok: true };
}
