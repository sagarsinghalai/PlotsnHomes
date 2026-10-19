"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  Coins,
  DollarSign,
  Edit,
  ExternalLink,
  Filter,
  Layers,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  TrendingUp,
  User,
  Users,
  X,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useHorizontalScroll } from "@/hooks/use-horizontal-scroll";
import { TableScrollButtons } from "@/components/ui/table-scroll-buttons";

export type CommissionRecord = {
  id: string;
  agentId: string;
  propertyId: string | null;
  propertyTitle: string;
  propertySymbol: string | null;
  propertyValue: number;
  commissionPct: number;
  commissionAmount: number;
  paidAmount?: number;
  remainingBalance?: number;
  status: "PENDING" | "PAID" | "CANCELLED";
  paidAt: string | null;
  paymentRef: string | null;
  notes: string | null;
  soldAt: string | null;
  createdAt: string;
  updatedAt: string;
  propertyListedAt: string | null;
  lead: {
    id: string;
    userId?: string | null;
    name: string;
    email: string;
    phone: string | null;
    stage: string;
    createdAt: string;
  } | null;
};

export type AgentProperty = {
  id: string;
  title: string;
  symbol: string;
  price: number;
  status: string;
  brokerageRate: number;
  leadsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AgentLead = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  stage: string;
  propertyId: string | null;
  propertyTitle: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CommissionSummary = {
  totalAssignedProperties: number;
  totalSoldProperties: number;
  totalPropertiesValue: number;
  totalLeadsCount: number;
  totalCommissionEarned: number;
  commissionPaid: number;
  commissionPending: number;
};

export type AgentInfo = {
  id: string;
  name: string;
  email: string;
  role: string;
  commissionRate: number;
};

export function AgentCommissionTracker({
  agentId,
  isAdmin = true,
}: {
  agentId: string;
  isAdmin?: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [, startTransition] = useTransition();

  const [agent, setAgent] = useState<AgentInfo | null>(null);
  const [summary, setSummary] = useState<CommissionSummary | null>(null);
  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
  const [properties, setProperties] = useState<AgentProperty[]>([]);
  const [leads, setLeads] = useState<AgentLead[]>([]);

  // Filter state
  const [activeTab, setActiveTab] = useState<"ALL" | "PAID" | "PENDING" | "LEADS">("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Base rate editing modal/state
  const [editingBaseRate, setEditingBaseRate] = useState(false);
  const [newBaseRate, setNewBaseRate] = useState<number>(3.0);

  // Individual Commission Editing Modal
  const [selectedCommission, setSelectedCommission] = useState<CommissionRecord | null>(null);
  const [editForm, setEditForm] = useState({
    commissionPct: 3.0,
    status: "PENDING" as "PENDING" | "PAID" | "CANCELLED",
    paymentRef: "",
    notes: "",
  });

  // Manual New Entry Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    propertyTitle: "",
    propertyValue: 0,
    commissionPct: 3.0,
    status: "PENDING" as "PENDING" | "PAID",
    paymentRef: "",
    notes: "",
  });

  // Lead breakdown modal
  const [selectedPropertyLeads, setSelectedPropertyLeads] = useState<{
    propertyTitle: string;
    leads: AgentLead[];
  } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/commission?agentId=${agentId}`);
      const data = await res.json();
      if (res.ok) {
        setAgent(data.agent);
        let commList = data.commissions || [];

        // Merge localStorage payouts if available for this agent
        const storedStr = localStorage.getItem("plotsnhomes_commissions");
        if (storedStr) {
          try {
            const storedList = JSON.parse(storedStr);
            if (Array.isArray(storedList)) {
              for (const sc of storedList) {
                if (sc.agentId === agentId || (data.agent?.name && sc.agentName?.toLowerCase() === data.agent.name.toLowerCase())) {
                  const idx = commList.findIndex((c: any) => c.id === sc.id || c.propertyTitle === sc.propertyTitle);
                  if (idx >= 0) {
                    commList[idx] = {
                      ...commList[idx],
                      status: sc.status === "PAID" ? "PAID" : sc.status || commList[idx].status,
                      paidAt: sc.updatedAt || commList[idx].paidAt,
                      paymentRef: sc.paymentRef || commList[idx].paymentRef,
                      notes: sc.notes || commList[idx].notes,
                      paidAmount: sc.paidAmount !== undefined ? sc.paidAmount : commList[idx].paidAmount,
                      remainingBalance: sc.remainingBalance !== undefined ? sc.remainingBalance : commList[idx].remainingBalance,
                    };
                  } else {
                    const tot = sc.totalCommission || sc.commissionAmount || 0;
                    const pAmt = sc.paidAmount !== undefined ? sc.paidAmount : (sc.status === "PAID" ? tot : 0);
                    const rBal = sc.remainingBalance !== undefined ? sc.remainingBalance : Math.max(0, tot - pAmt);

                    commList.push({
                      id: sc.id,
                      agentId: agentId,
                      propertyId: sc.propertyId || null,
                      propertyTitle: sc.propertyTitle || "Property Deal",
                      propertySymbol: sc.propertySymbol || "COMM",
                      propertyValue: sc.totalCommission ? sc.totalCommission * 25 : 10000000,
                      commissionPct: sc.commissionPct || 3.0,
                      commissionAmount: tot,
                      paidAmount: pAmt,
                      remainingBalance: rBal,
                      status: sc.status === "PAID" ? "PAID" : sc.status === "PARTIALLY_PAID" ? "PARTIALLY_PAID" : "PENDING",
                      paidAt: sc.updatedAt || new Date().toISOString(),
                      paymentRef: sc.paymentRef || null,
                      notes: sc.notes || null,
                      soldAt: sc.updatedAt || new Date().toISOString(),
                      createdAt: sc.updatedAt || new Date().toISOString(),
                      updatedAt: sc.updatedAt || new Date().toISOString(),
                      propertyListedAt: null,
                      lead: null,
                    });
                  }
                }
              }
            }
          } catch (e) {}
        }

        // Calculate accurate Commission Paid & Pending including Partial Payments & Payout Transactions
        let calculatedPaid = 0;
        let calculatedTotal = 0;

        for (const c of commList) {
          const dealTotal = Number(c.commissionAmount || c.totalCommission || 0);
          calculatedTotal += dealTotal;

          let paidVal = 0;
          if (c.paidAmount !== undefined && c.paidAmount !== null) {
            paidVal = Number(c.paidAmount);
          } else if (c.status === "PAID") {
            paidVal = dealTotal;
          }
          calculatedPaid += paidVal;
        }

        // Cross-verify with plotsnhomes_payout_txns
        const payoutTxnsStr = localStorage.getItem("plotsnhomes_payout_txns");
        let localPayoutsSum = 0;
        if (payoutTxnsStr) {
          try {
            const pTxns = JSON.parse(payoutTxnsStr);
            if (Array.isArray(pTxns)) {
              for (const pt of pTxns) {
                const matchesAgent =
                  pt.userId === agentId ||
                  (data.agent?.name && pt.userName?.toLowerCase() === data.agent.name.toLowerCase()) ||
                  (data.agent?.email && pt.userEmail?.toLowerCase() === data.agent.email.toLowerCase());

                if (matchesAgent && (pt.status?.toLowerCase() === "completed" || pt.status === "COMPLETED")) {
                  localPayoutsSum += Number(pt.amount || 0);
                }
              }
            }
          } catch (e) {}
        }

        // Sync Paid & Pending with Payouts strictly against calculated total
        let finalPaid = calculatedPaid;
        if (localPayoutsSum > 0) {
          finalPaid = Math.min(calculatedTotal, Math.max(calculatedPaid, localPayoutsSum));
        }
        const finalPending = Math.max(0, calculatedTotal - finalPaid);

        const totalSoldProps = Math.max(
          data.summary?.totalSoldProperties || 0,
          commList.length,
          (data.properties || []).filter((p: any) => p.status === "SOLD").length
        );

        const totalPropsVal = data.summary?.totalPropertiesValue || commList.reduce((sum: number, c: any) => sum + (c.propertyValue || 0), 0);

        setSummary({
          totalAssignedProperties: Math.max(data.summary?.totalAssignedProperties || 0, (data.properties || []).length, commList.length),
          totalSoldProperties: totalSoldProps,
          totalPropertiesValue: totalPropsVal,
          totalLeadsCount: data.summary?.totalLeadsCount || (data.leads || []).length,
          totalCommissionEarned: calculatedTotal,
          commissionPaid: finalPaid,
          commissionPending: finalPending,
        });
        setCommissions(commList);
        setProperties(data.properties || []);
        setLeads(data.leads || []);
        setNewBaseRate(data.agent?.commissionRate || 3.0);
      } else {
        setError(data.error || "Failed to load commission data");
      }
    } catch {
      setError("Network error while loading commission tracker");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const handleSync = () => fetchData();
    window.addEventListener("plotsnhomes_commission_updated", handleSync);
    window.addEventListener("plotsnhomes_payout_processed", handleSync);
    return () => {
      window.removeEventListener("plotsnhomes_commission_updated", handleSync);
      window.removeEventListener("plotsnhomes_payout_processed", handleSync);
    };
  }, [agentId]);

  const handleSaveBaseRate = async () => {
    try {
      const res = await fetch("/api/admin/commission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_AGENT_RATE",
          agentId,
          commissionRate: Number(newBaseRate),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg("Agent default commission rate updated successfully!");
        setEditingBaseRate(false);
        fetchData();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setError(data.error || "Failed to update base rate");
      }
    } catch {
      setError("Error saving agent commission rate");
    }
  };

  const handleOpenEditCommission = (comm: CommissionRecord) => {
    setSelectedCommission(comm);
    setEditForm({
      commissionPct: comm.commissionPct,
      status: comm.status,
      paymentRef: comm.paymentRef || "",
      notes: comm.notes || "",
    });
  };

  const handleSaveCommissionEdit = async () => {
    if (!selectedCommission) return;
    try {
      const res = await fetch("/api/admin/commission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_COMMISSION",
          agentId,
          commissionId: selectedCommission.id,
          commissionPct: Number(editForm.commissionPct),
          status: editForm.status,
          paymentRef: editForm.paymentRef || null,
          notes: editForm.notes || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg("Commission record updated successfully!");
        setSelectedCommission(null);
        fetchData();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setError(data.error || "Failed to update commission record");
      }
    } catch {
      setError("Error saving commission edit");
    }
  };

  const handleCreateCommission = async () => {
    if (!addForm.propertyTitle.trim() || addForm.propertyValue <= 0) {
      setError("Please provide a valid property title and property value.");
      return;
    }
    try {
      const res = await fetch("/api/admin/commission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_COMMISSION",
          agentId,
          propertyTitle: addForm.propertyTitle,
          propertyValue: Number(addForm.propertyValue),
          commissionPct: Number(addForm.commissionPct),
          status: addForm.status,
          paymentRef: addForm.paymentRef || null,
          notes: addForm.notes || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg("New commission entry added successfully!");
        setShowAddModal(false);
        setAddForm({
          propertyTitle: "",
          propertyValue: 0,
          commissionPct: agent?.commissionRate || 3.0,
          status: "PENDING",
          paymentRef: "",
          notes: "",
        });
        fetchData();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setError(data.error || "Failed to add commission entry");
      }
    } catch {
      setError("Error creating commission entry");
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filtered lists
  const filteredCommissions = commissions.filter((c) => {
    const matchesSearch =
      c.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.propertySymbol && c.propertySymbol.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.paymentRef && c.paymentRef.toLowerCase().includes(searchTerm.toLowerCase()));
    if (activeTab === "PAID") return matchesSearch && c.status === "PAID";
    if (activeTab === "PENDING") return matchesSearch && c.status === "PENDING";
    return matchesSearch;
  });

  const filteredLeads = leads.filter(
    (l) =>
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.propertyTitle && l.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const { ref: tableScrollRef, canScrollLeft, canScrollRight, scroll } = useHorizontalScroll([
    filteredCommissions,
    filteredLeads,
    activeTab,
  ]);

  const hasActiveFilters = searchTerm !== "" || activeTab !== "ALL";
  const clearAllFilters = () => {
    setSearchTerm("");
    setActiveTab("ALL");
  };

  if (loading) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm my-6">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent mb-3" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading Agent Commission Tracker...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 my-6">
      {/* Messages */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-sm font-semibold text-red-700 dark:text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} className="text-red-500 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-sm font-semibold text-emerald-700 dark:text-emerald-300 flex items-center justify-between animate-in fade-in">
          <span>✓ {successMsg}</span>
          <button type="button" onClick={() => setSuccessMsg("")} className="text-emerald-500 hover:text-emerald-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Tracker Header - Clean White Box with Black Text */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200 text-slate-900 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Coins className="h-6 w-6 text-amber-600" />
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Agent Commission Tracker</h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white border border-slate-300 text-slate-900 shadow-sm">
              Live Real-Time Tracker
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Track properties leads, sold properties, property values, admin-configured commission rates &amp; paid/pending timestamps.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={fetchData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold transition border border-slate-300 shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-900" />
            <span>Refresh</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition shadow-sm"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>Add Commission Entry</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Grid - Clean White Boxes */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {/* KPI 1: Sold Properties & Total Value */}
        <div className="rounded-2xl border border-slate-200 bg-white dark:bg-slate-900 p-4 shadow-sm transition hover:border-slate-300">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Properties Sold</span>
            <Building2 className="h-4 w-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {summary?.totalSoldProperties || 0} <span className="text-xs font-normal text-slate-500">sold</span>
          </p>
          <p className="text-[11px] font-bold text-slate-900 dark:text-slate-200 mt-0.5">
            Valued at {formatCurrency(summary?.totalPropertiesValue || 0)}
          </p>
        </div>

        {/* KPI 2: Total Commission Earned */}
        <div className="rounded-2xl border border-slate-200 bg-white dark:bg-slate-900 p-4 shadow-sm transition hover:border-slate-300">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Total Comm. Earned</span>
            <Coins className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {formatCurrency(summary?.totalCommissionEarned || 0)}
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">Across {summary?.totalSoldProperties || 0} deals & sales</p>
        </div>

        {/* KPI 3: Commission Paid */}
        <div className="rounded-2xl border border-slate-200 bg-white dark:bg-slate-900 p-4 shadow-sm transition hover:border-slate-300">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Commission Paid</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {formatCurrency(summary?.commissionPaid || 0)}
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">Settled payouts with timestamp</p>
        </div>

        {/* KPI 4: Commission Pending & Rate */}
        <div className="rounded-2xl border border-slate-200 bg-white dark:bg-slate-900 p-4 shadow-sm transition hover:border-slate-300">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Commission Pending</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {formatCurrency(summary?.commissionPending || 0)}
          </p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] font-bold text-slate-900 dark:text-slate-200">
              Agent Rate: {agent?.commissionRate || 3}%
            </span>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setEditingBaseRate(true)}
                className="text-[10px] font-bold text-slate-900 dark:text-amber-400 underline hover:text-amber-600"
              >
                Edit Rate
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Admin Base Rate Edit Section */}
      {editingBaseRate && (
        <div className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center justify-between gap-4 shadow-sm">
          <div className="space-y-0.5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Agent Default Commission Rate
            </p>
            <p className="text-xs text-slate-500 font-medium">
              Admin can mention default commission % for this individual agent. Can be overridden per property.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={newBaseRate}
                onChange={(e) => setNewBaseRate(parseFloat(e.target.value) || 0)}
                className="w-24 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-900 pr-7 outline-none shadow-sm"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">%</span>
            </div>
            <button
              type="button"
              onClick={handleSaveBaseRate}
              className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-sm"
            >
              Save Rate
            </button>
            <button
              type="button"
              onClick={() => setEditingBaseRate(false)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 shadow-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tabs & Filter Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-3.5">
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          {[
            { key: "ALL", label: `All (${commissions.length})` },
            { key: "PENDING", label: `Pending (${commissions.filter((c) => c.status === "PENDING").length})` },
            { key: "PAID", label: `Paid (${commissions.filter((c) => c.status === "PAID").length})` },
            { key: "LEADS", label: `Property Leads (${leads.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.key
                  ? "bg-brand text-white shadow-sm"
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="search"
              placeholder="Search by ID, property, or lead..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none shadow-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/80 transition-all"
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

      {/* Main Table View */}
      {activeTab !== "LEADS" ? (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div ref={tableScrollRef} className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Property Details</th>
                  <th className="px-5 py-3.5">Leads</th>
                  <th className="px-5 py-3.5">Property Value</th>
                  <th className="px-5 py-3.5">Comm. %</th>
                  <th className="px-5 py-3.5">Calculated Comm.</th>
                  <th className="px-5 py-3.5">Payout Status</th>
                  <th className="px-5 py-3.5">Timestamps</th>
                  {isAdmin && <th className="px-5 py-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredCommissions.length > 0 ? (
                  filteredCommissions.map((comm) => {
                    const matchedProperty = properties.find((p) => p.id === comm.propertyId);
                    const propLeads = leads.filter((l) => l.propertyId === comm.propertyId);

                    return (
                      <tr key={comm.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group">
                        {/* Property */}
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900 dark:text-white text-sm tracking-tight leading-snug">
                            {comm.propertyTitle}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {comm.propertySymbol && (
                              <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                                {comm.propertySymbol}
                              </span>
                            )}
                            {comm.propertySymbol && comm.lead && (
                              <span className="text-slate-300 dark:text-slate-700">•</span>
                            )}
                            {comm.lead && (
                              <Link
                                href={`/admin/leads?search=${encodeURIComponent(comm.lead.name || comm.lead.email)}`}
                                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                <span>Lead: {comm.lead.name}</span>
                                <span className="text-[10px] text-slate-400 font-normal">({comm.lead.stage})</span>
                              </Link>
                            )}
                          </div>
                        </td>

                        {/* Associated Leads */}
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedPropertyLeads({
                                propertyTitle: comm.propertyTitle,
                                leads: propLeads,
                              })
                            }
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          >
                            <Users className="h-3.5 w-3.5 text-slate-400" />
                            <span>{propLeads.length} Lead{propLeads.length === 1 ? "" : "s"}</span>
                          </button>
                        </td>

                        {/* Property Value */}
                        <td className="px-5 py-4 font-semibold text-slate-900 dark:text-slate-100 text-sm tabular-nums">
                          {formatCurrency(comm.propertyValue)}
                        </td>

                        {/* Commission % */}
                        <td className="px-5 py-4 font-bold text-slate-800 dark:text-slate-200 text-sm tabular-nums">
                          {comm.commissionPct}%
                        </td>

                        {/* Commission Amount */}
                        <td className="px-5 py-4 font-bold text-emerald-600 dark:text-emerald-400 text-sm tabular-nums">
                          {formatCurrency(comm.commissionAmount)}
                        </td>

                        {/* Payout Status & Breakdown */}
                        <td className="px-5 py-4">
                          {(() => {
                            const dealTotal = Number(comm.commissionAmount || 0);
                            const pAmt = comm.paidAmount !== undefined ? comm.paidAmount : (comm.status === "PAID" ? dealTotal : 0);
                            const rBal = comm.remainingBalance !== undefined ? comm.remainingBalance : Math.max(0, dealTotal - pAmt);
                            const isPaid = comm.status === "PAID" || rBal <= 0;
                            const isPartial = !isPaid && pAmt > 0;

                            return (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-xs font-bold">
                                  {isPaid ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md text-[11px]">
                                      <CheckCircle2 className="h-3 w-3" /> PAID
                                    </span>
                                  ) : isPartial ? (
                                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-md text-[11px]">
                                      <Clock className="h-3 w-3" /> PARTIAL
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-md text-[11px]">
                                      <AlertCircle className="h-3 w-3" /> PENDING
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                                  <span>Paid: <b className="text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(pAmt)}</b></span>
                                  <span className="mx-1 text-slate-300 dark:text-slate-700">•</span>
                                  <span>Rem: <b className="text-rose-600 dark:text-rose-400 font-bold">{formatCurrency(rBal)}</b></span>
                                </div>
                                {comm.paymentRef && (
                                  <p className="text-[10px] text-slate-400 font-mono">
                                    Ref: {comm.paymentRef}
                                  </p>
                                )}
                              </div>
                            );
                          })()}
                        </td>

                        {/* Timestamps */}
                        <td className="px-5 py-4 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">Sold:</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">{formatDate(comm.soldAt)}</span>
                          </div>
                          {comm.paidAt && (
                            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                              <span>Paid:</span> {formatDate(comm.paidAt)}
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <span>Logged:</span> <span>{formatDate(comm.createdAt)}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        {isAdmin && (
                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenEditCommission(comm)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs shadow-2xs transition-all"
                            >
                              <Edit className="h-3.5 w-3.5 text-slate-500" />
                              <span>Manage</span>
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={isAdmin ? 8 : 7} className="px-5 py-10 text-center text-slate-400 dark:text-slate-500 italic">
                      No commission records found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Property Leads View */
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div ref={tableScrollRef} className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Lead Name &amp; Contact</th>
                  <th className="px-5 py-3.5">Associated Property</th>
                  <th className="px-5 py-3.5">Pipeline Stage</th>
                  <th className="px-5 py-3.5">Lead Created Timestamp</th>
                  <th className="px-5 py-3.5">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredLeads.length > 0 ? (
                  filteredLeads.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">{l.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{l.email} {l.phone ? `· ${l.phone}` : ""}</p>
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-800 dark:text-slate-200">
                        {l.propertyTitle || "Unassigned"}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                          l.stage === "WON"
                            ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60"
                            : l.stage === "LOST"
                            ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/70 dark:border-rose-800/60"
                            : "bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200/70 dark:border-sky-800/60"
                        }`}>
                          {l.stage}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[11px] text-slate-500 dark:text-slate-400">
                        {formatDate(l.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-[11px] text-slate-500 dark:text-slate-400">
                        {formatDate(l.updatedAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-slate-400 dark:text-slate-500 italic">
                      No property leads associated with this agent profile.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Commission Modal */}
      {selectedCommission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Coins className="h-5 w-5 text-brand" />
                  Manage Commission &amp; Payout
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedCommission.propertyTitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCommission(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Commission Percentage (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={editForm.commissionPct}
                  onChange={(e) => setEditForm({ ...editForm, commissionPct: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-brand"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Calculated Amount: <span className="font-extrabold text-emerald-600">{formatCurrency((selectedCommission.propertyValue * editForm.commissionPct) / 100)}</span>
                </p>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Payout Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-brand"
                >
                  <option value="PENDING">PENDING (Unpaid)</option>
                  <option value="PAID">PAID (Settled)</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Payment Reference / Cheque No / Bank Ref
                </label>
                <input
                  type="text"
                  placeholder="e.g. TXN-98492042 or Cheque #40294"
                  value={editForm.paymentRef}
                  onChange={(e) => setEditForm({ ...editForm, paymentRef: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Admin Payout Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Internal notes regarding this payout..."
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-brand resize-none"
                />
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="h-3 w-3 text-slate-400" />
                    Timestamp: {new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="text-amber-700 dark:text-brand font-bold">Notes logged with timestamp</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedCommission(null)}
                className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCommissionEdit}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand hover:bg-brand-hover text-white px-4 py-2 text-xs font-black transition shadow-sm"
              >
                <Save className="h-3.5 w-3.5" />
                Save Note &amp; Payout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Commission Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-brand" />
                Add Manual Commission Entry
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Property Title / Deal Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Luxury Apartment 4B, Sector 62"
                  value={addForm.propertyTitle}
                  onChange={(e) => setAddForm({ ...addForm, propertyTitle: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Property Value (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="15000000"
                    value={addForm.propertyValue || ""}
                    onChange={(e) => setAddForm({ ...addForm, propertyValue: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Commission Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={addForm.commissionPct}
                    onChange={(e) => setAddForm({ ...addForm, commissionPct: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <p className="text-[11px] text-slate-500">
                  Calculated Commission Amount: <span className="font-extrabold text-emerald-600">{formatCurrency((addForm.propertyValue * addForm.commissionPct) / 100)}</span>
                </p>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Status
                </label>
                <select
                  value={addForm.status}
                  onChange={(e) => setAddForm({ ...addForm, status: e.target.value as any })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-brand"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="PAID">PAID</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Payment Ref / Notes
                </label>
                <input
                  type="text"
                  placeholder="Optional reference code or notes"
                  value={addForm.paymentRef}
                  onChange={(e) => setAddForm({ ...addForm, paymentRef: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-brand"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCommission}
                className="rounded-xl bg-brand hover:bg-brand-hover text-white px-4 py-2 text-xs font-bold transition shadow-sm"
              >
                Create Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Property Leads Breakdown Drawer */}
      {selectedPropertyLeads && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Property Leads Breakdown
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedPropertyLeads.propertyTitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPropertyLeads(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {selectedPropertyLeads.leads.length > 0 ? (
                selectedPropertyLeads.leads.map((l) => (
                  <div key={l.id} className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-extrabold text-sm text-slate-900 dark:text-white">{l.name}</p>
                      <p className="text-xs text-slate-500">{l.email} {l.phone ? `· ${l.phone}` : ""}</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">Created: {formatDate(l.createdAt)}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      {l.stage}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center py-8 text-xs text-slate-400 italic">No specific leads tied to this property.</p>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedPropertyLeads(null)}
                className="rounded-xl bg-slate-900 dark:bg-slate-800 text-white px-4 py-2 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
