import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { MarketTicker } from "@/components/market/market-ticker";
import { Providers } from "@/components/providers";
import "./globals.css";

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "PlotsnHomes — Premium Real Estate Investment",
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
          <MarketTicker />
          <Navbar />
          <main className="min-h-[calc(100vh-12rem)]">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
