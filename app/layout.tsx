import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { BrandStyle, ThemeScript } from "@/components/brand";
import { JsonLd, organizationLd, websiteLd } from "@/components/seo";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { brand } from "@/config/brand";
import { phaseList, site } from "@/config/site";
import "./globals.css";

// Self-hosted (SIL Open Font License): no request to Google at build time or in the visitor's browser.
const bricolage = localFont({ src: "./fonts/bricolage-grotesque.woff2", variable: "--font-bricolage", weight: "200 800", display: "swap" });
const jakarta = localFont({ src: "./fonts/plus-jakarta-sans.woff2", variable: "--font-jakarta", weight: "200 800", display: "swap" });

const description = `Food delivery in DHA Lahore ${phaseList} with a live 30-minute clock on every order. If your rider is late, the order is free.`;

export const metadata: Metadata = {
  metadataBase: new URL(brand.websiteUrl),
  title: { default: `${brand.name}: food delivery in DHA Lahore in 30 minutes, or it's free`, template: `%s | ${brand.name}` },
  description,
  applicationName: brand.name,
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: brand.name, locale: "en_PK", url: "/", title: `${brand.name}: ${brand.tagline}`, description },
  twitter: { card: "summary_large_image", title: `${brand.name}: ${brand.tagline}`, description },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  verification: site.googleVerification ? { google: site.googleVerification } : undefined,
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: brand.colors.light.cream },
    { media: "(prefers-color-scheme: dark)", color: brand.colors.dark.cream },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-PK" suppressHydrationWarning className={`${bricolage.variable} ${jakarta.variable}`}>
      <head>
        <BrandStyle />
        <ThemeScript />
        <JsonLd data={[organizationLd, websiteLd]} />
      </head>
      <body className="min-h-dvh">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-card focus:p-2">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
