import Header from "../components/Header";
import Footer from "../components/Footer";
import TrustStrip from "../components/TrustStrip";
import CheckoutClient from "./CheckoutClient";

export const metadata = { title: "Checkout — Elite Zone J" };

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <CheckoutClient />
      <TrustStrip />
      <Footer />
    </>
  );
}
