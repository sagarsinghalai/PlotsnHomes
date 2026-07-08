import { requireAuth } from "@/lib/auth";
import { KycForm } from "@/components/dashboard/kyc-form";

export const metadata = {
  title: "KYC Verification | PlotsnHomes",
  description: "Complete your KYC to unlock investments and loan applications.",
};

export default async function KycPage() {
  await requireAuth();
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-2xl bg-slate-900 flex items-center justify-center text-xl">🪪</div>
          <div>
            <h1 className="font-bold text-2xl text-slate-900">KYC Verification</h1>
            <p className="text-slate-500 text-sm">Complete identity verification to unlock investments &amp; loans</p>
          </div>
        </div>
        {/* Steps overview */}
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { icon: "👤", label: "Personal Info" },
            { icon: "📄", label: "Upload Documents" },
            { icon: "🏠", label: "Address Details" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5 text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full font-medium">
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
      <KycForm />
    </div>
  );
}
