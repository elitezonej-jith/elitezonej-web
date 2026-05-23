import Header from "../components/Header";
import Footer from "../components/Footer";
import TrustStrip from "../components/TrustStrip";
import WishlistClient from "./WishlistClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your wishlist — Elite Zone J" };

export default function WishlistPage() {
  return (
    <>
      <Header />
      <main>
        <WishlistClient />
      </main>
      <TrustStrip />
      <Footer />
    </>
  );
}
