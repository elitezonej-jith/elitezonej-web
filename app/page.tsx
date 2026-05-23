import HomepageRenderer from "./components/storefront/HomepageRenderer";
import "./styles/home.css";

// Temporarily force-dynamic instead of ISR: Vercel build runner (iad1) can't
// reach Neon (ap-southeast-1) fast enough to prerender. Restore
// `export const revalidate = 60` once build-time DB connectivity is fixed.
export const dynamic = "force-dynamic";

export default function Home() {
  return <HomepageRenderer />;
}
