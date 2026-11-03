import HomepageRenderer from "./components/storefront/HomepageRenderer";
import "./styles/home.css";

// ISR: the homepage is served from Vercel's edge cache (in India for Indian
// visitors) instead of being rendered in the US on every visit. It refreshes
// in the background at most every 60 s, and every /studio save that affects
// it already calls revalidatePath("/") / updateTag("homepage"), so edits
// still show up straight away. Nothing on this page reads cookies or
// headers; per-visitor UI (cart, wishlist) is client-side.
// Needs the build to reach the database (it prerenders "/" once at build).
export const revalidate = 60;

export default function Home() {
  return <HomepageRenderer />;
}
