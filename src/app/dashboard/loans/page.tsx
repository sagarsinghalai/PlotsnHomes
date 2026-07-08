import { requireAuth } from "@/lib/auth";
import { LoanApplicationForm } from "@/components/dashboard/loan-form";

export const metadata = {
  title: "Loan Application | PlotsnHomes",
  description: "Apply for a property loan — home loan, LAP, construction loan.",
};

export default async function LoansPage() {
  await requireAuth();
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-2xl bg-slate-900 flex items-center justify-center text-xl">🏦</div>
          <div>
            <h1 className="font-bold text-2xl text-slate-900">Property Loan</h1>
            <p className="text-slate-500 text-sm">Apply for financing — get approved in 2–3 business days</p>
          </div>
        </div>
        {/* Feature chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { icon: "📊", label: "Live EMI Calculator" },
            { icon: "🏠", label: "Home, LAP & More" },
            { icon: "👥", label: "Co-Applicant Support" },
            { icon: "📋", label: "Track Application" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5 text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full font-medium">
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
      <LoanApplicationForm />
    </div>
  );
}
