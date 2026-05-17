import type { Metadata } from "next";
import { Libre_Baskerville, Roboto } from "next/font/google";
import "./globals.css";

// Self-hosted via next/font (no render-blocking Google <link>, no
// layout shift, text visible immediately via fallback). Families /
// weights mirror the former
//   css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400
//          &family=Roboto:wght@300;400;500;700
// link. Pirata One was dropped — it is referenced nowhere in the app.
const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--ezj-font-display",
});
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
  variable: "--ezj-font-body",
});
import "./disturbia.css";
import "./styles/page-chrome.css";
import { CartProvider } from "./components/CartProvider";
import { WishlistProvider } from "./components/WishlistProvider";
import HeaderScrollHook from "./components/HeaderScrollHook";
import LoadingCurtain from "./components/LoadingCurtain";
import Toast from "./components/Toast";
import BackToTop from "./components/BackToTop";

const SITE_URL = "https://elitezonej.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Elite Zone J — Premium Tailoring · India",
    template: "%s · Elite Zone J",
  },
  description:
    "Designer-led men's and women's tailoring from India. Suits, sherwanis, lehengas, and bespoke services. Made-to-measure in seven days.",
  keywords: [
    "Indian tailoring", "bespoke suit India", "sherwani", "lehenga",
    "made to measure", "wedding suit", "Delhi tailoring", "men's tailoring",
  ],
  authors: [{ name: "Elite Zone J" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Elite Zone J",
    locale: "en_IN",
    title: "Elite Zone J — Premium Tailoring · India",
    description:
      "Designer-led men's and women's tailoring. Suits, sherwanis, lehengas. Made-to-measure in seven days.",
    images: [
      {
        url: "/generated/_sections/hero.webp",
        width: 1536,
        height: 1024,
        alt: "Elite Zone J — premium tailored three-piece suit",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Elite Zone J — Premium Tailoring · India",
    description: "Made-to-measure in seven days.",
    images: ["/generated/_sections/hero.webp"],
  },
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: {
    icon: [
      { url: "/logo/favicon-32.png",  type: "image/png", sizes: "32x32"  },
      { url: "/logo/favicon-64.png",  type: "image/png", sizes: "64x64"  },
      { url: "/logo/favicon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/logo/favicon-180.png",
    shortcut: "/logo/favicon-32.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${libreBaskerville.variable} ${roboto.variable}`}
      // Inline custom props override disturbia.css :root (loaded after
      // globals.css), so the self-hosted next/font families resolve
      // everywhere `var(--font-display|body)` is used. Fallback chain
      // preserved so text is never invisible while the font loads.
      style={
        {
          "--font-display":
            "var(--ezj-font-display), \"Cormorant Garamond\", Georgia, serif",
          "--font-body":
            "var(--ezj-font-body), -apple-system, \"Helvetica Neue\", sans-serif",
        } as React.CSSProperties
      }
    >
      <body>
        <LoadingCurtain />
        <HeaderScrollHook />
        {/*
          DEV NOTE: React DevTools >=7.0 emits the console error "We are
          cleaning up async info that was not on the parent Suspense
          boundary. This is a bug in React." when installed on React 19.2.
          It originates entirely inside the extension's installHook.js — the
          full call stack lives in chrome-extension://.../build/installHook.js,
          and the string exists nowhere in React/React-DOM/Next 16.2.4. Our
          tree has no <Suspense>/use(Promise) misuse. Disabling the React
          DevTools extension removes the warning; no boundary change is
          needed. Tracked: github.com/vercel/next.js/discussions/84973
        */}
        <WishlistProvider>
          <CartProvider>
            {children}
            <Toast />
            <BackToTop />
          </CartProvider>
        </WishlistProvider>
      </body>
    </html>
  );
}
