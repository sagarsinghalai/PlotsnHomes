import { InvestmentCalculator } from "@/components/calculators/investment-calculator";

export default function CalculatorsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-bold text-slate-900">Investment calculator</h1>
      <p className="mt-2 max-w-2xl text-slate-600">
        Professional-grade formulas: mortgage amortization, gross yield, cap rate, and cash-on-cash return. Adjust sliders to model any deal.
      </p>
      <div className="mt-10">
        <InvestmentCalculator />
      </div>
    </div>
  );
}
