import Header from "../components/Header";
import Footer from "../components/Footer";
import TrustStrip from "../components/TrustStrip";
import CheckoutClient from "./CheckoutClient";
import { getCurrentCustomer } from "../../lib/storefront/session";
import { listAddressesForCustomer } from "../../lib/admin/repos/addresses";

export const metadata = { title: "Checkout — Elite Zone J" };

// Checkout is open to guests — getCurrentCustomer (not requireCustomer) so the
// guest path is untouched; the picker only renders when there are addresses.
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const me = await getCurrentCustomer();
  const savedAddresses = me ? listAddressesForCustomer(me.id) : [];
  const defaultAddressId =
    savedAddresses.find((a) => a.is_default === 1)?.id ?? null;

  return (
    <>
      <Header />
      <CheckoutClient
        savedAddresses={savedAddresses}
        defaultAddressId={defaultAddressId}
      />
      <TrustStrip />
      <Footer />
    </>
  );
}
