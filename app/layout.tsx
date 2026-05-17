import type { Metadata } from "next";
import "./globals.css";
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
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Pirata+One&family=Roboto:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LoadingCurtain />
        <HeaderScrollHook />
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
