"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { X, Loader2, Edit, Check, AlertCircle, Clock, Plus, History, MessageSquare, Save, SquarePen } from "lucide-react";
import type { BankRate } from "@/components/admin/loan-rates-panel";
import { useHorizontalScroll } from "@/hooks/use-horizontal-scroll";
import { TableScrollButtons } from "@/components/ui/table-scroll-buttons";

type NoteEntry = {
  id: string;
  timestamp: string;
  text: string;
};

function formatTimestamp(ts: string) {
  if (!ts || ts === "Historical Note") {
    return new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }

  const d = new Date(ts);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }

  const dateMatch = ts.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (dateMatch) {
    const monthNames: Record<string, string> = {
      jan: "January", feb: "February", mar: "March", apr: "April", may: "May", jun: "June",
      jul: "July", aug: "August", sep: "September", oct: "October", nov: "November", dec: "December"
    };
    const m = monthNames[dateMatch[2].substring(0, 3).toLowerCase()] || dateMatch[2];
    const day = parseInt(dateMatch[1], 10);
    return `${m} ${day}, ${dateMatch[3]}`;
  }

  return ts;
}

function parseNotes(raw: string | null): NoteEntry[] {
  if (!raw || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((n) => typeof n === "object" && n.text)) {
      return parsed.map((n, i) => ({
        id: n.id || `note-${i}-${Date.now()}`,
        timestamp: n.timestamp || "Historical Note",
        text: n.text,
      }));
    }
  } catch (e) {}

  const blocks = raw.split(/\n\n+/).map((b) => b.trim()).filter(Boolean);
  const entries: NoteEntry[] = [];

  blocks.forEach((block, idx) => {
    const match = block.match(/^\[([^\]]+)\]\s*([\s\S]*)$/);
    if (match) {
      entries.push({
        id: `note-${idx}-${Date.now()}`,
        timestamp: match[1].trim(),
        text: match[2].trim(),
      });
    } else {
      entries.push({
        id: `note-${idx}-${Date.now()}`,
        timestamp: "Historical Note",
        text: block,
      });
    }
  });

  return entries;
}

function serializeNotes(entries: NoteEntry[]): string {
  return entries
    .map((e) => `[${e.timestamp}] ${e.text}`)
    .join("\n\n");
}

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
  const [notesList, setNotesList] = useState<NoteEntry[]>([]);
  const [newNoteText, setNewNoteText] = useState("");

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
    setNotesList(parseNotes(loan.adminNotes));
    setNewNoteText("");
    setError("");
    setSuccess("");
  }

  function handleAddNote() {
    if (!newNoteText.trim()) return;
    const now = new Date();
    const formattedTs = now.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const newEntry: NoteEntry = {
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: formattedTs,
      text: newNoteText.trim(),
    };

    const updated = [newEntry, ...notesList];
    setNotesList(updated);
    setAdminNotes(serializeNotes(updated));
    setNewNoteText("");
  }

  function handleDeleteNote(id: string) {
    const updated = notesList.filter((n) => n.id !== id);
    setNotesList(updated);
    setAdminNotes(serializeNotes(updated));
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

      if (res.status === 401) {
        window.location.href = "/login?error=SessionExpired";
        return;
      }

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
      if (res.status === 401) {
        window.location.href = "/login?error=SessionExpired";
        return;
      }
      if (!res.ok) throw new Error("Failed to update status");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBusy(null);
    }
  }

  const { ref: tableScrollRef, canScrollLeft, canScrollRight, scroll } = useHorizontalScroll([loans]);

  return (
    <div className="space-y-6">
      {success && (
        <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700 border border-emerald-100 flex items-center gap-2 animate-in fade-in">
          <Check className="h-4.5 w-4.5 text-emerald-600" />
          <span className="font-medium">{success}</span>
        </div>
      )}

      <div className="flex justify-end">
        <TableScrollButtons canScrollLeft={canScrollLeft} canScrollRight={canScrollRight} onScroll={scroll} />
      </div>

      <div ref={tableScrollRef} className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
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

                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-900 font-bold text-sm flex items-center gap-1.5">
                      <MessageSquare className="h-4 w-4 text-amber-500" />
                      Internal Review & Admin Notes Log
                    </span>
                    <span className="text-xs text-slate-400 font-medium font-mono">
                      {notesList.length} {notesList.length === 1 ? "entry" : "entries"}
                    </span>
                  </div>

                  {/* Add New Note Box */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
                    <textarea
                      rows={2}
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      placeholder="Type a new review note, reference check status, or approval details..."
                      className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none focus:border-gold resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-slate-500 font-medium">
                        Click "Save Note" to record this entry with a live timestamp.
                      </p>
                      <button
                        type="button"
                        disabled={!newNoteText.trim()}
                        onClick={handleAddNote}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-950 bg-gold hover:bg-gold-dark disabled:opacity-50 px-4 py-2 rounded-lg transition shadow-xs cursor-pointer"
                      >
                        <Save className="h-3.5 w-3.5" />
                        Save Note
                      </button>
                    </div>
                  </div>

                  {/* Historical Log / Timeline */}
                  <div className="space-y-2 pt-1">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <History className="h-3.5 w-3.5 text-slate-400" />
                      Historical Record of Saved Notes
                    </h5>

                    {notesList.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-400 italic bg-white">
                        No historical notes recorded yet. Type a note above and click "Save Note".
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                        {notesList.map((note) => (
                          <div
                            key={note.id}
                            className="rounded-2xl border border-slate-200/90 bg-white p-4 space-y-3 shadow-2xs transition hover:border-slate-300"
                          >
                            {/* Note Text */}
                            <p className="text-sm font-bold text-slate-900 leading-snug whitespace-pre-wrap">
                              {note.text}
                            </p>

                            {/* Note Meta Footer */}
                            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                              <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                                <SquarePen className="h-4 w-4 text-teal-700 shrink-0" />
                                <span className="font-semibold text-teal-700 underline decoration-teal-700 underline-offset-2">
                                  Note
                                </span>
                                <span>by Super Admin</span>
                              </div>
                              <span className="text-slate-500 font-medium text-xs">
                                {formatTimestamp(note.timestamp)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
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
