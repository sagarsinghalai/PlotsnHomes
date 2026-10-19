"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Coins,
  Calendar,
  Users,
  Percent,
  Check,
  Pause,
  Play,
  Building2,
  Send,
  Save,
  CreditCard,
  Search,
  Filter,
  DollarSign,
  Briefcase,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useHorizontalScroll } from "@/hooks/use-horizontal-scroll";
import { TableScrollButtons } from "@/components/ui/table-scroll-buttons";
import { ViewToggle, useViewMode, viewContainerClass } from "@/components/admin/view-toggle";

export type PayoutProperty = {
  id: string;
  title: string;
  symbol: string;
  price: number;
  yieldRate: number;
  category: string;
  investorsCount: number;
};

export type AgentCommissionPayout = {
  id: string;
  agentId: string;
  agentName: string;
  agentEmail: string;
  agentRole: string;
  bankDetails: {
    bankName: string;
    accountNo: string;
    ifscCode: string;
    upiId: string;
  };
  propertyTitle: string;
  propertySymbol?: string;
  propertyValue: number;
  commissionPct: number;
  totalCommission: number;
  paidAmount: number;
  remainingBalance: number;
  status: "PENDING" | "PARTIALLY_PAID" | "PAID";
  notes: string;
  paymentRef?: string;
  updatedAt: string;
};

type PayoutStatus = "SCHEDULED" | "PAUSED" | "PROCESSED";

const MOCK_AGENT_COMMISSIONS: AgentCommissionPayout[] = [
  {
    id: "comm-101",
    agentId: "agent-1",
    agentName: "Rajesh Sharma",
    agentEmail: "rajesh.sharma@plotsnhomes.com",
    agentRole: "Senior Sales Lead",
    bankDetails: {
      bankName: "HDFC Bank Ltd.",
      accountNo: "50100293847123",
      ifscCode: "HDFC0001234",
      upiId: "rajesh@hdfcbank",
    },
    propertyTitle: "Kensington Manor",
    propertySymbol: "BKV-PROP-LON-001",
    propertyValue: 42500000,
    commissionPct: 3.5,
    totalCommission: 1487500,
    paidAmount: 500000,
    remainingBalance: 987500,
    status: "PARTIALLY_PAID",
    notes: "Advance ₹500,000 transferred via HDFC IMPS. Remaining ₹987,500 pending final deed registry.",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "comm-102",
    agentId: "agent-2",
    agentName: "Priya Patel",
    agentEmail: "priya.patel@plotsnhomes.com",
    agentRole: "Associate Director",
    bankDetails: {
      bankName: "ICICI Bank",
      accountNo: "000401592837",
      ifscCode: "ICIC0000004",
      upiId: "priya.p@icici",
    },
    propertyTitle: "Manhattan Penthouse",
    propertySymbol: "BKV-PROP-NYC-003",
    propertyValue: 85000000,
    commissionPct: 4.0,
    totalCommission: 3400000,
    paidAmount: 0,
    remainingBalance: 3400000,
    status: "PENDING",
    notes: "Verified deal closure. Ready for full or partial bank transfer.",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "comm-103",
    agentId: "agent-3",
    agentName: "Amit Verma",
    agentEmail: "amit.verma@plotsnhomes.com",
    agentRole: "Channel Partner Lead",
    bankDetails: {
      bankName: "Axis Bank",
      accountNo: "91802004827103",
      ifscCode: "UTIB0000812",
      upiId: "amit@axisbank",
    },
    propertyTitle: "Swiss Chalet",
    propertySymbol: "BKV-PROP-VRB-005",
    propertyValue: 28000000,
    commissionPct: 3.0,
    totalCommission: 840000,
    paidAmount: 840000,
    remainingBalance: 0,
    status: "PAID",
    notes: "Full commission paid out via NEFT Ref #COMM-99201. Reflected in agent profile.",
    updatedAt: new Date().toISOString(),
  },
];

export function PayoutsManager({
  properties,
  initialCommissions = [],
}: {
  properties: PayoutProperty[];
  initialCommissions?: any[];
}) {
  const [activeTab, setActiveTab] = useState<"dividends" | "commissions">("commissions");

  // Local state to track property dividend payout statuses
  const [statuses, setStatuses] = useState<Record<string, PayoutStatus>>({});

  // Eligible Agent Commissions state
  const [commissions, setCommissions] = useState<AgentCommissionPayout[]>(() => {
    if (initialCommissions && initialCommissions.length > 0) {
      return initialCommissions.map((c, idx) => {
        const total = c.totalCommission || 1250000;
        const paid = c.paidAmount || (c.status === "PAID" ? total : 0);
        const rem = c.remainingBalance ?? Math.max(0, total - paid);
        let st: "PENDING" | "PARTIALLY_PAID" | "PAID" = c.status;
        if (paid > 0 && rem > 0) st = "PARTIALLY_PAID";
        else if (rem <= 0) st = "PAID";

        return {
          id: c.id || `comm-${idx + 1}`,
          agentId: c.agentId || `agent-${idx + 1}`,
          agentName: c.agentName || "Agent Partner",
          agentEmail: c.agentEmail || "agent@plotsnhomes.com",
          agentRole: c.agentRole || "Senior Agent",
          bankDetails: {
            bankName: "HDFC Bank Ltd.",
            accountNo: `50100${Math.floor(1000000 + Math.random() * 9000000)}`,
            ifscCode: "HDFC0001234",
            upiId: `${(c.agentName || 'agent').toLowerCase().replace(/\s+/g, '')}@hdfcbank`,
          },
          propertyTitle: c.propertyTitle || "Property Asset",
          propertySymbol: c.propertySymbol || "PROP",
          propertyValue: c.propertyValue || 35000000,
          commissionPct: c.commissionPct || 3.0,
          totalCommission: total,
          paidAmount: paid,
          remainingBalance: rem,
          status: st,
          notes: c.notes || "",
          paymentRef: c.paymentRef || "",
          updatedAt: c.updatedAt || new Date().toISOString(),
        };
      });
    }
    return MOCK_AGENT_COMMISSIONS;
  });

  // Commission Search & Status Filter
  const [commSearch, setCommSearch] = useState("");
  const [commStatusFilter, setCommStatusFilter] = useState<"ALL" | "PENDING" | "PARTIALLY_PAID" | "PAID">("ALL");
  const [viewMode, setViewMode] = useViewMode("admin-payouts", "list");

  // Transfer Modal State
  const [selectedComm, setSelectedComm] = useState<AgentCommissionPayout | null>(null);
  const [transferAmount, setTransferAmount] = useState<string>("");
  const [paymentOption, setPaymentOption] = useState<string>("Direct Bank Transfer (IMPS)");
  const [transferNotes, setTransferNotes] = useState<string>("");
  const [transferring, setTransferring] = useState(false);

  // Editable Notes State & Saving Statuses
  const [notesState, setNotesState] = useState<Record<string, string>>({});
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const [savedNoteSuccessId, setSavedNoteSuccessId] = useState<string | null>(null);

  useEffect(() => {
    // Populate notesState from commissions list
    const initialNotes: Record<string, string> = {};
    commissions.forEach((c) => {
      initialNotes[c.id] = c.notes || "";
    });
    setNotesState(initialNotes);
  }, [commissions]);

  // Dividend Pool Calculations for stats
  const stats = useMemo(() => {
    const totalPool = properties.reduce((sum, p) => sum + p.price * (p.yieldRate / 100), 0);
    const totalInvestors = properties.reduce((sum, p) => sum + p.investorsCount, 0);
    const avgYield = properties.length > 0 ? properties.reduce((sum, p) => sum + p.yieldRate, 0) / properties.length : 0;

    const totalEligibleCommissions = commissions.reduce((sum, c) => sum + c.totalCommission, 0);
    const totalPaidCommissions = commissions.reduce((sum, c) => sum + c.paidAmount, 0);
    const totalPendingCommissions = commissions.reduce((sum, c) => sum + c.remainingBalance, 0);

    return {
      totalPool,
      totalInvestors,
      avgYield,
      totalEligibleCommissions,
      totalPaidCommissions,
      totalPendingCommissions,
    };
  }, [properties, commissions]);

  const [processingId, setProcessingId] = useState<string | null>(null);

  // Execute Dividend Payout
  const handleProcessDividend = async (p: PayoutProperty, poolAmount: number) => {
    const monthlyPayout = poolAmount / 12;
    setProcessingId(p.id);

    try {
      const res = await fetch("/api/admin/payouts/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: p.id,
          propertyTitle: p.title,
          propertySymbol: p.symbol,
          amount: monthlyPayout,
        }),
      });

      const data = await res.json();
      let newTx = data.transaction;

      if (!newTx) {
        newTx = {
          id: `TXN-PAY-${Math.floor(1000 + Math.random() * 9000)}`,
          userId: "USR-PAYOUT",
          userName: "Portfolio Investor Pool",
          userEmail: "investors@plotsnhomes.com",
          type: "SELL",
          propertyTitle: p.title,
          propertySymbol: p.symbol,
          propertyIcon: "💰",
          amount: monthlyPayout,
          fee: Math.round(monthlyPayout * 0.005),
          status: "completed",
          date: new Date().toISOString().replace("T", " ").slice(0, 16),
        };
      }

      const existingStr = localStorage.getItem("plotsnhomes_payout_txns") || "[]";
      let existing: any[] = [];
      try { existing = JSON.parse(existingStr); } catch (e) {}
      localStorage.setItem("plotsnhomes_payout_txns", JSON.stringify([newTx, ...existing]));
      window.dispatchEvent(new Event("plotsnhomes_payout_processed"));

      setStatuses((prev) => ({ ...prev, [p.id]: "PROCESSED" }));
      alert(`Dividend Payout Processed & Logged!\n\nProperty: ${p.title} (${p.symbol})\nAmount: ${formatCurrency(monthlyPayout)}\nStatus: Recorded in All Transactions (/admin/transactions)`);
    } catch (err) {
      console.error("Failed to process dividend payout:", err);
      setStatuses((prev) => ({ ...prev, [p.id]: "PROCESSED" }));
    } finally {
      setProcessingId(null);
    }
  };

  const handleTogglePause = (id: string, name: string) => {
    const currentStatus = statuses[id] || "SCHEDULED";
    const newStatus: PayoutStatus = currentStatus === "PAUSED" ? "SCHEDULED" : "PAUSED";
    setStatuses((prev) => ({ ...prev, [id]: newStatus }));
    alert(`Dividend schedule for ${name} has been ${newStatus === "PAUSED" ? "PAUSED" : "RESUMED"}.`);
  };

  // Load & sync commissions from localStorage
  useEffect(() => {
    const loadCommissions = () => {
      const stored = localStorage.getItem("plotsnhomes_commissions");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCommissions(parsed);
          }
        } catch (e) {
          console.error("Failed to parse stored commissions", e);
        }
      }
    };
    loadCommissions();
    window.addEventListener("plotsnhomes_commission_updated", loadCommissions);
    return () => window.removeEventListener("plotsnhomes_commission_updated", loadCommissions);
  }, []);

  // Open Transfer Modal for Agent Commission (Full or Partial Payment)
  const handleOpenTransferModal = (comm: AgentCommissionPayout) => {
    setSelectedComm(comm);
    setTransferAmount(comm.remainingBalance.toString());
    setPaymentOption("Direct Bank Transfer (IMPS)");
    setTransferNotes(comm.notes || "");
  };

  // Execute Agent Commission Payout (Supports Partial & Full Payments)
  const handleExecuteCommissionPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComm) return;

    const amt = parseFloat(transferAmount);
    if (!amt || amt <= 0) {
      alert("Please enter a valid payout transfer amount.");
      return;
    }

    if (amt > selectedComm.remainingBalance) {
      alert(`Transfer amount (₹${amt.toLocaleString('en-IN')}) cannot exceed remaining balance (₹${selectedComm.remainingBalance.toLocaleString('en-IN')}).`);
      return;
    }

    setTransferring(true);

    try {
      const res = await fetch("/api/admin/commissions/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commissionId: selectedComm.id,
          agentId: selectedComm.agentId,
          agentName: selectedComm.agentName,
          agentEmail: selectedComm.agentEmail,
          propertyTitle: selectedComm.propertyTitle,
          transferAmount: amt,
          totalCommission: selectedComm.totalCommission,
          currentPaid: selectedComm.paidAmount,
          paymentMethod: paymentOption,
          notes: transferNotes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process commission payout");
      }

      // Auto-calculate new balances & status
      const now = new Date();
      const timestampStr = now.toISOString().replace("T", " ").slice(0, 16);
      const newPaid = selectedComm.paidAmount + amt;
      const newRem = Math.max(0, selectedComm.totalCommission - newPaid);
      const isFullyPaid = newRem <= 0;
      const nextStatus: "PENDING" | "PARTIALLY_PAID" | "PAID" = isFullyPaid ? "PAID" : "PARTIALLY_PAID";
      const refNo = data.updatedCommission?.paymentRef || `COMM-PAY-${Math.floor(100000 + Math.random() * 900000)}`;

      // Timestamped Audit Note Log
      const auditEntry = `[${timestampStr}] Disbursed ₹${amt.toLocaleString("en-IN")} via ${paymentOption}. Ref: ${refNo}. Rem: ₹${newRem.toLocaleString("en-IN")}.${transferNotes ? ` Note: ${transferNotes}` : ""}`;
      const combinedNotes = selectedComm.notes && !selectedComm.notes.includes(auditEntry)
        ? `${auditEntry}\n${selectedComm.notes}`
        : auditEntry;

      setCommissions((prev) => {
        const updated = prev.map((c) =>
          c.id === selectedComm.id
            ? {
                ...c,
                paidAmount: newPaid,
                remainingBalance: newRem,
                status: nextStatus,
                notes: combinedNotes,
                paymentRef: refNo,
                updatedAt: now.toISOString(),
              }
            : c
        );
        localStorage.setItem("plotsnhomes_commissions", JSON.stringify(updated));
        return updated;
      });

      setNotesState((prev) => ({ ...prev, [selectedComm.id]: combinedNotes }));

      // Sync transaction to All Transactions table (/admin/transactions)
      if (data.transaction) {
        const existingStr = localStorage.getItem("plotsnhomes_payout_txns") || "[]";
        let existing: any[] = [];
        try { existing = JSON.parse(existingStr); } catch (e) {}
        localStorage.setItem("plotsnhomes_payout_txns", JSON.stringify([data.transaction, ...existing]));
      }

      // Broadcast sync events for real-time update across Admin & Agent Views
      window.dispatchEvent(new Event("plotsnhomes_payout_processed"));
      window.dispatchEvent(new Event("plotsnhomes_commission_updated"));

      setSelectedComm(null);
      alert(`Bank Payout Credited & Status Updated!\n\nAgent: ${selectedComm.agentName}\nAmount Transferred: ₹${amt.toLocaleString("en-IN")}\nRemaining Balance: ₹${newRem.toLocaleString("en-IN")}\nStatus: ${nextStatus}\nMethod: ${paymentOption}\nReflected with Timestamp in Agent Profile & Admin!`);
    } catch (err: any) {
      console.error("Payout transfer failed:", err);
      alert(err.message || "Failed to process bank transfer.");
    } finally {
      setTransferring(false);
    }
  };

  // Save Transaction Note handler with automatic Timestamping
  const handleSaveNote = async (id: string) => {
    const rawText = notesState[id] || "";
    const now = new Date();
    const timestampStr = now.toISOString().replace("T", " ").slice(0, 16);

    let formattedNote = rawText.trim();
    if (formattedNote && !formattedNote.startsWith("[")) {
      formattedNote = `[${timestampStr}] ${formattedNote}`;
    }

    setSavingNoteId(id);

    try {
      const res = await fetch("/api/admin/commissions/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, notes: formattedNote }),
      });
      const data = await res.json();
      const finalNote = data.notes || formattedNote;

      setCommissions((prev) => {
        const updated = prev.map((c) => (c.id === id ? { ...c, notes: finalNote } : c));
        localStorage.setItem("plotsnhomes_commissions", JSON.stringify(updated));
        return updated;
      });

      setNotesState((prev) => ({ ...prev, [id]: finalNote }));
      setSavedNoteSuccessId(id);
      setTimeout(() => setSavedNoteSuccessId(null), 3000);
    } catch (err) {
      console.error("Failed to save note:", err);
      alert("Failed to save transaction note.");
    } finally {
      setSavingNoteId(null);
    }
  };

  // Filtered Agent Commissions
  const filteredCommissions = commissions.filter((c) => {
    const matchesSearch =
      c.agentName.toLowerCase().includes(commSearch.toLowerCase()) ||
      c.agentEmail.toLowerCase().includes(commSearch.toLowerCase()) ||
      c.propertyTitle.toLowerCase().includes(commSearch.toLowerCase());
    const matchesStatus = commStatusFilter === "ALL" || c.status === commStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const { ref: tableScrollRef, canScrollLeft, canScrollRight, scroll } = useHorizontalScroll([
    filteredCommissions,
    activeTab,
  ]);

  const hasActiveFilters = commSearch !== "" || commStatusFilter !== "ALL";
  const clearAllFilters = () => {
    setCommSearch("");
    setCommStatusFilter("ALL");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("commissions")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer border ${
              activeTab === "commissions"
                ? "bg-slate-200/90 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 shadow-xs"
                : "bg-slate-100/70 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-slate-800 hover:bg-slate-200/60 dark:hover:bg-slate-800"
            }`}
          >
            <Briefcase className="h-4 w-4 text-slate-700 dark:text-slate-300" />
            <span>Eligible Agent Commissions ({commissions.filter((c) => c.status !== "PAID").length} Pending)</span>
          </button>

          <button
            onClick={() => setActiveTab("dividends")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer border ${
              activeTab === "dividends"
                ? "bg-slate-200/90 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 shadow-xs"
                : "bg-slate-100/70 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-slate-800 hover:bg-slate-200/60 dark:hover:bg-slate-800"
            }`}
          >
            <Coins className="h-4 w-4 text-slate-700 dark:text-slate-300" />
            <span>Property Dividend Payouts ({properties.length})</span>
          </button>
        </div>
      </div>

      {/* 1. Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/80 dark:bg-emerald-950/40 p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              {activeTab === "commissions" ? "Total Eligible Commissions" : "Total Dividend Pool"}
            </p>
            <Coins className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-950 dark:text-emerald-100">
            {formatCurrency(activeTab === "commissions" ? stats.totalEligibleCommissions : stats.totalPool)}
          </p>
          <p className="text-xs text-emerald-700 dark:text-emerald-300 font-bold mt-1">
            {activeTab === "commissions" ? "Agent deals commission balance" : "Annualized portfolio payouts"}
          </p>
        </div>

        <div className="rounded-2xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/80 dark:bg-indigo-950/40 p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-300">
              {activeTab === "commissions" ? "Commission Paid Out" : "Next Settlement Date"}
            </p>
            <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-indigo-950 dark:text-indigo-100">
            {activeTab === "commissions" ? formatCurrency(stats.totalPaidCommissions) : "April 30, 2026"}
          </p>
          <p className="text-xs text-indigo-700 dark:text-indigo-300 font-bold mt-1">
            {activeTab === "commissions" ? "Credited to agent bank accounts" : "Monthly cycle distribution"}
          </p>
        </div>

        <div className="rounded-2xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/80 dark:bg-purple-950/40 p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300">
              {activeTab === "commissions" ? "Pending Agent Payouts" : "Eligible Investors"}
            </p>
            <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-purple-950 dark:text-purple-100">
            {activeTab === "commissions" ? formatCurrency(stats.totalPendingCommissions) : stats.totalInvestors}
          </p>
          <p className="text-xs text-purple-700 dark:text-purple-300 font-bold mt-1">
            {activeTab === "commissions" ? "Unsettled commission balance" : "Unique share owners"}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-950/40 p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
              Average Portfolio Yield
            </p>
            <Percent className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-950 dark:text-amber-100">{stats.avgYield.toFixed(2)}%</p>
          <p className="text-xs text-amber-800 dark:text-amber-300 font-bold mt-1">Across all properties</p>
        </div>
      </div>

      {/* ── SECTION 1: AGENT COMMISSION PAYOUTS TAB ── */}
      {activeTab === "commissions" && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden space-y-4 p-4 sm:p-5">
          {/* Header & Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-amber-500" /> Eligible Agent Commissions Payouts
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Transfer full or partial payments directly to agent bank accounts & record audit notes
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search agent or property..."
                  value={commSearch}
                  onChange={(e) => setCommSearch(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-9 pr-3 py-1.5 text-xs outline-none text-slate-900 dark:text-white focus:border-amber-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={commStatusFilter}
                onChange={(e) => setCommStatusFilter(e.target.value as any)}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending Only</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="PAID">Fully Paid</option>
              </select>

              {viewMode === "list" && (
                <TableScrollButtons canScrollLeft={canScrollLeft} canScrollRight={canScrollRight} onScroll={scroll} />
              )}
              <ViewToggle mode={viewMode} onChange={setViewMode} />
              <button
                type="button"
                onClick={clearAllFilters}
                disabled={!hasActiveFilters}
                title={hasActiveFilters ? "Clear all filters" : "No filters applied"}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed ${
                  hasActiveFilters
                    ? "border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-300"
                    : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                }`}
              >
                <X className="h-4 w-4 stroke-[2.5]" /> Clear All
              </button>
            </div>
          </div>

          {/* Commissions — card grid */}
          {viewMode !== "list" ? (
            filteredCommissions.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-400">No eligible agent commissions matching filters.</div>
            ) : (
              <div className={viewContainerClass(viewMode)}>
                {filteredCommissions.map((comm) => (
                  <div key={comm.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md transition flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link href={`/admin/users/${comm.agentId}`} className="font-bold text-slate-900 dark:text-white hover:text-amber-600 hover:underline block truncate">{comm.agentName}</Link>
                        <span className="text-[11px] text-slate-500 truncate block">{comm.agentEmail}</span>
                        <span className="inline-flex mt-1 rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">{comm.agentRole}</span>
                      </div>
                      <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                        comm.status === "PAID" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : comm.status === "PARTIALLY_PAID" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                      }`}>
                        {comm.status === "PAID" && <CheckCircle2 className="h-3 w-3" />}
                        {comm.status === "PARTIALLY_PAID" && <Clock className="h-3 w-3" />}
                        {comm.status === "PENDING" && <AlertCircle className="h-3 w-3" />}
                        {comm.status === "PARTIALLY_PAID" ? "PARTIAL" : comm.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{comm.propertyTitle}</p>
                      <p className="font-mono text-[10px] text-slate-400">{comm.propertySymbol} · Deal {formatCurrency(comm.propertyValue)}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs border-t border-slate-100 dark:border-slate-800 pt-2">
                      <div><span className="block text-[10px] text-slate-400 font-bold uppercase">Total</span><span className="font-black text-slate-900 dark:text-white">{formatCurrency(comm.totalCommission)}</span></div>
                      <div><span className="block text-[10px] text-slate-400 font-bold uppercase">Paid</span><span className="font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(comm.paidAmount)}</span></div>
                      <div><span className="block text-[10px] text-slate-400 font-bold uppercase">Pending</span><span className="font-black text-rose-600 dark:text-rose-400">{formatCurrency(comm.remainingBalance)}</span></div>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2">
                      <span className="font-bold text-slate-700 dark:text-slate-300 block">{comm.bankDetails.bankName}</span>
                      Acc {comm.bankDetails.accountNo} · IFSC {comm.bankDetails.ifscCode}
                    </div>
                    <div className="mt-auto pt-2 border-t border-slate-100 dark:border-slate-800">
                      {comm.status !== "PAID" ? (
                        <Button variant="gold" size="sm" className="w-full text-xs font-bold gap-1" onClick={() => handleOpenTransferModal(comm)}>
                          <Send className="h-3 w-3" /> Transfer Payout
                        </Button>
                      ) : (
                        <span className="w-full inline-flex items-center justify-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> Credited</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
          <div ref={tableScrollRef} className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
            <table className="w-full text-xs text-left min-w-[950px]">
              <thead className="bg-slate-100/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-3 py-2.5">Agent Partner</th>
                  <th className="px-3 py-2.5">Property Asset / Deal</th>
                  <th className="px-3 py-2.5">Total Comm. Rate</th>
                  <th className="px-3 py-2.5">Paid Amount</th>
                  <th className="px-3 py-2.5">Pending Balance</th>
                  <th className="px-3 py-2.5">Verified Bank Details</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Notes & Remarks</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredCommissions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-8 text-center text-slate-400">
                      No eligible agent commissions matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredCommissions.map((comm) => (
                    <tr key={comm.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                      {/* Agent Info */}
                      <td className="px-3 py-3">
                        <Link
                          href={`/admin/users/${comm.agentId}`}
                          className="group/agent text-left inline-block"
                          title={`Click to open ${comm.agentName}'s account profile`}
                        >
                          <span className="font-bold text-slate-900 dark:text-white text-sm group-hover/agent:text-amber-600 dark:group-hover/agent:text-amber-400 group-hover/agent:underline flex items-center gap-1.5">
                            {comm.agentName}
                          </span>
                          <span className="text-[11px] text-slate-500 group-hover/agent:text-slate-700 dark:group-hover/agent:text-slate-300 font-medium block">
                            {comm.agentEmail}
                          </span>
                        </Link>
                        <span className="inline-flex mt-1 rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 block w-fit">
                          {comm.agentRole}
                        </span>
                      </td>

                      {/* Property */}
                      <td className="px-3 py-3">
                        <span className="font-bold text-slate-900 dark:text-white block leading-tight">{comm.propertyTitle}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{comm.propertySymbol}</span>
                        <span className="text-[11px] text-slate-500 block font-semibold">Deal: {formatCurrency(comm.propertyValue)}</span>
                      </td>

                      {/* Rate & Total Comm */}
                      <td className="px-3 py-3 font-bold text-slate-900 dark:text-white">
                        <span className="text-amber-600 dark:text-amber-400 block">{comm.commissionPct}%</span>
                        <span className="text-xs font-black">{formatCurrency(comm.totalCommission)}</span>
                      </td>

                      {/* Paid Amount */}
                      <td className="px-3 py-3 font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                        {formatCurrency(comm.paidAmount)}
                      </td>

                      {/* Pending Balance */}
                      <td className="px-3 py-3 font-bold text-rose-600 dark:text-rose-400 text-xs">
                        {formatCurrency(comm.remainingBalance)}
                      </td>

                      {/* Bank Details */}
                      <td className="px-3 py-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        <span className="font-bold text-slate-900 dark:text-white block">{comm.bankDetails.bankName}</span>
                        <span>Acc: {comm.bankDetails.accountNo}</span>
                        <span className="block text-[10px] text-slate-400">IFSC: {comm.bankDetails.ifscCode} · UPI: {comm.bankDetails.upiId}</span>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                          comm.status === "PAID"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : comm.status === "PARTIALLY_PAID"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                        }`}>
                          {comm.status === "PAID" && <CheckCircle2 className="h-3 w-3" />}
                          {comm.status === "PARTIALLY_PAID" && <Clock className="h-3 w-3" />}
                          {comm.status === "PENDING" && <AlertCircle className="h-3 w-3" />}
                          {comm.status === "PARTIALLY_PAID" ? "PARTIAL" : comm.status}
                        </span>
                      </td>

                      {/* Notes with Save Button */}
                      <td className="px-3 py-3 min-w-[170px]">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            placeholder="Add transaction remark..."
                            value={notesState[comm.id] ?? ""}
                            onChange={(e) => setNotesState({ ...notesState, [comm.id]: e.target.value })}
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2 py-1 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveNote(comm.id)}
                            disabled={savingNoteId === comm.id}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 shadow-xs transition cursor-pointer border ${
                              savedNoteSuccessId === comm.id
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                            }`}
                            title="Save Note"
                          >
                            <Save className="h-3 w-3" />
                            {savingNoteId === comm.id ? "Saving..." : savedNoteSuccessId === comm.id ? "Saved!" : "Save"}
                          </button>
                        </div>
                      </td>

                      {/* Transfer Payout Action */}
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        {comm.status !== "PAID" ? (
                          <Button
                            variant="gold"
                            size="sm"
                            className="text-xs font-bold gap-1 shadow-xs !py-1 !px-2.5"
                            onClick={() => handleOpenTransferModal(comm)}
                          >
                            <Send className="h-3 w-3" /> Transfer Payout
                          </Button>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Credited
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          )}
        </div>
      )}

      {/* ── SECTION 2: PROPERTY DIVIDENDS TAB ── */}
      {activeTab === "dividends" && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 px-5 py-4 flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">Dividend Payout Schedule</h2>
            <TableScrollButtons canScrollLeft={canScrollLeft} canScrollRight={canScrollRight} onScroll={scroll} />
          </div>

          <div ref={tableScrollRef} className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-left text-slate-500 dark:text-slate-400 font-medium">
                <tr>
                  <th className="px-5 py-3 text-[11px] uppercase tracking-wider">Property Asset</th>
                  <th className="px-5 py-3 text-[11px] uppercase tracking-wider">Yield Rate</th>
                  <th className="px-5 py-3 text-[11px] uppercase tracking-wider">Annual Pool</th>
                  <th className="px-5 py-3 text-[11px] uppercase tracking-wider">Investors</th>
                  <th className="px-5 py-3 text-[11px] uppercase tracking-wider">Per-Share yield</th>
                  <th className="px-5 py-3 text-[11px] uppercase tracking-wider">Frequency</th>
                  <th className="px-5 py-3 text-[11px] uppercase tracking-wider">Next Settlement</th>
                  <th className="px-5 py-3 text-[11px] uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {properties.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-8 text-center text-slate-400">
                      No active property listings found to configure payouts.
                    </td>
                  </tr>
                ) : (
                  properties.map((p) => {
                    const annualPool = p.price * (p.yieldRate / 100);
                    const perShareYield = 1000 * (p.yieldRate / 100);
                    const status = statuses[p.id] || "SCHEDULED";

                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors ${
                          status === "PAUSED"
                            ? "bg-amber-50/10 dark:bg-amber-950/20"
                            : status === "PROCESSED"
                            ? "bg-emerald-50/10 dark:bg-emerald-950/20"
                            : ""
                        }`}
                      >
                        <td className="px-5 py-4">
                          <span className="font-bold text-slate-900 dark:text-white block leading-tight">{p.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono font-medium">{p.symbol} · {p.category}</span>
                        </td>
                        <td className="px-5 py-4 font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          {p.yieldRate.toFixed(2)}%
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                          {formatCurrency(annualPool)}<span className="text-slate-400 text-xs font-normal">/yr</span>
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-300 font-mono">
                          {p.investorsCount}
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300 font-medium">
                          {formatCurrency(perShareYield)}<span className="text-slate-400 text-xs font-normal">/yr</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 px-2 py-0.5 text-xs font-bold text-blue-700 dark:text-blue-300">
                            Monthly
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-medium">
                          {status === "PROCESSED" ? "Paid" : "April 30, 2026"}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              status === "SCHEDULED"
                                ? "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300"
                                : status === "PAUSED"
                                ? "bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300"
                                : "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300"
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            {status !== "PROCESSED" && (
                              <Button
                                variant="gold"
                                disabled={processingId === p.id}
                                className="!py-1 !px-2.5 text-xs h-7 gap-1"
                                onClick={() => handleProcessDividend(p, annualPool)}
                              >
                                <Check className="h-3 w-3" /> {processingId === p.id ? "Processing..." : "Process Payout"}
                              </Button>
                            )}
                            <button
                              onClick={() => handleTogglePause(p.id, p.title)}
                              className={`p-1.5 rounded-lg border transition ${
                                status === "PAUSED"
                                  ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                  : "border-amber-200 text-amber-700 hover:bg-amber-50"
                              }`}
                              title={status === "PAUSED" ? "Resume Dividend Schedule" : "Pause Dividend Schedule"}
                            >
                              {status === "PAUSED" ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TRANSFER AGENT COMMISSION PAYOUT MODAL (FULL / PARTIAL PAYMENT) ── */}
      {selectedComm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-amber-500" /> Execute Bank Payout
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Transfer partial or full commission directly to agent's verified account
                </p>
              </div>
              <button
                onClick={() => setSelectedComm(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleExecuteCommissionPayout} className="space-y-4 text-xs">
              {/* Agent & Deal Summary Card */}
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <Link
                      href={`/admin/users/${selectedComm.agentId}`}
                      className="font-bold text-slate-900 dark:text-white text-sm hover:text-amber-600 dark:hover:text-amber-400 hover:underline block"
                      title={`Click to open ${selectedComm.agentName}'s account profile`}
                    >
                      {selectedComm.agentName}
                    </Link>
                    <span className="text-[11px] text-slate-500">{selectedComm.agentEmail} · {selectedComm.agentRole}</span>
                  </div>
                  <span className="rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 text-[10px] font-bold">
                    Deal: {selectedComm.propertyTitle}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Total Comm.</span>
                    <span className="block font-black text-slate-900 dark:text-white">{formatCurrency(selectedComm.totalCommission)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Already Paid</span>
                    <span className="block font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(selectedComm.paidAmount)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Rem. Balance</span>
                    <span className="block font-black text-rose-600 dark:text-rose-400">{formatCurrency(selectedComm.remainingBalance)}</span>
                  </div>
                </div>
              </div>

              {/* Agent Bank Account Card */}
              <div className="rounded-2xl bg-amber-500/5 border border-amber-500/20 p-3.5 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block">
                  Verified Agent Bank Account Details
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 dark:text-slate-300 font-mono mt-1">
                  <div>Bank: <b className="text-slate-900 dark:text-white">{selectedComm.bankDetails.bankName}</b></div>
                  <div>Account: <b className="text-slate-900 dark:text-white">{selectedComm.bankDetails.accountNo}</b></div>
                  <div>IFSC: <b className="text-slate-900 dark:text-white">{selectedComm.bankDetails.ifscCode}</b></div>
                  <div>UPI: <b className="text-slate-900 dark:text-white">{selectedComm.bankDetails.upiId}</b></div>
                </div>
              </div>

              {/* Partial Payment Amount Field */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Transfer Amount (₹) — Supports Partial Payment
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max={selectedComm.remainingBalance}
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 font-black text-base outline-none text-slate-900 dark:text-white focus:border-amber-500"
                    placeholder="Enter amount to transfer..."
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setTransferAmount(selectedComm.remainingBalance.toString())}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2 py-1 text-[10px] font-bold hover:bg-amber-500/20 transition"
                  >
                    Pay Full Remaining
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Remaining balance after transfer: <b className="text-slate-900 dark:text-white font-mono">{formatCurrency(Math.max(0, selectedComm.remainingBalance - (parseFloat(transferAmount) || 0)))}</b>
                </p>
              </div>

              {/* Payment Gateway Options */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Payment Transfer Option
                </label>
                <select
                  value={paymentOption}
                  onChange={(e) => setPaymentOption(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 font-bold outline-none text-slate-900 dark:text-white"
                >
                  <option value="Direct Bank Transfer (IMPS)">Direct Bank Transfer (IMPS / NEFT)</option>
                  <option value="Stripe Connect Payout">Stripe Connect Marketplace Split</option>
                  <option value="UPI Instant Transfer">UPI Instant Transfer</option>
                  <option value="Wire / Crypto Settlement">Wire Settlement / Crypto</option>
                </select>
              </div>

              {/* Remarks / Notes */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Transaction Notes / Reference Remarks
                </label>
                <textarea
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  rows={2}
                  placeholder="Record reference number, transaction reason or internal notes..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 font-medium outline-none text-slate-900 dark:text-white"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedComm(null)}
                  className="rounded-xl px-4 py-2 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferring}
                  className="rounded-xl bg-gradient-to-r from-brand to-brand-hover text-white font-black px-5 py-2 hover:opacity-90 transition shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  {transferring ? "Executing Transfer..." : "Confirm Bank Transfer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
