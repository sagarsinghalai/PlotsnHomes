import { AreaValueCalculator } from "@/components/calculators/area-value-calculator";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const metadata = {
  title: "Area Value Calculator & Unit Converter | PlotsnHomes",
  description:
    "Convert real estate area units (Square Feet, Square Meters, Gaj, Acres, Bigha, Katha, Guntha, Marla) and calculate final price per unit and stage appreciation.",
};

export default function AreaValueCalculatorPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <nav className="mb-3 flex items-center gap-2 text-xs text-slate-500">
            <Link href="/" className="hover:text-[#2563EB]">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/calculators" className="hover:text-[#2563EB]">Insights</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-semibold text-[#2563EB]">Area calculator</span>
          </nav>

          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2563EB]">PlotsnHomes Tools</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Area value calculator
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Convert sq ft, sq m, gaj, acres, bigha and marla, then see price per unit and launch-stage appreciation.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <AreaValueCalculator />
      </div>
    </div>
  );
}
