import Header from "../components/Header";
import Footer from "../components/Footer";
import TrustStrip from "../components/TrustStrip";
import CartClient from "./CartClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your bag — Elite Zone J" };

export default function CartPage() {
  return (
    <>
      <Header />
      <main>
        <CartClient />
      </main>
      <TrustStrip />
      <Footer />
    </>
  );
}
