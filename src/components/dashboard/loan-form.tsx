"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Calculator, CheckCircle2, ShieldCheck, ArrowRight, ArrowLeft, Building2, FileText, UserCheck } from "lucide-react";

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
const LOAN_TYPES = [
  "Residential Home Loans",
  "Commercial Mortgages",
  "Construction Loans",
  "Land/Plot Loans",
  "Loans Against Property",
  "Bridge Loans",
];
const EMPLOYMENT_TYPES = ["Salaried", "Self-Employed Business", "Self-Employed Professional", "Retired", "Other"];
const PROPERTY_TYPES = ["Apartment", "Villa", "Penthouse", "Townhouse", "Land/Plot", "Commercial", "Duplex", "Full Floor"];
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
    PENDING:      { bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800/60",  text: "text-amber-700 dark:text-amber-300",  dot: "bg-amber-400",  label: "Pending" },
    UNDER_REVIEW: { bg: "bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800/60", text: "text-blue-700 dark:text-blue-300", dot: "bg-blue-500", label: "Under Review" },
    APPROVED:     { bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/60", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500", label: "Approved ✓" },
    REJECTED:     { bg: "bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-800/60",      text: "text-red-700 dark:text-red-300",    dot: "bg-red-500",    label: "Rejected" },
    FUNDED:       { bg: "bg-sky-50 border-sky-200 dark:bg-sky-950/40 dark:border-sky-800/60", text: "text-sky-700 dark:text-sky-300", dot: "bg-sky-500", label: "Funded 🎉" },
  };
  const c = cfg[status];
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${c.bg} ${c.text}`}>
      <span className={`h-2 w-2 rounded-full animate-pulse ${c.dot}`} />
      {c.label}
    </div>
  );
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  const labels = STEP_LABELS;
  return (
    <div className="mb-8">
      <div className="flex items-center">
        {Array.from({ length: total }).map((_, i) => {
          const isCompleted = i < step;
          const isActive = i === step;

          return (
            <div key={i} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                {/* Clean Light Blue Step Circle Wrapper */}
                <div className={`rounded-full p-1 transition-all duration-300 ${
                  isActive ? "bg-sky-100 dark:bg-sky-950/80 scale-105" : "bg-transparent"
                }`}>
                  <div className={`flex items-center justify-center h-9 w-9 rounded-full text-xs font-black transition-all duration-300 ${
                    isCompleted
                      ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                      : isActive
                      ? "bg-sky-500 text-white shadow-md shadow-sky-500/30"
                      : "bg-sky-50 dark:bg-slate-900 border-2 border-sky-200 dark:border-slate-800 text-sky-600 dark:text-sky-400 font-bold"
                  }`}>
                    {isCompleted ? <CheckCircle2 className="h-5 w-5 text-white" /> : i + 1}
                  </div>
                </div>

                <span className={`mt-1.5 text-xs whitespace-nowrap hidden md:block transition-colors ${
                  isActive ? "text-sky-950 dark:text-sky-300 font-extrabold" : isCompleted ? "text-sky-700 dark:text-sky-400 font-bold" : "text-sky-600/70 font-semibold"
                }`}>
                  {labels[i]}
                </span>
              </div>

              {i < total - 1 && (
                <div className={`flex-1 h-1 mx-3 rounded-full transition-all duration-300 ${isCompleted ? "bg-sky-500" : "bg-sky-100 dark:bg-slate-800"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmiCard({ amount, term, rate }: { amount: number; term: number; rate: number }) {
  const emi = calcEmi(amount, rate, term * 12);
  const totalPay = emi * term * 12;
  const totalInt = totalPay - amount;

  return (
    <div className="rounded-3xl bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 p-6 text-white shadow-xl border border-blue-800/40 relative overflow-hidden space-y-4">
      {/* Ambient background glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between">
        <p className="text-xs text-sky-200/80 font-bold uppercase tracking-wider flex items-center gap-1.5">
          <Calculator className="h-4 w-4 text-sky-400" /> Estimated Monthly EMI
        </p>
        <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-extrabold border border-sky-400/30">
          Indicative
        </span>
      </div>

      <div>
        <p className="text-3xl md:text-4xl font-black tracking-tight text-white">
          {emi > 0 ? fmt(emi) : "—"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 text-xs pt-1">
        <div className="rounded-2xl bg-white/10 backdrop-blur-md px-3.5 py-2.5 border border-white/10 hover:bg-white/15 transition">
          <p className="text-sky-200/70 font-medium">Principal</p>
          <p className="font-extrabold text-white text-sm mt-0.5">{amount > 0 ? fmt(amount) : "—"}</p>
        </div>
        <div className="rounded-2xl bg-white/10 backdrop-blur-md px-3.5 py-2.5 border border-white/10 hover:bg-white/15 transition">
          <p className="text-sky-200/70 font-medium">Total Interest</p>
          <p className="font-extrabold text-amber-300 text-sm mt-0.5">{totalInt > 0 ? fmt(totalInt) : "—"}</p>
        </div>
        <div className="rounded-2xl bg-white/10 backdrop-blur-md px-3.5 py-2.5 border border-white/10 hover:bg-white/15 transition">
          <p className="text-sky-200/70 font-medium">Total Payable</p>
          <p className="font-extrabold text-white text-sm mt-0.5">{totalPay > 0 ? fmt(totalPay) : "—"}</p>
        </div>
        <div className="rounded-2xl bg-white/10 backdrop-blur-md px-3.5 py-2.5 border border-white/10 hover:bg-white/15 transition">
          <p className="text-sky-200/70 font-medium">Rate (% p.a.)</p>
          <p className="font-extrabold text-emerald-300 text-sm mt-0.5">{rate.toFixed(2)}%</p>
        </div>
      </div>
    </div>
  );
}

function EmiPieChart({ principal, totalInterest, totalPayable }: { principal: number; totalInterest: number; totalPayable: number }) {
  if (totalPayable <= 0) return null;

  const principalPct = Math.round((principal / totalPayable) * 1000) / 10;
  const interestPct = Math.round((totalInterest / totalPayable) * 1000) / 10;

  const C = 251.327; // 2 * PI * 40
  const principalStroke = (principalPct / 100) * C;
  const interestStroke = (interestPct / 100) * C;

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 shadow-md shadow-slate-100 dark:shadow-none space-y-4 overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
          Payment Breakdown
        </h4>
        <span className="text-[10px] font-extrabold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800">
          Standard EMI Formula
        </span>
      </div>

      <div className="flex flex-col items-center justify-center py-2">
        <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#e2e8f0" strokeWidth="15" />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#0284c7"
              strokeWidth="15"
              strokeDasharray={`${principalStroke} ${C}`}
              strokeDashoffset="0"
              className="transition-all duration-500 ease-out"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#f59e0b"
              strokeWidth="15"
              strokeDasharray={`${interestStroke} ${C}`}
              strokeDashoffset={`${-principalStroke}`}
              className="transition-all duration-500 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Total Payable</span>
            <span className="text-xs font-black text-slate-900 dark:text-white leading-tight truncate max-w-[95px] mt-0.5">
              {fmt(totalPayable)}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2.5 text-xs">
        <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold shadow-sm">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-white shrink-0" />
            <span>Principal Amount</span>
          </div>
          <div className="text-right">
            <p className="font-black text-xs">{fmt(principal)}</p>
            <p className="text-[10px] text-sky-100 font-mono font-medium">{principalPct}%</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-slate-900 dark:text-amber-300 font-bold">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-amber-500 shrink-0" />
            <span>Total Interest</span>
          </div>
          <div className="text-right">
            <p className="font-black text-xs text-amber-700 dark:text-amber-400">{fmt(totalInterest)}</p>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-medium">{interestPct}%</p>
          </div>
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
  const [loanType, setLoanType]       = useState("Residential Home Loans");
  const [loanAmount, setLoanAmount]   = useState(16600000);
  const [termYears, setTermYears]     = useState(20);
  const [interestRate, setInterestRate] = useState(8.5);
  const [downPayment, setDownPayment] = useState(1000000);
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
        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-10 text-center space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-3xl shadow-lg shadow-emerald-500/30">
            ✓
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Application Submitted!</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
            Your loan application is under review. Our financial advisors will contact you within 2–3 business days.
          </p>
          <div className="flex justify-center pt-2"><LoanStatusBadge status="PENDING" /></div>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-4">
            {[
              { icon: "📋", label: "Application Received" },
              { icon: "🔍", label: "Document Verification" },
              { icon: "💳", label: "Credit Assessment" },
              { icon: "✅", label: "Loan Sanction" },
            ].map((item, i) => (
              <div key={i} className={`rounded-2xl p-3.5 ${i === 0 ? "bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800" : "bg-slate-50 border border-slate-200 dark:bg-slate-800/40 dark:border-slate-800"}`}>
                <div className="text-xl mb-1">{item.icon}</div>
                <p className={`font-bold ${i === 0 ? "text-emerald-700 dark:text-emerald-300" : "text-slate-500 dark:text-slate-400"}`}>{item.label}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => { setSubmitted(false); setStep(0); setLoanAmount(16600000); }}
            className="mt-6 text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline-block"
          >
            Apply for another loan
          </button>
        </div>

        {loans.length > 0 && <LoanHistory loans={loans} />}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
        {/* Eye-Catching Header Banner with Clean Blue Palette */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 px-8 py-6 flex items-center justify-between text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-200 text-xs font-bold border border-sky-400/30">
                Calculator & Application
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white mt-1">Loan Application</h2>
            <p className="text-sky-200/80 text-xs font-medium mt-0.5">
              Step {step + 1} of {STEP_LABELS.length} — {STEP_LABELS[step]}
            </p>
          </div>
          {loanAmount > 0 && (
            <div className="text-right hidden md:block relative z-10 bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/10">
              <p className="text-[11px] text-sky-200 font-medium">Net Loan Amount</p>
              <p className="text-xl font-black text-white">{fmt(Math.max(0, loanNet))}</p>
            </div>
          )}
        </div>

        <div className="p-6 md:p-8">
          <ProgressBar step={step} total={STEP_LABELS.length} />

          {/* ── Step 0: Loan Details ───────────────────────────────────────── */}
          {step === 0 && (
            <div className="grid md:grid-cols-5 gap-8">
              <div className="md:col-span-3 space-y-6">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    Loan Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {LOAN_TYPES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setLoanType(t)}
                        className={`px-3.5 py-3 rounded-2xl border text-xs font-bold text-left transition-all ${
                          loanType === t
                            ? "border-blue-600 bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-md shadow-blue-500/25 scale-[1.02]"
                            : "border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/30"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Loan Amount Slider & Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Loan Amount <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-1 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 bg-white dark:bg-slate-900 shadow-2xs focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">₹</span>
                      <input
                        type="number"
                        step="100000"
                        min={100000}
                        max={100000000}
                        value={loanAmount || ""}
                        onChange={(e) => setLoanAmount(parseFloat(e.target.value) || 0)}
                        placeholder="50,00,000"
                        className="w-32 text-right text-xs font-black text-slate-900 dark:text-white outline-none bg-transparent"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min={100000}
                    max={100000000}
                    step={100000}
                    value={loanAmount || 100000}
                    onChange={(e) => setLoanAmount(parseFloat(e.target.value) || 0)}
                    className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                    <span>₹1 Lac</span>
                    <span>₹10 Cr</span>
                  </div>
                </div>

                {/* Down Payment Slider & Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Down Payment
                    </label>
                    <div className="flex items-center gap-1 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 bg-white dark:bg-slate-900 shadow-2xs focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">₹</span>
                      <input
                        type="number"
                        step="50000"
                        min={0}
                        max={50000000}
                        value={downPayment || ""}
                        onChange={(e) => setDownPayment(parseFloat(e.target.value) || 0)}
                        placeholder="10,00,000"
                        className="w-32 text-right text-xs font-black text-slate-900 dark:text-white outline-none bg-transparent"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={50000000}
                    step={50000}
                    value={downPayment || 0}
                    onChange={(e) => setDownPayment(parseFloat(e.target.value) || 0)}
                    className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                    <span>₹0</span>
                    <span>₹5 Cr</span>
                  </div>
                </div>

                {/* Tenure (Years) Slider & Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Tenure (Years) <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-1 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 bg-white dark:bg-slate-900 shadow-2xs focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
                      <input
                        type="number"
                        min={1}
                        max={30}
                        step={1}
                        value={termYears}
                        onChange={(e) => setTermYears(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))}
                        className="w-12 text-right text-xs font-black text-slate-900 dark:text-white outline-none bg-transparent"
                      />
                      <span className="text-xs font-bold text-slate-500">Yrs</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={30}
                    step={1}
                    value={termYears}
                    onChange={(e) => setTermYears(parseInt(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                    <span>1 Yr</span>
                    <span>30 Yrs</span>
                  </div>
                </div>

                {/* Interest Rate (% P.A.) Slider & Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Interest Rate (% P.A.) <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-1 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 bg-white dark:bg-slate-900 shadow-2xs focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
                      <input
                        type="number"
                        step="0.05"
                        min={0.5}
                        max={15}
                        value={interestRate}
                        onChange={(e) => setInterestRate(Math.max(0.1, Math.min(20, parseFloat(e.target.value) || 0)))}
                        className="w-14 text-right text-xs font-black text-slate-900 dark:text-white outline-none bg-transparent"
                      />
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={15}
                    step={0.05}
                    value={interestRate}
                    onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                    <span>0.5%</span>
                    <span>15%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Purpose
                  </label>
                  <input
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="e.g. Purchase primary residence"
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>

              {/* EMI Sidebar */}
              <div className="md:col-span-2 space-y-4">
                <EmiCard amount={Math.max(0, loanNet)} term={termYears} rate={interestRate} />
                
                <div className="rounded-2xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60 p-4 text-xs text-sky-900 dark:text-sky-300 font-medium flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                  <span>EMI calculated at {interestRate.toFixed(2)}% p.a. (indicative). Final interest rate depends on credit profile and bank assessment.</span>
                </div>

                {/* HDFC Reference Pie Chart */}
                <EmiPieChart
                  principal={Math.max(0, loanNet)}
                  totalInterest={calcEmi(Math.max(0, loanNet), interestRate, termYears * 12) * termYears * 12 - Math.max(0, loanNet)}
                  totalPayable={calcEmi(Math.max(0, loanNet), interestRate, termYears * 12) * termYears * 12}
                />
              </div>
            </div>
          )}

          {/* ── Step 1: Financial Profile ──────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Employment Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                  {EMPLOYMENT_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setEmployment(t)}
                      className={`px-3.5 py-3 rounded-2xl border text-xs font-bold text-left transition-all ${
                        employment === t
                          ? "border-blue-600 bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-md shadow-blue-500/25"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-blue-300"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Annual Income (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={annualIncome || ""}
                    onChange={(e) => setAnnualIncome(parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 1200000"
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Existing Monthly EMI (₹)
                  </label>
                  <input
                    type="number"
                    value={existingEmi || ""}
                    onChange={(e) => setExistingEmi(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Credit Score (Self-declared): <span className="text-blue-600 dark:text-blue-400 font-black">{creditScore}</span>
                  <span className={`ml-2 text-xs font-bold ${creditScore >= 750 ? "text-emerald-600" : creditScore >= 650 ? "text-amber-600" : "text-red-600"}`}>
                    {creditScore >= 750 ? "(Excellent)" : creditScore >= 700 ? "(Good)" : creditScore >= 650 ? "(Fair)" : "(Poor)"}
                  </span>
                </label>
                <input
                  type="range" min={300} max={900} step={10}
                  value={creditScore}
                  onChange={(e) => setCreditScore(parseInt(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-medium">
                  <span>300 Poor</span><span>650 Fair</span><span>750 Good</span><span>900 Excellent</span>
                </div>
              </div>

              {annualIncome > 0 && (
                <div className="rounded-3xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 p-5 space-y-3">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-blue-900 dark:text-blue-300">
                    Eligibility Snapshot
                  </p>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 font-medium">Monthly Income</p>
                      <p className="font-extrabold text-slate-900 dark:text-white text-sm mt-0.5">{fmt(annualIncome / 12)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 font-medium">Max Eligible EMI (50%)</p>
                      <p className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">{fmt((annualIncome / 12) * 0.5)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 font-medium">Loan Status</p>
                      <p className="font-extrabold text-blue-600 dark:text-blue-400 text-sm mt-0.5">
                        {calcEmi(loanNet, 8.5, termYears * 12) <= (annualIncome / 12) * 0.5 ? "Eligible ✓" : "Review Required"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Property & Co-Applicant ────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Property Type
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                  {PROPERTY_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPropType(t)}
                      className={`px-3.5 py-3 rounded-2xl border text-xs font-bold text-left transition-all ${
                        propType === t
                          ? "border-blue-600 bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-md shadow-blue-500/25"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-blue-300"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Property Area (sq ft)
                  </label>
                  <input
                    value={propArea}
                    onChange={(e) => setPropArea(e.target.value)}
                    placeholder="e.g. 1200"
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Property City
                  </label>
                  <input
                    value={propCity}
                    onChange={(e) => setPropCity(e.target.value)}
                    placeholder="e.g. Mumbai"
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Add Co-Applicant</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Adding a co-applicant increases total loan eligibility</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHasCoApp((v) => !v)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hasCoApp ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-800"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${hasCoApp ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
                {hasCoApp && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Co-Applicant Name</label>
                      <input
                        value={coName}
                        onChange={(e) => setCoName(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-medium outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Annual Income (₹)</label>
                      <input
                        type="number"
                        value={coIncome || ""}
                        onChange={(e) => setCoIncome(parseFloat(e.target.value) || 0)}
                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-medium outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 3: Documents & Review ─────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-6 max-w-3xl">
              <div className="space-y-4">
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Upload Documents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: "Income Proof", hint: "Salary slip / ITR / Form 16", icon: <FileText className="h-6 w-6 text-blue-600" />, state: incomeProof, setter: setIncomeProof },
                    { label: "Bank Statement", hint: "Last 6 months statement",    icon: <Building2 className="h-6 w-6 text-sky-600" />, state: bankStatement, setter: setBankStatement },
                    { label: "Property Documents", hint: "Sale agreement / title deed", icon: <UserCheck className="h-6 w-6 text-teal-600" />, state: propertyDoc, setter: setPropertyDoc },
                  ].map((doc) => (
                    <label
                      key={doc.label}
                      className={`flex flex-col items-center text-center p-6 rounded-3xl border-2 border-dashed cursor-pointer transition-all hover:bg-sky-50/40 dark:hover:bg-sky-950/20 ${
                        doc.state.url ? "border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
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
                      <div className="h-12 w-12 rounded-2xl bg-sky-50 dark:bg-sky-950 flex items-center justify-center mb-3">
                        {doc.icon}
                      </div>
                      <p className="font-extrabold text-xs text-slate-900 dark:text-white">{doc.label}</p>
                      <p className="text-[11px] text-slate-400 mt-1">{doc.hint}</p>
                      {doc.state.uploading && <p className="text-xs text-blue-600 mt-2 font-bold animate-pulse">Uploading…</p>}
                      {doc.state.url && <p className="text-xs text-emerald-600 font-extrabold mt-2">✓ Uploaded</p>}
                      {doc.state.error && <p className="text-xs text-red-500 font-bold mt-2">{doc.state.error}</p>}
                      {!doc.state.url && !doc.state.uploading && !doc.state.error && <p className="text-[11px] text-blue-600 font-bold mt-2">Click to upload</p>}
                    </label>
                  ))}
                </div>
              </div>

              {/* Application Summary */}
              <div className="rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" /> Application Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
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
                    <div key={label} className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] text-slate-400 font-medium">{label}</p>
                      <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {msg && (
                <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-bold text-red-700">{msg}</div>
              )}
            </div>
          )}

          {/* ── Navigation ───────────────────────────────────────────────── */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            ) : <div />}

            {step < STEP_LABELS.length - 1 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 0 && !loanAmount) { setMsg("Please enter a loan amount."); return; }
                  if (step === 1 && !annualIncome) { setMsg("Please enter your annual income."); return; }
                  setMsg("");
                  setStep((s) => s + 1);
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-blue-600 hover:from-blue-500 hover:to-sky-400 text-white font-bold text-xs px-6 py-3 shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmit}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-6 py-3 shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Sparkles className="h-4 w-4" />
                <span>{loading ? "Submitting..." : "Submit Application"}</span>
              </button>
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
    <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md shadow-slate-100 dark:shadow-none overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
        <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white">Previous Applications</h3>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {loans.map((loan) => (
          <div key={loan.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
            <div>
              <p className="font-extrabold text-slate-900 dark:text-white text-xs">{loan.loanType || "Property Loan"}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                {fmt(loan.loanAmount)} · {loan.termYears}yr ·{" "}
                {new Date(loan.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
              {loan.property && (
                <p className="text-[11px] text-slate-400 mt-0.5">🏠 {loan.property.title}</p>
              )}
            </div>
            <LoanStatusBadge status={loan.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
