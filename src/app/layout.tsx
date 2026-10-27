import type { Metadata, Viewport } from "next";
import { siteUrl } from "@/lib/site";
import localFont from "next/font/local";
import "./globals.css";

const scriptFont = localFont({ src: "../../public/images/great-vibes-latin.woff2", variable: "--font-script", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Dulmi & Isuru | Wedding Invitation", template: "%s | Dulmi & Isuru" },
  description: "With love, we invite you to celebrate the wedding of Dulmi & Isuru. 23 November 2026.",
  openGraph: {
    type: "website",
    locale: "en_LK",
    siteName: "Dulmi & Isuru",
    title: "Dulmi & Isuru | Wedding Invitation",
    description: "A little envelope, a very special invitation. 23 November 2026.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Dulmi & Isuru. Wedding Invitation. 23 November 2026." }],
  },
  twitter: { card: "summary_large_image", title: "Dulmi & Isuru | Wedding Invitation", images: ["/opengraph-image"] },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f8f6f0" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={scriptFont.variable}><body>{children}</body></html>;
}
