import HomepageRenderer from "./components/storefront/HomepageRenderer";
import "./styles/home.css";

// ISR: served from Vercel's edge cache (in India for Indian visitors)
// instead of being rendered in the US on every visit. Refreshes in the
// background at most every 60 s, and /studio saves that affect it call
// revalidatePath("/") / updateTag("homepage"), so edits show straight away.
// Nothing on this page reads cookies or headers; cart/wishlist are client-side.
// The build prerenders "/" once, so DB_DRIVER=postgres + DATABASE_URL must be
// available to the build (they are for Production; Preview lacks DB_DRIVER).
export const revalidate = 60;

export default function Home() {
  return <HomepageRenderer />;
}
