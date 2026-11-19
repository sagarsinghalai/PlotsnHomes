import { InvestmentCalculator } from "@/components/calculators/investment-calculator";

export default function CalculatorsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2563EB]">PlotsnHomes Tools</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Investment calculator</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Mortgage, gross yield, cap rate, and cash-on-cash. Move the sliders to model a deal.
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <InvestmentCalculator />
      </div>
    </div>
  );
}
