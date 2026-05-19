import "server-only";
import {
  razorpayConfigured,
  createRazorpayOrder,
  publicKeyId,
} from "./razorpay";
import { isDurablePersistence } from "../../admin/db";

export type ProviderName = "razorpay" | "offline";

/**
 * Razorpay when fully configured, otherwise an `offline` mode that still
 * persists orders (as pending) so dev/preview environments and a no-keys
 * launch keep working with manual confirmation.
 */
export function activeProvider(): ProviderName {
  return razorpayConfigured() ? "razorpay" : "offline";
}

export type CreatedProviderOrder = {
  provider: ProviderName;
  providerOrderId: string | null;
  publicKey?: string;
};

export async function createProviderOrder(args: {
  amount: number;
  receipt: string;
}): Promise<CreatedProviderOrder> {
  if (activeProvider() === "razorpay") {
    // Gate (RF-7): only take a real payment when a durable Postgres database
    // is confirmed reachable. Fail-closed — any probe failure keeps live
    // payments disabled rather than risk money the system can't durably
    // record. Replaces the old VERCEL-keyed ephemeral hard-disable.
    if (!(await isDurablePersistence())) {
      throw new Error(
        "Live payments are disabled: a durable database is not confirmed. " +
          "Set DB_DRIVER=postgres with a reachable DATABASE_URL before accepting real payments.",
      );
    }
    const o = await createRazorpayOrder(args);
    return { provider: "razorpay", providerOrderId: o.id, publicKey: publicKeyId() };
  }
  return { provider: "offline", providerOrderId: null };
}

export { verifyCheckoutSignature, verifyWebhookSignature } from "./razorpay";
