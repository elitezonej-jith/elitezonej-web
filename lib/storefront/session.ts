import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CUSTOMER_SESSION_COOKIE, resolveCustomer, type SessionCustomer } from "./auth";

export async function getCurrentCustomer(): Promise<SessionCustomer | null> {
  const c = await cookies();
  return resolveCustomer(c.get(CUSTOMER_SESSION_COOKIE)?.value);
}

export async function requireCustomer(redirectTo = "/login"): Promise<SessionCustomer> {
  const customer = await getCurrentCustomer();
  if (!customer) redirect(redirectTo);
  return customer;
}
