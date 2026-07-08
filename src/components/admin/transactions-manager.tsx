"use client";

import { TransactionStatus } from "@prisma/client";
import { Trash2, Download, X, Eye, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { paymentMethodLabel, paymentPlanLabel } from "@/lib/payment-plans";
import { formatCurrency } from "@/lib/utils";

type Tx = {
  id: string;
  amount: number;
  status: TransactionStatus;
  type: string;
  paymentPlan: string | null;
  paymentMethod: string | null;
  createdAt: string;
  completedAt?: string | null;
  referenceNo?: string | null;
  notes?: string | null;
  buyerName?: string | null;
  sellerName?: string | null;
  propertySymbol?: string | null;
  propertyTitle?: string | null;
  propertySlug?: string | null;
  brokerageRateEffective?: number;
  user: { name: string; email: string };
  property: { title: string; slug?: string; symbol?: string; brokerageRate?: number } | null;
  brokerageRate?: number;
  brokerageAmount?: number;
  sellerAmount?: number;
  received?: string;
  balance?: number;
};

export function TransactionsManager({ transactions }: { transactions: Tx[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  // Filter and Search States
  const [activeTab, setActiveTab] = useState<"all" | "investment" | "deposit" | "subscription" | "pending" | "flagged">("all");
  const [userSearch, setUserSearch] = useState("");
  const [propSearch, setPropSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortOption, setSortOption] = useState("date-desc");

  // Detailed Modal State
  const [selectedTx, setSelectedTx] = useState<Tx | null>(null);

  // Available unique properties in list
  const properties = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => {
      if (t.property?.title) set.add(t.property.title);
    });
    return Array.from(set);
  }, [transactions]);

  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState("");

  // Statistics Calculations
  const stats = useMemo(() => {
    const completed = transactions.filter(t => t.status === "COMPLETED");
    const totalVolume = completed.reduce((sum, t) => sum + t.amount, 0);
    const totalCount = transactions.length;
    const successRate = totalCount > 0 ? (completed.length / totalCount) * 100 : 0;
    const pendingCount = transactions.filter(t => t.status === "PENDING").length;
    
    // Sum actual platform brokerage fees from completed transactions
    const platformFees = completed.reduce((sum, t) => {
      const isOffline = t.paymentMethod === "cheque" || t.paymentMethod === "neft_rtgs";
      const rate = t.brokerageRate ?? (isOffline ? 0.0 : (t.property?.brokerageRate ?? 3.0));
      const amt = t.brokerageAmount ?? (isOffline ? 0.0 : t.amount * (rate / 100));
      return sum + amt;
    }, 0);

    return {
      totalVolume,
      successRate,
      pendingCount,
      platformFees,
    };
  }, [transactions]);

  // Action methods
  async function updateStatus(id: string, status: TransactionStatus) {
    setBusy(id);
    try {
      await fetch(`/api/admin/transactions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (selectedTx?.id === id) {
        setSelectedTx(prev => prev ? { ...prev, status } : null);
      }
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this transaction record?")) return;
    setBusy(id);
    try {
      await fetch(`/api/admin/transactions/${id}`, { method: "DELETE" });
      setSelectedTx(null);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(null);
    }
  }

  // Filtered and Sorted list
  const filteredTransactions = useMemo(() => {
    let list = [...transactions];

    // Tab Filters
    if (activeTab === "investment") {
      list = list.filter(t => t.type === "INVESTMENT");
    } else if (activeTab === "deposit") {
      list = list.filter(t => t.type === "DEPOSIT");
    } else if (activeTab === "subscription") {
      list = list.filter(t => t.type === "SUBSCRIPTION");
    } else if (activeTab === "pending") {
      list = list.filter(t => t.status === "PENDING");
    } else if (activeTab === "flagged") {
      list = list.filter(t => t.status === "FAILED" || t.status === "REFUNDED");
    }

    // User Search
    if (userSearch) {
      const q = userSearch.toLowerCase();
      list = list.filter(t => 
        t.user.name.toLowerCase().includes(q) || 
        t.user.email.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
      );
    }

    // Property Search
    if (propSearch) {
      const q = propSearch.toLowerCase();
      list = list.filter(t => t.property?.title.toLowerCase().includes(q));
    }

    // Property dropdown filter
    if (selectedPropertyFilter) {
      list = list.filter(t => t.property?.title === selectedPropertyFilter);
    }

    // Date range filter
    if (dateFrom) {
      list = list.filter(t => t.createdAt >= dateFrom);
    }
    if (dateTo) {
      list = list.filter(t => t.createdAt <= `${dateTo}T23:59:59.999Z`);
    }

    // Price range filter
    if (minPrice) {
      list = list.filter(t => t.amount >= parseFloat(minPrice));
    }
    if (maxPrice) {
      list = list.filter(t => t.amount <= parseFloat(maxPrice));
    }

    // Sorting
    list.sort((a, b) => {
      if (sortOption === "date-desc") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortOption === "date-asc") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortOption === "amount-desc") return b.amount - a.amount;
      if (sortOption === "amount-asc") return a.amount - b.amount;
      
      const isOfflineA = a.paymentMethod === "cheque" || a.paymentMethod === "neft_rtgs";
      const isOfflineB = b.paymentMethod === "cheque" || b.paymentMethod === "neft_rtgs";
      const rateA = a.brokerageRate ?? (isOfflineA ? 0.0 : (a.property?.brokerageRate ?? 3.0));
      const rateB = b.brokerageRate ?? (isOfflineB ? 0.0 : (b.property?.brokerageRate ?? 3.0));
      const feeA = a.brokerageAmount ?? (isOfflineA ? 0.0 : a.amount * (rateA / 100));
      const feeB = b.brokerageAmount ?? (isOfflineB ? 0.0 : b.amount * (rateB / 100));
      if (sortOption === "fee-desc") return feeB - feeA;
      if (sortOption === "fee-asc") return feeA - feeB;

      return 0;
    });

    return list;
  }, [transactions, activeTab, userSearch, propSearch, selectedPropertyFilter, dateFrom, dateTo, minPrice, maxPrice, sortOption]);

  const clearFilters = () => {
    setActiveTab("all");
    setUserSearch("");
    setPropSearch("");
    setSelectedPropertyFilter("");
    setDateFrom("");
    setDateTo("");
    setMinPrice("");
    setMaxPrice("");
    setSortOption("date-desc");
  };

  const handleDatePreset = (days: number) => {
    const to = new Date();
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    setDateFrom(from.toISOString().split("T")[0]);
    setDateTo(to.toISOString().split("T")[0]);
  };

  const exportCSV = () => {
    const headers = ["ID", "User Name", "User Email", "Type", "Property", "Amount", "Status", "Date"];
    const rows = filteredTransactions.map(t => [
      t.id,
      t.user.name,
      `"${t.user.email}"`,
      t.type,
      t.property?.title || "—",
      t.amount,
      t.status,
      t.createdAt
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `transactions_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition-colors">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Volume (Completed)</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(stats.totalVolume)}</p>
          <p className="text-xs text-slate-400 mt-1">Across all users</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition-colors">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Payment Success Rate</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{stats.successRate.toFixed(1)}%</p>
          <p className="text-xs text-slate-400 mt-1">Completed vs total orders</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition-colors">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Authorization</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">{stats.pendingCount}</p>
          <p className="text-xs text-slate-400 mt-1">Awaiting admin action</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition-colors">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Est. Platform Revenue</p>
          <p className="mt-2 text-2xl font-bold text-blue-600">{formatCurrency(stats.platformFees)}</p>
          <p className="text-xs text-slate-400 mt-1">0.5% completed investments</p>
        </div>
      </div>

      {/* 2. Search & Controls Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Tab filters */}
        <div className="flex flex-wrap gap-1.5 border-b border-slate-100 bg-slate-50/50 px-4 py-3">
          {(["all", "investment", "deposit", "subscription", "pending", "flagged"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                activeTab === tab
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {tab === "all" && "All Transactions"}
              {tab === "investment" && "▲ Investments"}
              {tab === "deposit" && "▼ Deposits"}
              {tab === "subscription" && "💳 Subscriptions"}
              {tab === "pending" && "⏳ Pending"}
              {tab === "flagged" && "⚠️ Failed / Refunded"}
            </button>
          ))}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-mono font-medium">
              {filteredTransactions.length} result{filteredTransactions.length !== 1 && "s"}
            </span>
            <Button variant="ghost" className="!py-1 !px-2.5 text-xs h-7 gap-1" onClick={clearFilters}>
              <X className="h-3 w-3" /> Clear
            </Button>
            <Button variant="secondary" className="!py-1 !px-2.5 text-xs h-7 gap-1" onClick={exportCSV}>
              <Download className="h-3.5 w-3.5 animate-pulse" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Input parameters */}
        <div className="p-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4 border-b border-slate-100">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Search User / Order ID</label>
            <input
              type="text"
              placeholder="Name, email, transaction ID..."
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-gold focus:outline-none bg-slate-50/50 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Search Property Title</label>
            <input
              type="text"
              placeholder="e.g. Kensington Manor..."
              value={propSearch}
              onChange={e => setPropSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-gold focus:outline-none bg-slate-50/50 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Select Property</label>
            <select
              value={selectedPropertyFilter}
              onChange={e => setSelectedPropertyFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-gold focus:outline-none bg-slate-50/50 focus:bg-white transition cursor-pointer"
            >
              <option value="">All Properties</option>
              {properties.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Sort results</label>
            <select
              value={sortOption}
              onChange={e => setSortOption(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-gold focus:outline-none bg-slate-50/50 focus:bg-white transition cursor-pointer"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
              <option value="fee-desc">Highest Fee</option>
              <option value="fee-asc">Lowest Fee</option>
            </select>
          </div>
        </div>

        {/* Date presets & ranges */}
        <div className="px-4 py-3 bg-slate-50/40 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Date Range</span>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs focus:outline-none font-medium"
            />
            <span className="text-slate-400 text-xs">→</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs focus:outline-none font-medium"
            />
            <div className="flex gap-1 border-l border-slate-200 pl-2">
              <button onClick={() => handleDatePreset(7)} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 hover:bg-slate-300 transition text-slate-700">7D</button>
              <button onClick={() => handleDatePreset(30)} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 hover:bg-slate-300 transition text-slate-700">30D</button>
              <button onClick={() => handleDatePreset(90)} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 hover:bg-slate-300 transition text-slate-700">90D</button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Price Range</span>
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs w-20 focus:outline-none font-medium"
            />
            <span className="text-slate-400 text-xs">–</span>
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs w-20 focus:outline-none font-medium"
            />
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-slate-50 text-left text-slate-500 font-medium">
              <tr>
                <th className="px-4 py-3 text-[11px] uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-[11px] uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-[11px] uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-[11px] uppercase tracking-wider">Property</th>
                <th className="px-4 py-3 text-[11px] uppercase tracking-wider">Gross Amt</th>
                <th className="px-4 py-3 text-[11px] uppercase tracking-wider">Brokerage Rate</th>
                <th className="px-4 py-3 text-[11px] uppercase tracking-wider">Platform Share</th>
                <th className="px-4 py-3 text-[11px] uppercase tracking-wider">Seller Payout</th>
                <th className="px-4 py-3 text-[11px] uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-[11px] uppercase tracking-wider">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-slate-400">
                    No transactions found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => {
                  const isOffline = tx.paymentMethod === "cheque" || tx.paymentMethod === "neft_rtgs";
                  const rate = isOffline ? 0.0 : (tx.brokerageRate ?? 3.0);
                  const platShare = isOffline ? 0.0 : (tx.brokerageAmount ?? (tx.amount * (rate / 100)));
                  const sellerPayout = isOffline ? tx.amount : (tx.sellerAmount ?? (tx.amount - platShare));
                  return (
                    <tr key={tx.id} className={`hover:bg-slate-50/50 transition-colors ${tx.status === "FAILED" || tx.status === "REFUNDED" ? "bg-red-50/10" : ""}`}>
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{tx.id.slice(-8).toUpperCase()}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-900 block leading-tight">{tx.user.name}</span>
                        <span className="text-slate-400 text-xs">{tx.user.email}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                          tx.type === "INVESTMENT" ? "bg-emerald-50 text-emerald-700" :
                          tx.type === "DEPOSIT" ? "bg-blue-50 text-blue-700" :
                          tx.type === "SUBSCRIPTION" ? "bg-purple-50 text-purple-700" :
                          "bg-slate-100 text-slate-700"
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{tx.property?.title ?? "—"}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{formatCurrency(tx.amount)}</td>
                      <td className="px-4 py-3 text-slate-600 font-medium">{rate.toFixed(1)}%</td>
                      <td className="px-4 py-3 font-bold text-amber-700">{formatCurrency(platShare)}</td>
                      <td className="px-4 py-3 font-bold text-emerald-700">{formatCurrency(sellerPayout)}</td>
                      <td className="px-4 py-3">
                        <select
                          value={tx.status}
                          disabled={busy === tx.id}
                          onChange={(e) => updateStatus(tx.id, e.target.value as TransactionStatus)}
                          className={`rounded-lg border px-2 py-1 text-xs font-semibold focus:outline-none ${
                            tx.status === "COMPLETED" ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
                            tx.status === "PENDING" ? "border-amber-200 bg-amber-50 text-amber-700" :
                            tx.status === "FAILED" ? "border-red-200 bg-red-50 text-red-700" :
                            "border-slate-200 bg-slate-50 text-slate-700"
                          }`}
                        >
                          {["PENDING", "COMPLETED", "FAILED", "REFUNDED"].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {new Date(tx.createdAt).toLocaleDateString()}
                        <br />
                        <span className="text-[10px] text-slate-400">{new Date(tx.createdAt).toLocaleTimeString()}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => setSelectedTx(tx)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition"
                            title="View Transaction Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <Button
                            variant="danger"
                            className="!p-1.5 !rounded-lg !h-auto"
                            disabled={busy === tx.id}
                            onClick={() => remove(tx.id)}
                            title="Delete Record"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      {/* 3. Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative">
            <button
              onClick={() => setSelectedTx(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 transition"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="font-display text-xl font-bold text-slate-900 mb-2">Transaction Receipt</h3>
            <p className="text-xs text-slate-400 font-mono mb-4">ID: {selectedTx.id.toUpperCase()}</p>
            
            <div className="divide-y divide-slate-100 text-sm">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">User Account</span>
                <span className="font-semibold text-slate-900">{selectedTx.user.name}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Email Address</span>
                <span className="font-mono text-xs text-slate-900">{selectedTx.user.email}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Category Type</span>
                <span className="font-bold text-slate-900">{selectedTx.type}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Property / Asset</span>
                <span className="font-semibold text-slate-900">{selectedTx.property?.title ?? "—"}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Gross Amount</span>
                <span className="font-extrabold text-slate-900 text-base">{formatCurrency(selectedTx.amount)}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Brokerage Rate</span>
                <span className="text-slate-900 font-medium">
                  {((selectedTx.paymentMethod === "cheque" || selectedTx.paymentMethod === "neft_rtgs") ? 0.0 : (selectedTx.brokerageRate ?? 3.0)).toFixed(1)}%
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Platform Share (Plotsnhomes)</span>
                <span className="text-amber-700 font-bold">
                  {formatCurrency((selectedTx.paymentMethod === "cheque" || selectedTx.paymentMethod === "neft_rtgs") ? 0.0 : (selectedTx.brokerageAmount ?? (selectedTx.amount * ((selectedTx.brokerageRate ?? 3.0) / 100))))}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Seller Payout (100% - x%)</span>
                <span className="text-emerald-700 font-bold">
                  {formatCurrency((selectedTx.paymentMethod === "cheque" || selectedTx.paymentMethod === "neft_rtgs") ? selectedTx.amount : (selectedTx.sellerAmount ?? (selectedTx.amount - (selectedTx.brokerageAmount ?? (selectedTx.amount * ((selectedTx.brokerageRate ?? 3.0) / 100))))))}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Fee Received</span>
                <span className={`text-xs font-bold uppercase ${selectedTx.received === "yes" ? "text-emerald-600" : "text-amber-600"}`}>
                  {selectedTx.received === "yes" ? "Yes" : "No"}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Outstanding Balance</span>
                <span className="text-slate-900 font-medium">
                  {formatCurrency(selectedTx.balance ?? 0.0)}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Payment Plan</span>
                <span className="text-slate-900 font-medium">{paymentPlanLabel(selectedTx.paymentPlan) || "—"}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Settlement Gateway</span>
                <span className="text-slate-900 font-medium">{paymentMethodLabel(selectedTx.paymentMethod) || "—"}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-400">Status</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  selectedTx.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" :
                  selectedTx.status === "PENDING" ? "bg-amber-100 text-amber-800" :
                  "bg-red-100 text-red-800"
                }`}>
                  {selectedTx.status}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Date Logged</span>
                <span className="text-slate-950 font-mono text-xs">{new Date(selectedTx.createdAt).toLocaleString()}</span>
              </div>
              {selectedTx.completedAt && (
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Completed At</span>
                  <span className="text-emerald-700 font-mono text-xs">{new Date(selectedTx.completedAt).toLocaleString()}</span>
                </div>
              )}
              {selectedTx.referenceNo && (
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Reference No.</span>
                  <span className="font-mono text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded-lg">{selectedTx.referenceNo}</span>
                </div>
              )}
              {selectedTx.buyerName && (
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Buyer</span>
                  <span className="text-slate-900 font-semibold text-xs">{selectedTx.buyerName}</span>
                </div>
              )}
              {selectedTx.sellerName && (
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Builder / Seller</span>
                  <span className="text-slate-900 font-semibold text-xs">{selectedTx.sellerName}</span>
                </div>
              )}
              {selectedTx.notes && (
                <div className="py-2.5">
                  <span className="text-slate-400 block mb-1">Notes</span>
                  <span className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 block">{selectedTx.notes}</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-2">
              {selectedTx.status === "PENDING" && (
                <Button
                  variant="gold"
                  className="flex-1 text-xs gap-1 py-2"
                  disabled={busy === selectedTx.id}
                  onClick={() => updateStatus(selectedTx.id, "COMPLETED")}
                >
                  Confirm
                </Button>
              )}
              {selectedTx.status === "COMPLETED" && (
                <Button
                  variant="secondary"
                  className="flex-1 text-xs gap-1 py-2 border-red-200 text-red-600 hover:bg-red-50"
                  disabled={busy === selectedTx.id}
                  onClick={() => updateStatus(selectedTx.id, "FAILED")}
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Reverse & Void
                </Button>
              )}
              <Button
                variant="ghost"
                className="flex-1 text-xs py-2"
                onClick={() => setSelectedTx(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
