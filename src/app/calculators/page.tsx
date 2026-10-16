import { InvestmentCalculator } from "@/components/calculators/investment-calculator";
import { BodyThemeSync } from "@/components/layout/body-theme-sync";

export default function CalculatorsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <BodyThemeSync theme="dark" />
      <div className="border-b border-slate-800 bg-slate-900/80">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold">PlotsnHomes Tools</p>
          <h1 className="mt-2 font-display text-4xl font-bold">Investment Calculator</h1>
          <p className="mt-2 text-slate-400">
            Professional-grade formulas: mortgage amortization, gross yield, cap rate, and cash-on-cash return. Adjust sliders to model any deal.
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <InvestmentCalculator />
      </div>
    </div>
  );
}
