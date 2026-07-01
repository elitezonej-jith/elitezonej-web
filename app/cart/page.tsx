import Header from "../components/Header";
import Footer from "../components/Footer";
import TrustStrip from "../components/TrustStrip";
import CartClient from "./CartClient";
import { getSiteSettings } from "@/lib/storefront/site-settings";
import { getDeliveryMap } from "@/lib/storefront/delivery";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your bag — Elite Zone J" };

export default async function CartPage() {
  const { leadTimeDays } = await getSiteSettings();
  const deliveryMap = await getDeliveryMap();

  return (
    <>
      <Header />
      <main>
        <CartClient deliveryMap={deliveryMap} globalLeadDays={leadTimeDays} />
      </main>
      <TrustStrip />
      <Footer />
    </>
  );
}
