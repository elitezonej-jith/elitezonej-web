import HomepageRenderer from "./components/storefront/HomepageRenderer";
import "./styles/home.css";

// The homepage is fully data-driven: every section (including the announce
// ticker and promo modal) is a row in `homepage_blocks`, edited/reordered/
// hidden from /studio/homepage. Because it reads the admin DB at request time
// it must render dynamically — same opt-out the other DB-backed storefront
// pages use (app/collection/page.tsx, app/account/page.tsx).
export const dynamic = "force-dynamic";

export default function Home() {
  return <HomepageRenderer />;
}
