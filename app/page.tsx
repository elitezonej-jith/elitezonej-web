import HomepageRenderer from "./components/storefront/HomepageRenderer";
import "./styles/home.css";

// ISR: cache rendered HTML for 60s. Studio mutations call revalidatePath("/")
// (see app/studio/actions/homepage.ts) so editor changes still appear within
// a single navigation. Falls back to on-demand render if prerender fails at
// build time (when Vercel build runner can't reach the DB region).
export const revalidate = 60;
export const dynamicParams = true;

export default function Home() {
  return <HomepageRenderer />;
}
