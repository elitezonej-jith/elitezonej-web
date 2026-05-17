import "server-only";
import {
  razorpayConfigured,
  createRazorpayOrder,
  publicKeyId,
} from "./razorpay";
import { isEphemeralPersistence } from "../../admin/db";

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
    // Guard: never take a real payment when persistence is the ephemeral
    // in-memory fallback — the paid order would be lost on the next cold
    // start. Fail the checkout loudly instead of silently losing money.
    if (isEphemeralPersistence()) {
      throw new Error(
        "Live payments are disabled: server storage is ephemeral (in-memory). " +
          "A durable database must be configured before accepting real payments.",
      );
    }
    const o = await createRazorpayOrder(args);
    return { provider: "razorpay", providerOrderId: o.id, publicKey: publicKeyId() };
  }
  return { provider: "offline", providerOrderId: null };
}

export { verifyCheckoutSignature, verifyWebhookSignature } from "./razorpay";
