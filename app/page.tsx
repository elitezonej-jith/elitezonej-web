import HomepageRenderer from "./components/storefront/HomepageRenderer";
import "./styles/home.css";

// The homepage is fully data-driven: every section (including the announce
// ticker and promo modal) is a row in `homepage_blocks`, edited/reordered/
// hidden from /studio/homepage. ISR: pre-render at build and refresh every
// 60s in the background. Studio edits show up within ~1 min on production;
// for an immediate refresh after a /studio/homepage save, call
// `revalidatePath("/")` from that action.
export const revalidate = 60;

export default function Home() {
  return <HomepageRenderer />;
}
