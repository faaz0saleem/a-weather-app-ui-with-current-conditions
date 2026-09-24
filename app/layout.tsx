import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import { BrandStyle } from "@/components/brand/brand-style";
import { DevSwitcher } from "@/components/dev/dev-switcher";
import { Providers } from "@/components/providers/providers";
import { ServiceWorker } from "@/components/providers/service-worker";
import { brand } from "@/config/brand";
import { DEV_TOOLS } from "@/lib/supabase/env";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  axes: ["opsz", "wdth"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: { default: `${brand.name} — ${brand.tagline}`, template: `%s · ${brand.name}` },
  description: `Food delivery in ${brand.area}. ${brand.tagline}`,
  applicationName: brand.name,
  appleWebApp: { capable: true, title: brand.name, statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: brand.colors.light.cream },
    { media: "(prefers-color-scheme: dark)", color: brand.colors.dark.cream },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${bricolage.variable} ${jakarta.variable}`}>
      <head>
        <BrandStyle />
      </head>
      <body className="min-h-dvh">
        <Providers>
          {children}
          {DEV_TOOLS && <DevSwitcher />}
        </Providers>
        <ServiceWorker />
      </body>
    </html>
  );
}
