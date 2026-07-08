"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { X, Loader2, Edit, Check, AlertCircle } from "lucide-react";
import type { BankRate } from "@/components/admin/loan-rates-panel";

type Loan = {
  id: string;
  loanAmount: number;
  termYears: number;
  status: string;
  loanType: string | null;
  annualIncome: number | null;
  employmentStatus: string | null;
  downPayment: number | null;
  creditScore: number | null;
  existingEmi: number | null;
  coApplicantName: string | null;
  coApplicantIncome: number | null;
  propertyType: string | null;
  propertyCity: string | null;
  propertyArea: string | null;
  adminNotes: string | null;
  createdAt: string;
  user: { name: string; email: string; phone: string | null };
  property: { title: string } | null;
};

export function LoansManager({ loans, bankRates = [] }: { loans: Loan[]; bankRates?: BankRate[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Editor states
  const [loanAmount, setLoanAmount] = useState(0);
  const [termYears, setTermYears] = useState(20);
  const [status, setStatus] = useState("PENDING");
  const [loanType, setLoanType] = useState("");
  const [annualIncome, setAnnualIncome] = useState<number | "">("");
  const [employmentStatus, setEmploymentStatus] = useState("");
  const [downPayment, setDownPayment] = useState<number | "">("");
  const [creditScore, setCreditScore] = useState<number | "">("");
  const [existingEmi, setExistingEmi] = useState<number | "">("");
  const [coApplicantName, setCoApplicantName] = useState("");
  const [coApplicantIncome, setCoApplicantIncome] = useState<number | "">("");
  const [propertyType, setPropertyType] = useState("");
  const [propertyCity, setPropertyCity] = useState("");
  const [propertyArea, setPropertyArea] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  function openEditModal(loan: Loan) {
    setEditingLoan(loan);
    setLoanAmount(loan.loanAmount);
    setTermYears(loan.termYears);
    setStatus(loan.status);
    setLoanType(loan.loanType || "Home Loan");
    setAnnualIncome(loan.annualIncome ?? "");
    setEmploymentStatus(loan.employmentStatus || "");
    setDownPayment(loan.downPayment ?? "");
    setCreditScore(loan.creditScore ?? "");
    setExistingEmi(loan.existingEmi ?? "");
    setCoApplicantName(loan.coApplicantName || "");
    setCoApplicantIncome(loan.coApplicantIncome ?? "");
    setPropertyType(loan.propertyType || "");
    setPropertyCity(loan.propertyCity || "");
    setPropertyArea(loan.propertyArea || "");
    setAdminNotes(loan.adminNotes || "");
    setError("");
    setSuccess("");
  }

  async function handleSave() {
    if (!editingLoan) return;
    setBusy(editingLoan.id);
    setError("");
    setSuccess("");

    const payload = {
      loanAmount: Number(loanAmount),
      termYears: Number(termYears),
      status,
      loanType,
      annualIncome: annualIncome === "" ? null : Number(annualIncome),
      employmentStatus: employmentStatus || null,
      downPayment: downPayment === "" ? null : Number(downPayment),
      creditScore: creditScore === "" ? null : Number(creditScore),
      existingEmi: existingEmi === "" ? null : Number(existingEmi),
      coApplicantName: coApplicantName || null,
      coApplicantIncome: coApplicantIncome === "" ? null : Number(coApplicantIncome),
      propertyType: propertyType || null,
      propertyCity: propertyCity || null,
      propertyArea: propertyArea || null,
      adminNotes: adminNotes || null,
    };

    try {
      const res = await fetch(`/api/admin/loans/${editingLoan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update loan application");

      setSuccess("Loan application details updated successfully!");
      setEditingLoan(null);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  async function handleQuickStatus(id: string, newStatus: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/loans/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      {success && (
        <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700 border border-emerald-100 flex items-center gap-2 animate-in fade-in">
          <Check className="h-4.5 w-4.5 text-emerald-600" />
          <span className="font-medium">{success}</span>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-slate-50 text-left text-slate-500 font-medium border-b border-slate-100">
            <tr>
              <th className="px-5 py-4">User</th>
              <th className="px-5 py-4">Amount & Term</th>
              <th className="px-5 py-4">Loan Type & Bank</th>
              <th className="px-5 py-4">Linked Property</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loans.map((l) => {
              const statusColors: Record<string, string> = {
                PENDING: "bg-amber-50 text-amber-700 border-amber-100",
                UNDER_REVIEW: "bg-blue-50 text-blue-700 border-blue-100",
                APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-100",
                REJECTED: "bg-red-50 text-red-700 border-red-100",
                FUNDED: "bg-purple-50 text-purple-700 border-purple-100",
              };
              return (
                <tr key={l.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-5 py-4">
                    <span className="font-bold text-slate-900 block">{l.user.name}</span>
                    <span className="text-slate-400 text-xs">{l.user.email}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-semibold text-slate-900 block">{formatCurrency(l.loanAmount)}</span>
                    <span className="text-slate-500 text-xs">{l.termYears} years term</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-slate-700 text-sm font-medium block">{l.loanType || "Home Loan"}</span>
                  </td>
                  <td className="px-5 py-4 text-slate-600 font-medium">
                    {l.property?.title ?? <span className="text-slate-400 font-normal">—</span>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusColors[l.status] || "bg-slate-50 text-slate-600"}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => openEditModal(l)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Edit Details
                      </button>
                      <select
                        disabled={busy === l.id}
                        value={l.status}
                        onChange={(e) => handleQuickStatus(l.id, e.target.value)}
                        className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs bg-white text-slate-700 font-medium outline-none"
                      >
                        {["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "FUNDED"].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              );
            })}
            {loans.length === 0 && (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-500">
                  No loan applications found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Editor Modal */}
      {editingLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto backdrop-blur-sm animate-in fade-in">
          <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 animate-in zoom-in-95">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Edit Loan Application</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update financing terms, applicant details, status, and bank rates.
                </p>
              </div>
              <button
                onClick={() => setEditingLoan(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Scrollable form body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Financial Section */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wide">1. Loan & Financing Details</h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="block text-sm">
                    <span className="text-slate-700 font-semibold">Loan Amount (₹)</span>
                    <input
                      type="number"
                      required
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(Number(e.target.value))}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-gold"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-slate-700 font-semibold">Term (Years)</span>
                    <input
                      type="number"
                      required
                      value={termYears}
                      onChange={(e) => setTermYears(Number(e.target.value))}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-gold"
                    />
                  </label>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Select Bank Interest — dynamic from DB */}
                  <label className="block text-sm">
                    <span className="text-slate-700 font-semibold">Assigned Bank / Interest Rate</span>
                    <select
                      value={
                        bankRates.some((item) => `${loanType}`.includes(item.bank))
                          ? bankRates.find((item) => `${loanType}`.includes(item.bank))?.bank
                          : "custom"
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val !== "custom") {
                          const item = bankRates.find((b) => b.bank === val);
                          if (item) setLoanType(`Home Loan - ${item.bank} (${item.rate.toFixed(2)}% p.a.)`);
                        }
                      }}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none bg-white focus:border-gold"
                    >
                      <option value="custom">Custom Bank / Rate</option>
                      {bankRates.map((item) => (
                        <option key={item.slug} value={item.bank}>
                          {item.bank} ({item.rate.toFixed(2)}% p.a.)
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm">
                    <span className="text-slate-700 font-semibold">Loan Type / Bank Text</span>
                    <input
                      type="text"
                      required
                      value={loanType}
                      onChange={(e) => setLoanType(e.target.value)}
                      placeholder="e.g. Home Loan - HDFC Bank (8.7%)"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-gold"
                    />
                  </label>
                </div>
              </div>

              {/* Applicant Profile */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wide">2. Applicant Financial Profile</h4>
                <div className="grid sm:grid-cols-3 gap-4">
                  <label className="block text-sm">
                    <span className="text-slate-700 font-semibold">Employment Status</span>
                    <input
                      type="text"
                      value={employmentStatus}
                      onChange={(e) => setEmploymentStatus(e.target.value)}
                      placeholder="Salaried / Self-Employed"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-gold"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-slate-700 font-semibold">Annual Income (₹)</span>
                    <input
                      type="number"
                      value={annualIncome}
                      onChange={(e) => setAnnualIncome(e.target.value === "" ? "" : Number(e.target.value))}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-gold"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-slate-700 font-semibold">Down Payment (₹)</span>
                    <input
                      type="number"
                      value={downPayment}
                      onChange={(e) => setDownPayment(e.target.value === "" ? "" : Number(e.target.value))}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-gold"
                    />
                  </label>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="block text-sm">
                    <span className="text-slate-700 font-semibold">Credit Score</span>
                    <input
                      type="number"
                      value={creditScore}
                      onChange={(e) => setCreditScore(e.target.value === "" ? "" : Number(e.target.value))}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-gold"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-slate-700 font-semibold">Existing Monthly EMIs (₹)</span>
                    <input
                      type="number"
                      value={existingEmi}
                      onChange={(e) => setExistingEmi(e.target.value === "" ? "" : Number(e.target.value))}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-gold"
                    />
                  </label>
                </div>
              </div>

              {/* Co-Applicant Profile */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wide">3. Co-Applicant details (if any)</h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="block text-sm">
                    <span className="text-slate-700 font-semibold">Co-Applicant Name</span>
                    <input
                      type="text"
                      value={coApplicantName}
                      onChange={(e) => setCoApplicantName(e.target.value)}
                      placeholder="Name"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-gold"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-slate-700 font-semibold">Co-Applicant Annual Income (₹)</span>
                    <input
                      type="number"
                      value={coApplicantIncome}
                      onChange={(e) => setCoApplicantIncome(e.target.value === "" ? "" : Number(e.target.value))}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-gold"
                    />
                  </label>
                </div>
              </div>

              {/* Status and Admin notes */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wide">4. Review Status & Decision</h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="block text-sm">
                    <span className="text-slate-700 font-semibold">Financing Status</span>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-white outline-none focus:border-gold"
                    >
                      {["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "FUNDED"].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="block text-sm">
                  <span className="text-slate-700 font-semibold">Internal Review / Admin Notes</span>
                  <textarea
                    rows={3}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Enter approval details, reference check result, etc."
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-gold resize-none"
                  />
                </label>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingLoan(null)}
                disabled={!!busy}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50 transition text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!!busy}
                className="flex items-center gap-2 rounded-xl bg-gold hover:bg-gold-dark text-slate-950 px-5 py-2 text-sm font-semibold transition"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
