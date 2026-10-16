"use client";

import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import {
  Building2,
  Calendar,
  IndianRupee,
  ExternalLink,
  Edit,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  Tag,
  ShoppingBag,
  BadgePercent,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
export type PortfolioItem = {
  id: string;
  propertyId: string;
  title: string;
  symbol: string;
  slug?: string | null;
  price: number;
  city: string;
  state: string;
  address?: string | null;
  images?: string | null;
  image?: string | null;
  type: "BOUGHT" | "SOLD";
  status: string;
  timestamp: string;
  amount: number;
  paymentRef?: string | null;
  clientName?: string | null;
};

export type UserTransactionItem = {
  id: string;
  userId: string;
  propertyId?: string | null;
  propertyTitle?: string | null;
  propertySymbol?: string | null;
  amount: number;
  type: string;
  status: string;
  paymentMethod?: string | null;
  description?: string | null;
  referenceNo?: string | null;
  notes?: string | null;
  buyerName?: string | null;
  sellerName?: string | null;
  completedAt?: string | null;
  createdAt: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function formatCurrencyINR(amount: number): string {
  if (!amount || isNaN(amount)) return "₹0";
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} Lakh`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getPropertyThumbnail(images?: string | null, image?: string | null): string | null {
  if (image) return image;
  if (images) {
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "string") return parsed[0];
    } catch {
      if (typeof images === "string" && images.startsWith("http")) return images;
    }
  }
  return null;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "N/A";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
}

// ─── 1. Property Portfolio Section (Bought & Sold) ───────────────────────────
export function UserPropertyPortfolioSection({
  boughtProperties,
  soldProperties,
}: {
  boughtProperties: PortfolioItem[];
  soldProperties: PortfolioItem[];
}) {
  const [activeTab, setActiveTab] = useState<"ALL" | "BOUGHT" | "SOLD">("ALL");
  const [search, setSearch] = useState("");

  const allItems = useMemo(() => {
    return [...boughtProperties, ...soldProperties].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [boughtProperties, soldProperties]);

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      const matchesTab = activeTab === "ALL" || item.type === activeTab;
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.city.toLowerCase().includes(q) ||
        item.state.toLowerCase().includes(q) ||
        (item.symbol && item.symbol.toLowerCase().includes(q));

      return matchesTab && matchesSearch;
    });
  }, [allItems, activeTab, search]);

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="h-5 w-5 text-slate-700 dark:text-slate-300" />
            Property Portfolio ({allItems.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Complete record of properties bought and sold by this user with transaction timestamps
          </p>
        </div>

        {/* Filter Tabs & Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                activeTab === "ALL" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              All ({allItems.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("BOUGHT")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                activeTab === "BOUGHT" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Bought ({boughtProperties.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("SOLD")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                activeTab === "SOLD" ? "bg-purple-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Sold ({soldProperties.length})
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search portfolio..."
              className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-400 dark:focus:border-slate-700 w-44 sm:w-56 transition"
            />
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
          <Building2 className="mx-auto h-10 w-10 text-slate-400 dark:text-slate-500 mb-2" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No properties in portfolio</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {allItems.length === 0
              ? "This user has no bought or sold properties recorded in the system yet."
              : "No portfolio properties match your search or filter."}
          </p>
        </div>
      ) : (
        /* Portfolio Grid */
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {filteredItems.map((item) => {
            const thumbnail = getPropertyThumbnail(item.images, item.image);

            return (
              <div
                key={`${item.type}-${item.id}`}
                className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 hover:border-slate-300 transition shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Banner with Type Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={item.title}
                          className="h-12 w-12 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                          {item.symbol || "PROP"}
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.city}, {item.state} {item.address ? `· ${item.address}` : ""}
                        </p>
                      </div>
                    </div>

                    {/* Bought / Sold Pill */}
                    {item.type === "BOUGHT" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-800 font-extrabold text-[11px] shrink-0 shadow-2xs">
                        <ShoppingBag className="h-3 w-3 text-emerald-600" />
                        BOUGHT
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-50 border border-purple-300 text-purple-800 font-extrabold text-[11px] shrink-0 shadow-2xs">
                        <BadgePercent className="h-3 w-3 text-purple-600" />
                        SOLD
                      </span>
                    )}
                  </div>

                  {/* Financial & Timestamp Details */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs bg-slate-50 p-2.5 rounded-lg">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {item.type === "BOUGHT" ? "Purchased Value" : "Sold Price"}
                      </span>
                      <span className="font-bold text-slate-900 text-sm flex items-center gap-1 mt-0.5">
                        {formatCurrencyINR(item.amount || item.price)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {item.type === "BOUGHT" ? "Purchase Date" : "Sale Date"}
                      </span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5 text-[11px]">
                        <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                        {formatDate(item.timestamp)}
                      </span>
                    </div>
                  </div>

                  {item.paymentRef && (
                    <p className="text-[11px] text-slate-500 font-mono">
                      Ref / Txn ID: <span className="font-bold text-slate-700">{item.paymentRef}</span>
                    </p>
                  )}
                </div>

                {/* Clickable Navigation Buttons */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 mt-3">
                  <Link
                    href={`/admin/properties/${item.propertyId}/edit`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-2 text-xs font-bold transition shadow-xs text-center"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Property Details &amp; Edit
                  </Link>
                  <Link
                    href={`/properties/${item.slug || item.propertyId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 text-xs font-semibold border border-slate-200 transition text-center"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Public View
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ─── 2. User Transaction History Section ─────────────────────────────────────
export function UserTransactionHistorySection({
  transactions: initialTransactions,
  userId,
  userEmail,
  userName,
}: {
  transactions: UserTransactionItem[];
  userId?: string;
  userEmail?: string;
  userName?: string;
}) {
  const [allTxns, setAllTxns] = useState<UserTransactionItem[]>(initialTransactions);
  const [activeTab, setActiveTab] = useState<"ALL" | "COMPLETED" | "PENDING">("ALL");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeTab]);

  useEffect(() => {
    function syncLocalTxns() {
      const storedStr = localStorage.getItem("plotsnhomes_payout_txns");
      let localTxns: UserTransactionItem[] = [];

      if (storedStr) {
        try {
          const parsed = JSON.parse(storedStr);
          if (Array.isArray(parsed)) {
            for (const p of parsed) {
              const matchesUser =
                (userId && p.userId === userId) ||
                (userEmail && p.userEmail?.toLowerCase() === userEmail.toLowerCase()) ||
                (userName && p.userName?.toLowerCase() === userName.toLowerCase());

              if (matchesUser) {
                localTxns.push({
                  id: p.id || p.referenceNo,
                  userId: p.userId || userId || "USR",
                  propertyId: p.propertyId || null,
                  propertyTitle: p.propertyTitle || "Property Deal",
                  propertySymbol: p.propertySymbol || "COMM",
                  amount: p.amount || 0,
                  type: p.type || "COMMISSION_DISBURSED",
                  status: (p.status || "completed").toUpperCase(),
                  paymentMethod: p.method || p.paymentMethod || "Direct Bank Transfer (IMPS)",
                  description: p.description || `Commission Payout Disbursed. Ref: ${p.referenceNo || p.id}`,
                  referenceNo: p.referenceNo || p.id,
                  notes: p.notes || null,
                  buyerName: null,
                  sellerName: p.userName || userName || null,
                  completedAt: p.date || p.completedAt || new Date().toISOString(),
                  createdAt: p.date || p.createdAt || new Date().toISOString(),
                });
              }
            }
          }
        } catch (e) {}
      }

      const commStr = localStorage.getItem("plotsnhomes_commissions");
      if (commStr) {
        try {
          const commList = JSON.parse(commStr);
          if (Array.isArray(commList)) {
            for (const c of commList) {
              const matchesAgent =
                (userId && c.agentId === userId) ||
                (userName && c.agentName?.toLowerCase() === userName.toLowerCase()) ||
                (userEmail && c.agentEmail?.toLowerCase() === userEmail.toLowerCase());

              if (matchesAgent && (c.paidAmount > 0 || c.status === "PAID" || c.notes?.includes("Disbursed"))) {
                const refNo = c.paymentRef || `COMM-${c.id}`;
                const existsInLocal = localTxns.some((t) => t.referenceNo === refNo || t.id === c.id);
                if (!existsInLocal) {
                  localTxns.push({
                    id: `tx-comm-${c.id}`,
                    userId: c.agentId || userId || "USR",
                    propertyId: c.propertyId || null,
                    propertyTitle: c.propertyTitle || "Agent Commission Payout",
                    propertySymbol: c.propertySymbol || "COMM",
                    amount: c.paidAmount || c.totalCommission || 0,
                    type: "COMMISSION_DISBURSED",
                    status: c.status === "PAID" ? "COMPLETED" : "PENDING",
                    paymentMethod: "Direct Bank Transfer (IMPS)",
                    description: `Agent Commission Payout Disbursed. Ref: ${refNo}`,
                    referenceNo: refNo,
                    notes: c.notes || null,
                    buyerName: null,
                    sellerName: c.agentName || userName || null,
                    completedAt: c.updatedAt || new Date().toISOString(),
                    createdAt: c.updatedAt || new Date().toISOString(),
                  });
                }
              }
            }
          }
        } catch (e) {}
      }

      const combinedMap = new Map<string, UserTransactionItem>();
      [...initialTransactions, ...localTxns].forEach((item) => {
        const key = item.referenceNo || item.id;
        if (!combinedMap.has(key)) {
          combinedMap.set(key, item);
        }
      });

      const sorted = Array.from(combinedMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAllTxns(sorted);
    }

    syncLocalTxns();
    window.addEventListener("plotsnhomes_payout_processed", syncLocalTxns);
    window.addEventListener("plotsnhomes_commission_updated", syncLocalTxns);
    window.addEventListener("storage", syncLocalTxns);
    return () => {
      window.removeEventListener("plotsnhomes_payout_processed", syncLocalTxns);
      window.removeEventListener("plotsnhomes_commission_updated", syncLocalTxns);
      window.removeEventListener("storage", syncLocalTxns);
    };
  }, [initialTransactions, userId, userEmail, userName]);

  const filteredTransactions = useMemo(() => {
    return allTxns.filter((tx) => {
      const matchesTab = activeTab === "ALL" || tx.status === activeTab;
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (tx.referenceNo && tx.referenceNo.toLowerCase().includes(q)) ||
        (tx.propertyTitle && tx.propertyTitle.toLowerCase().includes(q)) ||
        (tx.description && tx.description.toLowerCase().includes(q)) ||
        (tx.type && tx.type.toLowerCase().includes(q)) ||
        tx.amount.toString().includes(q);

      return matchesTab && matchesSearch;
    });
  }, [allTxns, activeTab, search]);

  const totalFiltered = filteredTransactions.length;
  const totalTxCount = allTxns.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(totalFiltered, startIndex + pageSize);

  const paginatedTransactions = useMemo(() => {
    return filteredTransactions.slice(startIndex, startIndex + pageSize);
  }, [filteredTransactions, startIndex, pageSize]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-slate-700" />
            Transaction History ({allTxns.length})
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Complete financial history including payments, payouts, deposits, and status timestamps
          </p>
        </div>

        {/* Filter Tabs & Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                activeTab === "ALL" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({allTxns.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("COMPLETED")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                activeTab === "COMPLETED" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Completed ({allTxns.filter((t) => t.status === "COMPLETED").length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("PENDING")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                activeTab === "PENDING" ? "bg-amber-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Pending ({allTxns.filter((t) => t.status === "PENDING").length})
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transactions..."
              className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-400 w-44 sm:w-56 transition"
            />
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredTransactions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
          <CreditCard className="mx-auto h-10 w-10 text-slate-400 dark:text-slate-500 mb-2" />
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No transaction records found</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {allTxns.length === 0
              ? "This user has no completed or pending transactions recorded."
              : "No transactions match your search or filter."}
          </p>
        </div>
      ) : (
        /* Transactions Table */
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                  <th className="p-3.5">Date &amp; Time</th>
                  <th className="p-3.5">Type &amp; Method</th>
                  <th className="p-3.5">Property</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Reference No.</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Date */}
                    <td className="p-3.5 whitespace-nowrap">
                      <p className="font-semibold text-slate-900 text-xs">{formatDate(tx.createdAt)}</p>
                      {tx.completedAt && (
                        <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                          ✓ Completed: {formatDate(tx.completedAt)}
                        </p>
                      )}
                    </td>

                    {/* Type & Method */}
                    <td className="p-3.5">
                      <span
                        className={`font-extrabold px-2 py-0.5 rounded-md inline-block text-[11px] ${
                          tx.type === "COMMISSION_PAYOUT" || tx.type === "COMMISSION_DISBURSED"
                            ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                            : "bg-slate-100 text-slate-900 border border-slate-200"
                        }`}
                      >
                        {tx.type === "COMMISSION_PAYOUT" || tx.type === "COMMISSION_DISBURSED"
                          ? "💸 COMMISSION PAYOUT"
                          : tx.type}
                      </span>
                      {tx.paymentMethod && (
                        <p className="text-[10px] text-slate-500 mt-1 uppercase font-medium">
                          Method: {tx.paymentMethod}
                        </p>
                      )}
                    </td>

                    {/* Property */}
                    <td className="p-3.5">
                      {tx.propertyTitle ? (
                        <div>
                          {tx.propertyId ? (
                            <Link
                              href={`/admin/properties/${tx.propertyId}/edit`}
                              className="font-bold text-slate-900 hover:text-blue-700 hover:underline flex items-center gap-1"
                            >
                              {tx.propertyTitle} <ArrowUpRight className="h-3 w-3 text-slate-400" />
                            </Link>
                          ) : (
                            <p className="font-bold text-slate-900">{tx.propertyTitle}</p>
                          )}
                          {tx.propertySymbol && (
                            <span className="text-[10px] font-mono text-slate-500">{tx.propertySymbol}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">General Payment</span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="p-3.5 font-bold text-slate-900 text-sm whitespace-nowrap">
                      {formatCurrencyINR(tx.amount)}
                    </td>

                    {/* Reference No */}
                    <td className="p-3.5 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                      {tx.referenceNo || tx.id}
                    </td>

                    {/* Status */}
                    <td className="p-3.5 whitespace-nowrap">
                      {tx.status === "COMPLETED" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 font-extrabold text-[11px]">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          COMPLETED
                        </span>
                      ) : tx.status === "PENDING" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-800 font-extrabold text-[11px]">
                          <Clock className="h-3 w-3 text-amber-600" />
                          PENDING
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 border border-red-300 text-red-800 font-extrabold text-[11px]">
                          <AlertCircle className="h-3 w-3 text-red-600" />
                          {tx.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Footer with Total Transactions Counter & Pagination */}
          <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium text-slate-600 dark:text-slate-300">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs px-3 py-1 rounded-xl">
                Total Transactions: <b className="text-amber-600 dark:text-amber-400 font-extrabold text-sm">{totalFiltered}</b>
              </span>
              {search.trim() ? (
                <span className="text-[11px] text-amber-900 dark:text-amber-200 font-bold bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 rounded-lg">
                  Filtered from {totalTxCount} total user transactions
                </span>
              ) : (
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Showing {totalFiltered === 0 ? 0 : startIndex + 1} – {endIndex} of {totalFiltered} entries
                </span>
              )}
            </div>

            {totalFiltered > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 font-semibold">Show:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500 shadow-2xs cursor-pointer"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Page <b className="font-bold text-slate-900 dark:text-white">{currentPage}</b> of <b className="font-bold text-slate-900 dark:text-white">{totalPages}</b>
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(1)}
                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs"
                  >
                    «
                  </button>
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs"
                  >
                    ‹ Prev
                  </button>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs"
                  >
                    Next ›
                  </button>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs"
                  >
                    »
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
