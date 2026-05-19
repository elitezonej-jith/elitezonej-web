import Link from "next/link";
import Header from "./components/Header";
import Footer from "./components/Footer";

export const metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="page-404">
        <div className="page-404-inner">
          <div className="page-404-code">404</div>
          <h1>The page you&apos;re looking for has moved on.</h1>
          <p>It may have been renamed, retired, or never existed in the first place.</p>
          <div className="page-404-actions">
            <Link className="btn btn-primary" href="/">Return home</Link>
            <Link className="btn btn-secondary" href="/collection?c=men">Shop menswear</Link>
            <Link className="btn btn-secondary" href="/collection?c=women">Shop womenswear</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
