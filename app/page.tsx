import HomepageRenderer from "./components/storefront/HomepageRenderer";
import "./styles/home.css";

// Force-dynamic at the page level (build-time prerender can't reach Neon
// across regions and would fail). Runtime perf still benefits from the
// per-fetch `unstable_cache` wrappers inside HomepageRenderer — those cache
// the four repo reads for 60s and are invalidated by revalidateTag("homepage")
// from studio actions.
export const dynamic = "force-dynamic";

export default function Home() {
  return <HomepageRenderer />;
}
