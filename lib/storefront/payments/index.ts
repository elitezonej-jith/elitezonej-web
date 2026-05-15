import "server-only";
import {
  razorpayConfigured,
  createRazorpayOrder,
  publicKeyId,
} from "./razorpay";

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
    const o = await createRazorpayOrder(args);
    return { provider: "razorpay", providerOrderId: o.id, publicKey: publicKeyId() };
  }
  return { provider: "offline", providerOrderId: null };
}

export { verifyCheckoutSignature, verifyWebhookSignature } from "./razorpay";
