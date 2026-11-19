import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import { ConditionalFooter } from "@/components/layout/conditional-footer";
import { ScrollJump } from "@/components/layout/scroll-jump";
import { ConditionalNavbar } from "@/components/layout/conditional-navbar";
import { ConditionalMarketTicker } from "@/components/market/conditional-market-ticker";
import { MarketTicker } from "@/components/market/market-ticker";
import { Providers } from "@/components/providers";
import { BodyThemeSync } from "@/components/layout/body-theme-sync";
import { getPublicTenantId } from "@/lib/public-tenant";
import { getTenantBrandOverride } from "@/lib/white-label-store";
import "./globals.css";

// Inter is the primary UI typeface for the redesigned design system.
const sans = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

// Cormorant Garamond is the serif display face for headings (elegant, premium
// real-estate look). Italic is used for accent words inside headings.
const display = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "PlotsnHomes",
  description:
    "Browse verified properties, run investment calculators, and transact securely with PlotsnHomes.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // White-label: brand the public chrome for the visited tenant when they've
  // configured their own profile; otherwise the default platform brand shows.
  let brand: { companyName?: string; logoUrl?: string } | null = null;
  try {
    const override = await getTenantBrandOverride(await getPublicTenantId());
    if (override) {
      brand = {
        companyName: override.companyName || undefined,
        logoUrl: override.logoUrl && override.logoUrl !== "/logo.png" ? override.logoUrl : undefined,
      };
    }
  } catch {
    /* fall back to default brand */
  }

  return (
    <html lang="en">
      <body className={`${sans.variable} ${display.variable} font-sans antialiased`}>
        <Providers>
          <BodyThemeSync theme="light" />
          <ConditionalMarketTicker>
            <MarketTicker />
          </ConditionalMarketTicker>
          <ConditionalNavbar brandName={brand?.companyName} logoUrl={brand?.logoUrl} />
          <main className="min-h-screen">{children}</main>
          <ConditionalFooter />
          <ScrollJump />
        </Providers>
      </body>
    </html>
  );
}
