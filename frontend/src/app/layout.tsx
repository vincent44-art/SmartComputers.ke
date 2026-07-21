import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { CartDrawer } from "@/components/cart/CartDrawer";

import { Providers } from "./providers";
import "./globals.css";

// next/font/google requires outbound network. In some environments builds fail (ETIMEDOUT).
// Fallback to system fonts to keep the app building/running.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });


const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://smartcomputers.ke";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SmartComputers.ke — Premium Laptops, Gaming & Tech in Kenya",
    template: "%s | SmartComputers.ke",
  },
  description:
    "Shop premium laptops, gaming rigs, Apple products, monitors and accessories in Kenya. Fast delivery, genuine warranty and M-Pesa checkout.",
  keywords: [
    "laptops Kenya",
    "gaming laptops Nairobi",
    "MacBook Kenya",
    "computers Kenya",
    "SmartComputers",
  ],
  openGraph: {
    type: "website",
    siteName: "SmartComputers.ke",
    title: "SmartComputers.ke — Premium Tech Retailer",
    description:
      "Premium laptops, gaming, Apple and accessories with fast delivery and M-Pesa checkout.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "SmartComputers.ke — Premium Tech Retailer",
    description:
      "Premium laptops, gaming, Apple and accessories with fast delivery and M-Pesa checkout.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#2563EB",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <AnnouncementBar />
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <CartDrawer />
        </Providers>
      </body>
    </html>
  );
}
