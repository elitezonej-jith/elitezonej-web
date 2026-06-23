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
  const savedAddresses = me ? await listAddressesForCustomer(me.id) : [];
  const defaultAddressId =
    savedAddresses.find((a) => a.is_default === 1)?.id ?? null;

  // Pass customer profile for prefilling email/phone/name when logged in
  const customerPrefill = me
    ? { email: me.email, phone: me.phone ?? "", first_name: me.first_name, last_name: me.last_name, city: me.city ?? "" }
    : null;

  return (
    <>
      <Header />
      <main>
        <CheckoutClient
          savedAddresses={savedAddresses}
          defaultAddressId={defaultAddressId}
          customerPrefill={customerPrefill}
        />
      </main>
      <TrustStrip />
      <Footer />
    </>
  );
}
