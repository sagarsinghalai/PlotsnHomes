"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────
type LoanStatus = "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "FUNDED";

interface LoanRecord {
  id: string;
  loanAmount: number;
  loanType?: string;
  termYears: number;
  status: LoanStatus;
  createdAt: string;
  property?: { title: string; slug: string } | null;
}

interface DocUpload {
  url?: string;
  uploading?: boolean;
  error?: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────
const LOAN_TYPES = ["Home Loan", "Loan Against Property", "Construction Loan", "Top-Up Loan", "Balance Transfer"];
const EMPLOYMENT_TYPES = ["Salaried", "Self-Employed Business", "Self-Employed Professional", "Retired", "Other"];
const PROPERTY_TYPES = ["Apartment", "Independent House / Villa", "Plot / Land", "Commercial", "Under Construction"];
const STEP_LABELS = ["Loan Details", "Financial Profile", "Property & Co-Applicant", "Documents & Review"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function calcEmi(principal: number, annualRate: number, months: number): number {
  if (!principal || !annualRate || !months) return 0;
  const r = annualRate / 12 / 100;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

function LoanStatusBadge({ status }: { status: LoanStatus }) {
  const cfg: Record<LoanStatus, { bg: string; text: string; dot: string; label: string }> = {
    PENDING:      { bg: "bg-amber-50 border-amber-200",  text: "text-amber-700",  dot: "bg-amber-400",  label: "Pending" },
    UNDER_REVIEW: { bg: "bg-blue-50 border-blue-200",    text: "text-blue-700",   dot: "bg-blue-500",   label: "Under Review" },
    APPROVED:     { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500", label: "Approved ✓" },
    REJECTED:     { bg: "bg-red-50 border-red-200",      text: "text-red-700",    dot: "bg-red-500",    label: "Rejected" },
    FUNDED:       { bg: "bg-purple-50 border-purple-200", text: "text-purple-700", dot: "bg-purple-500", label: "Funded 🎉" },
  };
  const c = cfg[status];
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${c.dot}`} />
      {c.label}
    </div>
  );
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  const labels = STEP_LABELS;
  return (
    <div className="mb-8">
      <div className="flex items-center">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`flex items-center justify-center h-9 w-9 rounded-full border-2 text-xs font-bold transition-all ${
                i < step  ? "bg-emerald-500 border-emerald-500 text-white" :
                i === step ? "bg-slate-900 border-slate-900 text-white scale-110 shadow-lg shadow-slate-900/20" :
                "bg-white border-slate-200 text-slate-400"
              }`}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className={`mt-1 text-xs whitespace-nowrap hidden md:block ${i === step ? "text-slate-900 font-semibold" : "text-slate-400"}`}>
                {labels[i]}
              </span>
            </div>
            {i < total - 1 && (
              <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all ${i < step ? "bg-emerald-500" : "bg-slate-200"}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function EmiCard({ amount, term }: { amount: number; term: number }) {
  const RATE = 8.5;
  const emi = calcEmi(amount, RATE, term * 12);
  const totalPay = emi * term * 12;
  const totalInt = totalPay - amount;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 p-5 text-white">
      <p className="text-xs text-slate-400 font-medium mb-1">Estimated Monthly EMI</p>
      <p className="text-3xl font-bold mb-3">{emi > 0 ? fmt(emi) : "—"}</p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-white/10 px-3 py-2">
          <p className="text-slate-300">Principal</p>
          <p className="font-semibold">{amount > 0 ? fmt(amount) : "—"}</p>
        </div>
        <div className="rounded-xl bg-white/10 px-3 py-2">
          <p className="text-slate-300">Total Interest</p>
          <p className="font-semibold">{totalInt > 0 ? fmt(totalInt) : "—"}</p>
        </div>
        <div className="rounded-xl bg-white/10 px-3 py-2">
          <p className="text-slate-300">Total Payable</p>
          <p className="font-semibold">{totalPay > 0 ? fmt(totalPay) : "—"}</p>
        </div>
        <div className="rounded-xl bg-white/10 px-3 py-2">
          <p className="text-slate-300">Rate (indicative)</p>
          <p className="font-semibold">{RATE}% p.a.</p>
        </div>
      </div>
    </div>
  );
}

async function uploadDoc(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data.url as string;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function LoanApplicationForm() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [msg, setMsg] = useState("");
  const [loans, setLoans] = useState<LoanRecord[]>([]);

  // Step 1
  const [loanType, setLoanType]       = useState("Home Loan");
  const [loanAmount, setLoanAmount]   = useState(0);
  const [termYears, setTermYears]     = useState(20);
  const [downPayment, setDownPayment] = useState(0);
  const [purpose, setPurpose]         = useState("");

  // Step 2
  const [annualIncome, setAnnualIncome]       = useState(0);
  const [employment, setEmployment]           = useState("Salaried");
  const [creditScore, setCreditScore]         = useState(750);
  const [existingEmi, setExistingEmi]         = useState(0);

  // Step 3
  const [propType, setPropType]       = useState("Apartment");
  const [propArea, setPropArea]       = useState("");
  const [propCity, setPropCity]       = useState("");
  const [hasCoApp, setHasCoApp]       = useState(false);
  const [coName, setCoName]           = useState("");
  const [coIncome, setCoIncome]       = useState(0);

  // Documents
  const [incomeProof, setIncomeProof]     = useState<DocUpload>({});
  const [bankStatement, setBankStatement] = useState<DocUpload>({});
  const [propertyDoc, setPropertyDoc]     = useState<DocUpload>({});

  useEffect(() => {
    fetch("/api/loans").then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setLoans(d);
    });
  }, [submitted]);

  async function handleDocUpload(
    file: File,
    setter: React.Dispatch<React.SetStateAction<DocUpload>>
  ) {
    setter({ uploading: true });
    try {
      const url = await uploadDoc(file);
      setter({ url });
    } catch (e: unknown) {
      setter({ error: e instanceof Error ? e.message : "Upload failed" });
    }
  }

  async function handleSubmit() {
    setLoading(true);
    setMsg("");
    const payload = {
      loanType, loanAmount, termYears, downPayment: downPayment || undefined,
      purpose: purpose || undefined,
      annualIncome: annualIncome || undefined,
      employmentStatus: employment,
      creditScore: creditScore || undefined,
      existingEmi: existingEmi || undefined,
      propertyType: propType,
      propertyArea: propArea || undefined,
      propertyCity: propCity || undefined,
      coApplicantName: hasCoApp ? coName : undefined,
      coApplicantIncome: hasCoApp && coIncome ? coIncome : undefined,
      incomeProofUrl: incomeProof.url,
      bankStatementUrl: bankStatement.url,
      propertyDocUrl: propertyDoc.url,
    };
    const res = await fetch("/api/loans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (res.ok) {
      setSubmitted(true);
    } else {
      setMsg("Submission failed. Please try again.");
    }
  }

  const loanNet = loanAmount - downPayment;

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="rounded-3xl border bg-white shadow-xl p-10 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl">🏦</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Submitted!</h2>
          <p className="text-slate-500 mb-6">Your loan application is under review. Our team will contact you within 2–3 business days.</p>
          <div className="flex justify-center"><LoanStatusBadge status="PENDING" /></div>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {[
              { icon: "📋", label: "Application Received" },
              { icon: "🔍", label: "Document Verification" },
              { icon: "💳", label: "Credit Assessment" },
              { icon: "✅", label: "Loan Sanction" },
            ].map((item, i) => (
              <div key={i} className={`rounded-xl p-3 ${i === 0 ? "bg-emerald-50 border border-emerald-200" : "bg-slate-50 border border-slate-200"}`}>
                <div className="text-xl mb-1">{item.icon}</div>
                <p className={`font-medium ${i === 0 ? "text-emerald-700" : "text-slate-500"}`}>{item.label}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => { setSubmitted(false); setStep(0); setLoanAmount(0); }}
            className="mt-6 text-sm text-slate-500 hover:text-slate-800 underline"
          >
            Apply for another loan
          </button>
        </div>

        {/* Previous applications */}
        {loans.length > 0 && <LoanHistory loans={loans} />}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="rounded-3xl border bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-700 px-8 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Loan Application</h2>
            <p className="text-slate-300 text-sm mt-0.5">Step {step + 1} of {STEP_LABELS.length} — {STEP_LABELS[step]}</p>
          </div>
          {loanAmount > 0 && (
            <div className="text-right hidden md:block">
              <p className="text-xs text-slate-400">Net Loan Amount</p>
              <p className="text-xl font-bold text-white">{fmt(Math.max(0, loanNet))}</p>
            </div>
          )}
        </div>

        <div className="p-8">
          <ProgressBar step={step} total={STEP_LABELS.length} />

          {/* ── Step 0: Loan Details ───────────────────────────────────────── */}
          {step === 0 && (
            <div className="grid md:grid-cols-5 gap-6">
              <div className="md:col-span-3 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Loan Type <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-2 gap-2">
                    {LOAN_TYPES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setLoanType(t)}
                        className={`px-3 py-2.5 rounded-xl border text-sm font-medium text-left transition-all ${
                          loanType === t
                            ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Loan Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={loanAmount || ""}
                    onChange={(e) => setLoanAmount(parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 5000000"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Down Payment (₹)
                  </label>
                  <input
                    type="number"
                    value={downPayment || ""}
                    onChange={(e) => setDownPayment(parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 500000"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Loan Tenure: <span className="text-slate-900 font-bold">{termYears} years</span>
                  </label>
                  <input
                    type="range"
                    min={1} max={30} step={1}
                    value={termYears}
                    onChange={(e) => setTermYears(parseInt(e.target.value))}
                    className="w-full accent-slate-900"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>1 yr</span><span>15 yrs</span><span>30 yrs</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Purpose</label>
                  <input
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="e.g. Purchase primary residence"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                  />
                </div>
              </div>

              {/* EMI Sidebar */}
              <div className="md:col-span-2">
                <EmiCard amount={Math.max(0, loanNet)} term={termYears} />
                <div className="mt-3 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-xs text-blue-700">
                  ℹ️ EMI is calculated at 8.5% p.a. (indicative). Final rate depends on credit profile & bank assessment.
                </div>
              </div>
            </div>
          )}

          {/* ── Step 1: Financial Profile ──────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Employment Type <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {EMPLOYMENT_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setEmployment(t)}
                      className={`px-3 py-2.5 rounded-xl border text-sm font-medium text-left transition-all ${
                        employment === t
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Annual Income (₹) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={annualIncome || ""}
                    onChange={(e) => setAnnualIncome(parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 1200000"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Existing Monthly EMI (₹)</label>
                  <input
                    type="number"
                    value={existingEmi || ""}
                    onChange={(e) => setExistingEmi(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Credit Score (Self-declared): <span className="text-slate-900 font-bold">{creditScore}</span>
                  <span className={`ml-2 text-xs font-medium ${creditScore >= 750 ? "text-emerald-600" : creditScore >= 650 ? "text-amber-600" : "text-red-600"}`}>
                    {creditScore >= 750 ? "Excellent" : creditScore >= 700 ? "Good" : creditScore >= 650 ? "Fair" : "Poor"}
                  </span>
                </label>
                <input
                  type="range" min={300} max={900} step={10}
                  value={creditScore}
                  onChange={(e) => setCreditScore(parseInt(e.target.value))}
                  className="w-full accent-slate-900"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>300 Poor</span><span>650 Fair</span><span>750 Good</span><span>900 Excellent</span>
                </div>
              </div>

              {/* FOIR indicator */}
              {annualIncome > 0 && (
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-700 mb-2">Eligibility Snapshot</p>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-400">Monthly Income</p>
                      <p className="font-semibold text-slate-800">{fmt(annualIncome / 12)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Max Eligible EMI (50%)</p>
                      <p className="font-semibold text-emerald-700">{fmt((annualIncome / 12) * 0.5)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Estimated Loan Eligibility</p>
                      <p className="font-semibold text-slate-800">
                        {fmt(calcEmi(loanNet, 8.5, termYears * 12) <= (annualIncome / 12) * 0.5 ? loanNet : 0)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Property & Co-Applicant ────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Property Type</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {PROPERTY_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPropType(t)}
                      className={`px-3 py-2.5 rounded-xl border text-sm font-medium text-left transition-all ${
                        propType === t
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Property Area (sq ft)</label>
                  <input
                    value={propArea}
                    onChange={(e) => setPropArea(e.target.value)}
                    placeholder="e.g. 1200"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Property City</label>
                  <input
                    value={propCity}
                    onChange={(e) => setPropCity(e.target.value)}
                    placeholder="e.g. Mumbai"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                  />
                </div>
              </div>

              {/* Co-applicant */}
              <div className="rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-semibold text-slate-800">Add Co-Applicant</p>
                    <p className="text-xs text-slate-500 mt-0.5">Adding a co-applicant can increase loan eligibility</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHasCoApp((v) => !v)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hasCoApp ? "bg-slate-900" : "bg-slate-200"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${hasCoApp ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
                {hasCoApp && (
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Co-Applicant Name</label>
                      <input
                        value={coName}
                        onChange={(e) => setCoName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Annual Income (₹)</label>
                      <input
                        type="number"
                        value={coIncome || ""}
                        onChange={(e) => setCoIncome(parseFloat(e.target.value) || 0)}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 3: Documents & Review ─────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-800">Upload Documents</h3>
                {[
                  { label: "Income Proof", hint: "Salary slip / ITR / Form 16", icon: "💼", state: incomeProof, setter: setIncomeProof },
                  { label: "Bank Statement", hint: "Last 6 months statement",    icon: "🏦", state: bankStatement, setter: setBankStatement },
                  { label: "Property Documents", hint: "Sale agreement / title deed", icon: "📄", state: propertyDoc, setter: setPropertyDoc },
                ].map((doc) => (
                  <label
                    key={doc.label}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all hover:bg-slate-50 ${
                      doc.state.url ? "border-emerald-400 bg-emerald-50/40" : "border-slate-200 bg-white"
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleDocUpload(f, doc.setter);
                      }}
                    />
                    <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-2xl shrink-0">{doc.icon}</div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-slate-800">{doc.label}</p>
                      <p className="text-xs text-slate-500">{doc.hint}</p>
                      {doc.state.uploading && <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1"><span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" /> Uploading…</p>}
                      {doc.state.url && <p className="text-xs text-emerald-600 mt-0.5 font-semibold">✓ Uploaded</p>}
                      {doc.state.error && <p className="text-xs text-red-500 mt-0.5">{doc.state.error}</p>}
                      {!doc.state.url && !doc.state.uploading && !doc.state.error && <p className="text-xs text-slate-400 mt-0.5">Click to upload</p>}
                    </div>
                  </label>
                ))}
              </div>

              {/* Application summary */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-800 text-sm mb-4">📋 Application Summary</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ["Loan Type",      loanType],
                    ["Loan Amount",    loanAmount ? fmt(loanAmount) : "—"],
                    ["Down Payment",   downPayment ? fmt(downPayment) : "—"],
                    ["Net Loan",       loanNet > 0 ? fmt(loanNet) : "—"],
                    ["Tenure",         `${termYears} years`],
                    ["Monthly EMI",    loanNet > 0 ? fmt(calcEmi(loanNet, 8.5, termYears * 12)) : "—"],
                    ["Employment",     employment],
                    ["Annual Income",  annualIncome ? fmt(annualIncome) : "—"],
                    ["Credit Score",   String(creditScore)],
                    ["Property Type",  propType],
                    ["Property City",  propCity || "—"],
                    ["Co-Applicant",   hasCoApp ? coName || "Yes" : "No"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-slate-400">{label}</p>
                      <p className="font-semibold text-slate-700">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {msg && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{msg}</div>
              )}
            </div>
          )}

          {/* ── Navigation ───────────────────────────────────────────────── */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
            {step > 0 ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                ← Back
              </button>
            ) : <div />}

            {step < STEP_LABELS.length - 1 ? (
              <Button
                variant="primary"
                onClick={() => {
                  if (step === 0 && !loanAmount) { setMsg("Please enter a loan amount."); return; }
                  if (step === 1 && !annualIncome) { setMsg("Please enter your annual income."); return; }
                  setMsg("");
                  setStep((s) => s + 1);
                }}
              >
                Continue →
              </Button>
            ) : (
              <Button variant="gold" loading={loading} onClick={handleSubmit}>
                Submit Application
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Previous loans */}
      {loans.length > 0 && <LoanHistory loans={loans} />}
    </div>
  );
}

// ─── Loan History ─────────────────────────────────────────────────────────────
function LoanHistory({ loans }: { loans: LoanRecord[] }) {
  return (
    <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-800">Previous Applications</h3>
      </div>
      <div className="divide-y divide-slate-100">
        {loans.map((loan) => (
          <div key={loan.id} className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="font-semibold text-slate-800 text-sm">{loan.loanType || "Property Loan"}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {fmt(loan.loanAmount)} · {loan.termYears}yr ·{" "}
                {new Date(loan.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
              {loan.property && (
                <p className="text-xs text-slate-400 mt-0.5">🏠 {loan.property.title}</p>
              )}
            </div>
            <LoanStatusBadge status={loan.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
