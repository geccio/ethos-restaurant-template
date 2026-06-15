import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "./components/LanguageProvider";
import { CartProvider } from "./components/CartProvider";
import { AnalyticsTracker } from "./components/AnalyticsTracker";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { getSiteInfoSafe } from "@/lib/site-info";
import { restaurant } from "@/data/restaurant";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

// Build the document title, description, and Open Graph image from the
// live Ethos site profile. Falls back to hardcoded values when the API
// is unreachable. Per the build contract §10, every public surface
// pulls metadata from /api/public/site-info.
export async function generateMetadata(): Promise<Metadata> {
  const { data: site } = await getSiteInfoSafe();
  const name = site.info.name ?? restaurant.name;
  const tagline = site.info.tagline?.trim() || restaurant.slogan.es;
  const description =
    site.info.about?.trim() ||
    restaurant.about.es;
  const heroImage = site.info.heroImage ?? restaurant.heroImage;

  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

  return {
    title: `${name} — ${tagline}`,
    description,
    ...(base ? { metadataBase: new URL(base) } : {}),
    openGraph: {
      title: `${name} — ${tagline}`,
      description,
      images: [{ url: heroImage }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} — ${tagline}`,
      description,
      images: [heroImage],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { data: site } = await getSiteInfoSafe();
  const siteName = site.info.name ?? restaurant.name;

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <LanguageProvider>
          <CartProvider>
            <Header siteName={siteName} />
            {children}
            <Footer siteName={siteName} />
          </CartProvider>
        </LanguageProvider>
        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>
      </body>
    </html>
  );
}
