import Header from "../components/Header";
import Footer from "../components/Footer";
import TrustStrip from "../components/TrustStrip";
import WishlistClient from "./WishlistClient";

export const dynamic = "force-dynamic";
// Private page: keep it out of search results.
export const metadata = { title: "Your wishlist", robots: { index: false, follow: true } };

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
