"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  Copy,
  Crown,
  Eye,
  Home,
  Loader2,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  XCircle,
  X,
} from "lucide-react";
import type { FormRegistrationRecord, RegistrationStatus, RegistrationType } from "@/lib/form-registrations-store";
import { useHorizontalScroll } from "@/hooks/use-horizontal-scroll";
import { TableScrollButtons } from "@/components/ui/table-scroll-buttons";

export function FormRegistrationsClient({
  initialRegistrations,
}: {
  initialRegistrations: FormRegistrationRecord[];
}) {
  const [registrations, setRegistrations] = useState<FormRegistrationRecord[]>(initialRegistrations);
  const [typeFilter, setTypeFilter] = useState<"ALL" | RegistrationType>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | RegistrationStatus>("ALL");
  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // View Details Modal
  const [viewingReg, setViewingReg] = useState<FormRegistrationRecord | null>(null);

  // Credentials Modal (shown after approval)
  const [credsModal, setCredsModal] = useState<{
    email: string;
    password: string;
    role: string;
    name: string;
  } | null>(null);

  // Decline Reason Modal
  const [decliningReg, setDecliningReg] = useState<FormRegistrationRecord | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard!");
  };

  const handleApprove = async (regId: string) => {
    setProcessing(regId);
    try {
      const res = await fetch("/api/admin/form-registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", registrationId: regId }),
      });
      const data = await res.json();
      if (data.success && data.credentials) {
        // Refresh list
        const listRes = await fetch("/api/admin/form-registrations");
        const listData = await listRes.json();
        if (listData.registrations) setRegistrations(listData.registrations);

        const reg = registrations.find((r) => r.id === regId);
        setCredsModal({
          email: data.credentials.email,
          password: data.credentials.password,
          role: data.credentials.role,
          name: reg?.name || "",
        });
        showToast(data.message);
      } else {
        alert(data.error || "Approval failed.");
      }
    } catch {
      alert("Error approving registration.");
    } finally {
      setProcessing(null);
    }
  };

  const handleDecline = async () => {
    if (!decliningReg) return;
    setProcessing(decliningReg.id);
    try {
      const res = await fetch("/api/admin/form-registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "decline",
          registrationId: decliningReg.id,
          declineReason: declineReason || "Application does not meet requirements.",
        }),
      });
      const data = await res.json();
      if (data.success) {
        const listRes = await fetch("/api/admin/form-registrations");
        const listData = await listRes.json();
        if (listData.registrations) setRegistrations(listData.registrations);
        setDecliningReg(null);
        setDeclineReason("");
        showToast(data.message);
      } else {
        alert(data.error || "Decline failed.");
      }
    } catch {
      alert("Error declining registration.");
    } finally {
      setProcessing(null);
    }
  };

  const filtered = registrations.filter((r) => {
    const matchesType = typeFilter === "ALL" || r.type === typeFilter;
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      r.companyOrPropertyTitle.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const pendingCount = registrations.filter((r) => r.status === "PENDING").length;
  const approvedCount = registrations.filter((r) => r.status === "APPROVED").length;
  const declinedCount = registrations.filter((r) => r.status === "DECLINED").length;

  const { ref: tableScrollRef, canScrollLeft, canScrollRight, scroll } = useHorizontalScroll([filtered]);

  const hasActiveFilters = typeFilter !== "ALL" || statusFilter !== "ALL" || search !== "";
  const clearAllFilters = () => {
    setTypeFilter("ALL");
    setStatusFilter("ALL");
    setSearch("");
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto font-sans text-slate-900 dark:text-white">
      {/* TOAST */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 rounded-2xl bg-brand text-white px-5 py-3.5 text-xs font-extrabold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1
            className="text-3xl sm:text-4xl text-slate-950 dark:text-white tracking-tight leading-tight"
            style={{
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              fontWeight: 400,
              textTransform: "none",
            }}
          >
            Form Registrations
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review, approve, or decline White Label Partner and Seller registration applications. Approved applicants receive login credentials via email.
          </p>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 space-y-1">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Applications</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{registrations.length}</div>
        </div>
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-1">
          <div className="text-xs font-bold text-amber-600 dark:text-amber-400">Pending Review</div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{pendingCount}</div>
        </div>
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-1">
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Approved</div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{approvedCount}</div>
        </div>
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5 space-y-1">
          <div className="text-xs font-bold text-red-500">Declined</div>
          <div className="text-2xl font-extrabold text-red-500">{declinedCount}</div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
          <span className="text-slate-500 mr-1">Type:</span>
          {(["ALL", "WHITE_LABEL_PARTNER", "SELLER"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                typeFilter === t
                  ? "bg-brand text-white font-extrabold shadow-sm"
                  : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400"
              }`}
            >
              {t === "ALL" ? "All Types" : t === "WHITE_LABEL_PARTNER" ? "White Label" : "Seller"}
            </button>
          ))}
          <span className="text-slate-300 dark:text-slate-700 mx-1">|</span>
          <span className="text-slate-500 mr-1">Status:</span>
          {(["ALL", "PENDING", "APPROVED", "DECLINED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                statusFilter === s
                  ? "bg-brand text-white font-extrabold shadow-sm"
                  : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400"
              }`}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, company..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-10 pr-4 py-2 text-xs outline-none focus:border-amber-500 font-medium"
            />
          </div>
          <TableScrollButtons canScrollLeft={canScrollLeft} canScrollRight={canScrollRight} onScroll={scroll} />
          <button
            type="button"
            onClick={clearAllFilters}
            disabled={!hasActiveFilters}
            title={hasActiveFilters ? "Clear all filters" : "No filters applied"}
            className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl border text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed ${
              hasActiveFilters
                ? "border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-300"
                : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
            }`}
          >
            <X className="h-4 w-4 stroke-[2.5]" /> Clear All
          </button>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
        <div ref={tableScrollRef} className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">👤 Applicant</th>
                <th className="p-4">📋 Type &amp; Category</th>
                <th className="p-4">🏢 Company / Property</th>
                <th className="p-4">📍 Location</th>
                <th className="p-4">⚡ Status</th>
                <th className="p-4">📅 Applied</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400">
                    No registration applications found.
                  </td>
                </tr>
              ) : (
                filtered.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition">
                    <td className="p-4">
                      <div className="font-extrabold text-slate-900 dark:text-white">{reg.name}</div>
                      <div className="text-slate-500 text-[11px]">{reg.email}</div>
                      {reg.phone && <div className="text-slate-400 text-[11px] font-mono">{reg.phone}</div>}
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-extrabold border ${
                          reg.type === "WHITE_LABEL_PARTNER"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                            : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30"
                        }`}
                      >
                        {reg.type === "WHITE_LABEL_PARTNER" ? (
                          <Crown className="h-3 w-3" />
                        ) : (
                          <Home className="h-3 w-3" />
                        )}
                        {reg.type === "WHITE_LABEL_PARTNER" ? "White Label" : "Seller"}
                      </span>
                      <div className="text-slate-500 text-[11px] mt-1">{reg.categoryOrRole}</div>
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white text-sm max-w-[200px] truncate">
                        {reg.companyOrPropertyTitle}
                      </div>
                    </td>

                    <td className="p-4 text-slate-600 dark:text-slate-300">{reg.locationOrRegion || "—"}</td>

                    <td className="p-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          reg.status === "PENDING"
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            : reg.status === "APPROVED"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-red-500/15 text-red-500"
                        }`}
                      >
                        {reg.status}
                      </span>
                    </td>

                    <td className="p-4 text-slate-500 text-[11px] font-mono whitespace-nowrap">
                      {new Date(reg.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingReg(reg)}
                          className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {reg.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleApprove(reg.id)}
                              disabled={processing === reg.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[10px] shadow transition cursor-pointer disabled:opacity-50"
                            >
                              {processing === reg.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3 w-3" />
                              )}
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setDecliningReg(reg);
                                setDeclineReason("");
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-500 font-extrabold text-[10px] transition cursor-pointer"
                            >
                              <XCircle className="h-3 w-3" />
                              Decline
                            </button>
                          </>
                        )}

                        {reg.status === "APPROVED" && reg.generatedPassword && (
                          <button
                            onClick={() =>
                              setCredsModal({
                                email: reg.email,
                                password: reg.generatedPassword!,
                                role: reg.type === "WHITE_LABEL_PARTNER" ? "WHITE_LABEL_ADMIN" : "SELLER",
                                name: reg.name,
                              })
                            }
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 font-extrabold text-[10px] border border-amber-500/30 transition cursor-pointer"
                          >
                            <UserCheck className="h-3 w-3" />
                            View Credentials
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filtered.length} of {registrations.length} registrations</span>
        </div>
      </div>

      {/* ─── MODAL: VIEW FULL DETAILS ─────────────────────────────────────────────── */}
      {viewingReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 sm:p-8 shadow-2xl space-y-5 text-slate-900 dark:text-white max-h-[85vh] overflow-y-auto">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xl font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-amber-500" /> Application Details
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Registration ID: <span className="font-mono text-amber-500">{viewingReg.id}</span>
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 font-bold block">Applicant Name</span>
                  <span className="text-slate-900 dark:text-white font-medium">{viewingReg.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block">Email</span>
                  <span className="text-slate-900 dark:text-white font-mono">{viewingReg.email}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block">Phone</span>
                  <span className="text-slate-900 dark:text-white font-mono">{viewingReg.phone || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block">Application Type</span>
                  <span className="font-bold text-amber-500">{viewingReg.type === "WHITE_LABEL_PARTNER" ? "White Label Partner" : "Seller"}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block">Category / Role</span>
                  <span className="text-slate-900 dark:text-white">{viewingReg.categoryOrRole}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block">Location / Region</span>
                  <span className="text-slate-900 dark:text-white">{viewingReg.locationOrRegion || "—"}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 font-bold block">Company / Property</span>
                  <span className="text-slate-900 dark:text-white font-bold text-sm">{viewingReg.companyOrPropertyTitle}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-bold block mb-1">Submission Details (JSON)</span>
                <pre className="rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 text-[11px] text-slate-700 dark:text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(viewingReg.detailsJson), null, 2);
                    } catch {
                      return viewingReg.detailsJson;
                    }
                  })()}
                </pre>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-500 font-bold block">Status</span>
                  <span className={`font-extrabold ${viewingReg.status === "APPROVED" ? "text-emerald-500" : viewingReg.status === "DECLINED" ? "text-red-500" : "text-amber-500"}`}>
                    {viewingReg.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block">Applied On</span>
                  <span className="text-slate-900 dark:text-white font-mono">{new Date(viewingReg.createdAt).toLocaleString("en-IN")}</span>
                </div>
              </div>

              {viewingReg.declineReason && (
                <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 text-red-500 text-xs">
                  <span className="font-bold">Decline Reason:</span> {viewingReg.declineReason}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingReg(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: APPROVED CREDENTIALS ──────────────────────────────────────────── */}
      {credsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-emerald-500/30 bg-white dark:bg-slate-950 p-6 sm:p-8 shadow-2xl space-y-5 text-slate-900 dark:text-white">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 text-center">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-emerald-500/15 text-emerald-500 mb-3">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-950 dark:text-white">
                Application Approved!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Credentials have been generated and emailed to <span className="font-bold text-emerald-500">{credsModal.name}</span>.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Login Email:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{credsModal.email}</span>
                    <button onClick={() => handleCopy(credsModal.email)} className="p-1 text-slate-400 hover:text-amber-500" title="Copy">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Password:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg">{credsModal.password}</span>
                    <button onClick={() => handleCopy(credsModal.password)} className="p-1 text-slate-400 hover:text-amber-500" title="Copy">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Assigned Role:</span>
                  <span className="font-extrabold text-amber-500">{credsModal.role}</span>
                </div>
              </div>

              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3 text-amber-600 dark:text-amber-400 text-[11px]">
                <span className="font-bold">📧 Email Sent:</span> Login credentials have been emailed to {credsModal.email}. The user can log in and change their password.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setCredsModal(null)}
                className="px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-extrabold shadow-md transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: DECLINE REASON ────────────────────────────────────────────────── */}
      {decliningReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-red-500/30 bg-white dark:bg-slate-950 p-6 sm:p-8 shadow-2xl space-y-5 text-slate-900 dark:text-white">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xl font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" /> Decline Application
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Declining application from <span className="font-bold text-slate-900 dark:text-white">{decliningReg.name}</span> ({decliningReg.email}).
              </p>
            </div>

            <div>
              <label className="block text-xs text-slate-800 dark:text-slate-200 font-bold mb-1.5">Reason for Decline</label>
              <textarea
                rows={3}
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Application does not meet current partner requirements..."
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4 text-xs outline-none focus:border-red-500 font-medium leading-relaxed text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setDecliningReg(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDecline}
                disabled={processing === decliningReg.id}
                className="px-6 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-extrabold shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {processing === decliningReg.id ? "Declining..." : "Confirm Decline"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
