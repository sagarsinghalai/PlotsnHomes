import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ConditionalFooter } from "@/components/layout/conditional-footer";
import { ConditionalNavbar } from "@/components/layout/conditional-navbar";
import { ConditionalMarketTicker } from "@/components/market/conditional-market-ticker";
import { MarketTicker } from "@/components/market/market-ticker";
import { Providers } from "@/components/providers";
import { BodyThemeSync } from "@/components/layout/body-theme-sync";
import "./globals.css";

// Inter is the primary UI typeface for the redesigned design system.
const sans = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const display = Inter({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "PlotsnHomes",
  description:
    "Browse verified properties, run investment calculators, and transact securely with PlotsnHomes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${display.variable} font-sans antialiased`}>
        <Providers>
          <BodyThemeSync theme="light" />
          <ConditionalMarketTicker>
            <MarketTicker />
          </ConditionalMarketTicker>
          <ConditionalNavbar />
          <main className="min-h-screen">{children}</main>
          <ConditionalFooter />
        </Providers>
      </body>
    </html>
  );
}
