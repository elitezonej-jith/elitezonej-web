import HomepageRenderer from "./components/storefront/HomepageRenderer";
import "./styles/home.css";

// Force-dynamic at the page level: the Vercel build can't reach Neon, so
// prerendering "/" (needed for ISR, `revalidate = 60`) fails the build.
// Runtime perf still benefits from the per-fetch `unstable_cache` wrappers
// inside HomepageRenderer (60 s, invalidated by revalidateTag("homepage")).
// To serve "/" from the edge cache instead, give the build access to the DB
// (DATABASE_URL in the Build environment / Neon IP allow-list), then switch
// this back to `export const revalidate = 60`.
export const dynamic = "force-dynamic";

export default function Home() {
  return <HomepageRenderer />;
}
