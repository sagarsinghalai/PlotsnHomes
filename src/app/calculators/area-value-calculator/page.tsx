import { AreaValueCalculator } from "@/components/calculators/area-value-calculator";
import { BodyThemeSync } from "@/components/layout/body-theme-sync";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const metadata = {
  title: "Area Value Calculator & Unit Converter | PlotsnHomes",
  description:
    "Convert real estate area units (Square Feet, Square Meters, Gaj, Acres, Bigha, Katha, Guntha, Marla) and calculate final price per unit and stage appreciation.",
};

export default function AreaValueCalculatorPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <BodyThemeSync theme="dark" />
      <div className="border-b border-slate-800 bg-slate-900/80">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs text-slate-400 mb-3">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/calculators" className="hover:text-white transition">Calculators</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-brand font-semibold">Area Value Calculator</span>
          </nav>

          <p className="text-xs font-semibold uppercase tracking-widest text-brand">PlotsnHomes Tools</p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
            Area Value Calculator & Unit Converter
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Convert real estate area units instantly (Sq Ft, Sq M, Gaj, Acres, Bigha, Marla), generate full price-per-unit matrix tables, and simulate launch stage price appreciation based on PriceFilters.xlsx formulas.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <AreaValueCalculator />
      </div>
    </div>
  );
}
