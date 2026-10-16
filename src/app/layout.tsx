import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { ConditionalFooter } from "@/components/layout/conditional-footer";
import { ConditionalNavbar } from "@/components/layout/conditional-navbar";
import { ConditionalMarketTicker } from "@/components/market/conditional-market-ticker";
import { MarketTicker } from "@/components/market/market-ticker";
import { Providers } from "@/components/providers";
import { BodyThemeSync } from "@/components/layout/body-theme-sync";
import "./globals.css";

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const display = DM_Sans({
  subsets: ["latin"],
  variable: "--font-display",
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
