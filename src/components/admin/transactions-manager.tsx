"use client";

import { useState, useMemo, useEffect } from "react";
import { X, Eye, RefreshCw, CheckCircle2, AlertTriangle, Clock, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { TableToolbarManager } from "@/components/ui/table-toolbar-manager";
import { useHorizontalScroll } from "@/hooks/use-horizontal-scroll";
import { TableScrollButtons } from "@/components/ui/table-scroll-buttons";
import { useTableColumns, useCustomCellData } from "@/hooks/use-table-columns";
import { EditableCell } from "@/components/ui/editable-cell";

type TxItem = {
  id: string;
  userId?: string;
  userName: string;
  userEmail: string;
  userInitials?: string;
  userBg?: string;
  type: "BUY" | "SELL";
  propertyTitle: string;
  propertySymbol: string;
  propertyIcon?: string;
  amount: number;
  fee: number;
  status: "completed" | "pending" | "flagged" | "processing";
  date: string;
};

const AVATAR_COLORS = [
  "linear-gradient(135deg, #3b82f6, #6366f1)",
  "linear-gradient(135deg, #f59e0b, #d97706)",
  "linear-gradient(135deg, #8b5cf6, #7c3aed)",
  "linear-gradient(135deg, #10b981, #059669)",
  "linear-gradient(135deg, #ef4444, #dc2626)",
  "linear-gradient(135deg, #06b6d4, #0891b2)",
];

const PROPERTY_ICONS: Record<string, string> = {
  "Kensington Manor": "🏰",
  "Manhattan Penthouse": "🏙️",
  "Swiss Chalet": "🌲",
  "Tuscany Villa": "🌿",
  "Malibu Beach House": "🌴",
  "Bondi Beachfront": "🌊",
};

const INITIAL_TRANSACTIONS: TxItem[] = [
  { id: "TXN-8821", userId: "USR001", userName: "James Harrington", userEmail: "james@example.com", type: "BUY", propertyTitle: "Kensington Manor", propertySymbol: "BKV-PROP-LON-001", propertyIcon: "🏰", amount: 1252050, fee: 6260, status: "completed", date: "2026-04-14 09:12" },
  { id: "TXN-8820", userId: "USR003", userName: "Marcus Chen", userEmail: "marcus@example.com", type: "SELL", propertyTitle: "Manhattan Penthouse", propertySymbol: "BKV-PROP-NYC-003", propertyIcon: "🏙️", amount: 2370548, fee: 7112, status: "completed", date: "2026-04-14 08:45" },
  { id: "TXN-8819", userId: "USR004", userName: "Sophie Müller", userEmail: "sophie@example.com", type: "BUY", propertyTitle: "Swiss Chalet", propertySymbol: "BKV-PROP-VRB-005", propertyIcon: "🌲", amount: 350574, fee: 1753, status: "flagged", date: "2026-04-14 07:33" },
  { id: "TXN-8818", userId: "USR002", userName: "Priya Sharma", userEmail: "priya@example.com", type: "BUY", propertyTitle: "Tuscany Villa", propertySymbol: "BKV-PROP-FLR-004", propertyIcon: "🌿", amount: 667760, fee: 3339, status: "completed", date: "2026-04-13 18:20" },
  { id: "TXN-8817", userId: "USR006", userName: "Liam O'Sullivan", userEmail: "liam@example.com", type: "SELL", propertyTitle: "Malibu Beach House", propertySymbol: "BKV-PROP-MAL-002", propertyIcon: "🌴", amount: 4340440, fee: 13021, status: "pending", date: "2026-04-13 14:10" },
  { id: "TXN-8816", userId: "USR005", userName: "Adeola Williams", userEmail: "adeola@example.com", type: "BUY", propertyTitle: "Bondi Beachfront", propertySymbol: "BKV-PROP-SYD-006", propertyIcon: "🌊", amount: 542555, fee: 2713, status: "completed", date: "2026-04-13 11:05" },
  { id: "TXN-8815", userId: "USR003", userName: "Marcus Chen", userEmail: "marcus@example.com", type: "BUY", propertyTitle: "Kensington Manor", propertySymbol: "BKV-PROP-LON-001", propertyIcon: "🏰", amount: 1669400, fee: 8347, status: "flagged", date: "2026-04-13 09:50" },
  { id: "TXN-8814", userId: "USR001", userName: "James Harrington", userEmail: "james@example.com", type: "SELL", propertyTitle: "Tuscany Villa", propertySymbol: "BKV-PROP-FLR-004", propertyIcon: "🌿", amount: 934864, fee: 2805, status: "completed", date: "2026-04-12 16:30" },
  { id: "TXN-8813", userId: "USR006", userName: "Liam O'Sullivan", userEmail: "liam@example.com", type: "BUY", propertyTitle: "Manhattan Penthouse", propertySymbol: "BKV-PROP-NYC-003", propertyIcon: "🏙️", amount: 2921450, fee: 14607, status: "completed", date: "2026-04-12 10:15" },
  { id: "TXN-8812", userId: "USR002", userName: "Priya Sharma", userEmail: "priya@example.com", type: "SELL", propertyTitle: "Kensington Manor", propertySymbol: "BKV-PROP-LON-001", propertyIcon: "🏰", amount: 459085, fee: 1377, status: "completed", date: "2026-04-11 15:40" },
];

import { getAllSyncedTransactions, saveSyncedTransactions, SyncedTransaction } from "@/lib/synced-transactions";

export function TransactionsManager({
  transactions,
  currentUserId,
  currentUserRole,
  currentUserName,
  currentUserEmail,
}: {
  transactions?: any[];
  currentUserId?: string;
  currentUserRole?: string;
  currentUserName?: string;
  currentUserEmail?: string;
}) {
  const [items, setItems] = useState<TxItem[]>(() => {
    let parsed: TxItem[] = [];
    if (transactions && transactions.length > 0) {
      parsed = transactions.map((t, i) => {
        const uName = t.user?.name || t.userName || "Customer";
        const words = uName.trim().split(" ");
        const initials = words.length >= 2 ? `${words[0][0]}${words[1][0]}`.toUpperCase() : uName.slice(0, 2).toUpperCase();
        const propTitle = t.propertyTitle || t.property?.title || "Apartment in Downtown, Dubai";
        const propSym = t.propertySymbol || t.property?.symbol || `BV-AE-${String(i + 1).padStart(4, '0')}`;
        const pIcon = PROPERTY_ICONS[propTitle] || "🏰";
        const isSell = (t.type || "").toUpperCase() === "SELL";
        const feeAmt = t.fee ?? Math.round(t.amount * 0.005);
        const dateStr = t.createdAt ? new Date(t.createdAt).toISOString().replace("T", " ").slice(0, 16) : "2026-07-07 06:05";
        const statusMap: Record<string, "completed" | "pending" | "flagged" | "processing"> = {
          COMPLETED: "completed",
          PENDING: "pending",
          FAILED: "flagged",
          REFUNDED: "flagged",
          FLAGGED: "flagged",
        };
        const st = statusMap[t.status?.toUpperCase()] || "completed";

        return {
          id: t.id ? (t.id.startsWith("TXN-") ? t.id : `TXN-${t.id.slice(-4).toUpperCase()}`) : `TXN-${8821 - i}`,
          userId: t.userId || `USR00${(i % 6) + 1}`,
          userName: uName,
          userEmail: t.user?.email || t.userEmail || "user@example.com",
          userInitials: initials,
          userBg: AVATAR_COLORS[i % AVATAR_COLORS.length],
          type: isSell ? "SELL" : "BUY",
          propertyTitle: propTitle,
          propertySymbol: propSym,
          propertyIcon: pIcon,
          amount: t.amount || 1252050,
          fee: feeAmt,
          status: st,
          date: dateStr,
        };
      });
    }

    if (typeof window !== "undefined") {
      const synced = getAllSyncedTransactions();
      const mapSynced: TxItem[] = synced.map((s, i) => {
        const words = (s.userName || "Customer").trim().split(" ");
        const initials = words.length >= 2 ? `${words[0][0]}${words[1][0]}`.toUpperCase() : s.userName.slice(0, 2).toUpperCase();
        return {
          id: s.id,
          userId: s.userId,
          userName: s.userName,
          userEmail: s.userEmail,
          userInitials: initials,
          userBg: AVATAR_COLORS[i % AVATAR_COLORS.length],
          type: s.type === "SELL" ? "SELL" : "BUY",
          propertyTitle: s.propertyTitle,
          propertySymbol: s.propertySymbol,
          propertyIcon: PROPERTY_ICONS[s.propertyTitle] || "🏰",
          amount: s.amount,
          fee: s.fee,
          status: s.status,
          date: s.date,
        };
      });
      const existingIds = new Set(parsed.map((p) => p.id));
      const newFromSync = mapSynced.filter((m) => !existingIds.has(m.id));
      parsed = [...newFromSync, ...parsed];
    }

    if (parsed.length < 10) {
      const existingIds = new Set(parsed.map((p) => p.id));
      const extraMocks = INITIAL_TRANSACTIONS.filter((m) => !existingIds.has(m.id));
      return [...parsed, ...extraMocks];
    }

    return parsed;
  });

  useEffect(() => {
    const handleUpdate = () => {
      if (typeof window === "undefined") return;
      const synced = getAllSyncedTransactions();
      const mapSynced: TxItem[] = synced.map((s, i) => {
        const words = (s.userName || "Customer").trim().split(" ");
        const initials = words.length >= 2 ? `${words[0][0]}${words[1][0]}`.toUpperCase() : s.userName.slice(0, 2).toUpperCase();
        return {
          id: s.id,
          userId: s.userId,
          userName: s.userName,
          userEmail: s.userEmail,
          userInitials: initials,
          userBg: AVATAR_COLORS[i % AVATAR_COLORS.length],
          type: s.type === "SELL" ? "SELL" : "BUY",
          propertyTitle: s.propertyTitle,
          propertySymbol: s.propertySymbol,
          propertyIcon: PROPERTY_ICONS[s.propertyTitle] || "🏰",
          amount: s.amount,
          fee: s.fee,
          status: s.status,
          date: s.date,
        };
      });

      setItems((prev) => {
        const existingIds = new Set(mapSynced.map((r) => r.id));
        const customAdded = prev.filter((p) => !existingIds.has(p.id));
        return [...mapSynced, ...customAdded];
      });
    };

    window.addEventListener("realestate_crm_transactions_updated", handleUpdate);
    return () => {
      window.removeEventListener("realestate_crm_transactions_updated", handleUpdate);
    };
  }, []);

  // Filter States
  const [activeTab, setActiveTab] = useState<"all" | "buys" | "sells" | "flagged" | "pending">("all");
  const [userSearch, setUserSearch] = useState("");
  const [propSearch, setPropSearch] = useState("");
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortOption, setSortOption] = useState<string>("newest");
  const [selectedTx, setSelectedTx] = useState<TxItem | null>(null);

  // Auto-sync processed payout transactions from localStorage and live events
  useEffect(() => {
    function syncPayoutTxns() {
      const storedStr = localStorage.getItem("plotsnhomes_payout_txns");
      if (!storedStr) return;
      try {
        const payouts: TxItem[] = JSON.parse(storedStr);
        if (Array.isArray(payouts) && payouts.length > 0) {
          setItems((prev) => {
            const existingIds = new Set(prev.map((item) => item.id));
            const newPayouts = payouts.filter((p) => !existingIds.has(p.id));
            if (newPayouts.length === 0) return prev;
            return [...newPayouts, ...prev];
          });
        }
      } catch (e) {}
    }

    syncPayoutTxns();
    window.addEventListener("plotsnhomes_payout_processed", syncPayoutTxns);
    window.addEventListener("storage", syncPayoutTxns);

    return () => {
      window.removeEventListener("plotsnhomes_payout_processed", syncPayoutTxns);
      window.removeEventListener("storage", syncPayoutTxns);
    };
  }, []);

  const { getCellValue, updateCell } = useCustomCellData("transactions_manager");
  const {
    columns,
    visibleColumnIds,
    toggleColumn,
    addCustomColumn,
    updateCustomColumn,
    removeCustomColumn,
    resetColumns,
    isColumnVisible,
  } = useTableColumns("transactions_manager", [
    { id: "id", label: "ID", defaultVisible: true },
    { id: "user", label: "User", defaultVisible: true },
    { id: "type", label: "Type", defaultVisible: true },
    { id: "property", label: "Property", defaultVisible: true },
    { id: "amount", label: "Amount", defaultVisible: true },
    { id: "fee", label: "Fee", defaultVisible: true },
    { id: "status", label: "Status", defaultVisible: true },
    { id: "date", label: "Date", defaultVisible: true },
    { id: "actions", label: "Actions", defaultVisible: true },
  ]);

  // Property Dropdown options
  const propertyOptions = useMemo(() => {
    const set = new Set<string>();
    items.forEach((t) => set.add(t.propertyTitle));
    return Array.from(set);
  }, [items]);

  // Statistics
  const totalVolume = useMemo(() => items.reduce((sum, t) => sum + t.amount, 0), [items]);
  const totalCount = items.length;
  const flaggedCount = useMemo(() => items.filter((t) => t.status === "flagged").length, [items]);
  const pendingCount = useMemo(() => items.filter((t) => t.status === "pending").length, [items]);

  // Filter & Sort
  const filtered = useMemo(() => {
    let list = [...items];

    // If agent is logged in, restrict view to only their own transactions & assigned deal transactions
    if (currentUserRole === "AGENT" && (currentUserId || currentUserName || currentUserEmail)) {
      const lowerName = (currentUserName || "").toLowerCase();
      const lowerEmail = (currentUserEmail || "").toLowerCase();
      const uShortId = currentUserId ? `USR-${currentUserId.slice(-4).toUpperCase()}` : "";

      list = list.filter((t) => {
        const matchesUser =
          (currentUserId && t.userId === currentUserId) ||
          (uShortId && t.userId === uShortId) ||
          (lowerEmail && t.userEmail.toLowerCase() === lowerEmail) ||
          (lowerName && t.userName.toLowerCase().includes(lowerName));

        const isCommissionOrAssigned =
          t.propertyTitle.toLowerCase().includes("commission") ||
          t.propertySymbol.toLowerCase().includes("comm");

        return matchesUser || isCommissionOrAssigned;
      });
    }

    if (activeTab === "buys") list = list.filter((t) => t.type === "BUY");
    if (activeTab === "sells") list = list.filter((t) => t.type === "SELL");
    if (activeTab === "flagged") list = list.filter((t) => t.status === "flagged");
    if (activeTab === "pending") list = list.filter((t) => t.status === "pending");

    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      list = list.filter((t) =>
        t.userName.toLowerCase().includes(q) ||
        (t.userId || "").toLowerCase().includes(q) ||
        t.userEmail.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
      );
    }

    if (propSearch.trim()) {
      const q = propSearch.toLowerCase();
      list = list.filter((t) =>
        t.propertyTitle.toLowerCase().includes(q) ||
        t.propertySymbol.toLowerCase().includes(q)
      );
    }

    if (selectedPropertyFilter) {
      list = list.filter((t) => t.propertyTitle === selectedPropertyFilter);
    }

    if (dateFrom) list = list.filter((t) => t.date >= dateFrom);
    if (dateTo) list = list.filter((t) => t.date <= `${dateTo} 23:59`);

    if (minPrice) list = list.filter((t) => t.amount >= parseFloat(minPrice));
    if (maxPrice) list = list.filter((t) => t.amount <= parseFloat(maxPrice));

    list.sort((a, b) => {
      if (sortOption === "newest") return b.date.localeCompare(a.date);
      if (sortOption === "oldest") return a.date.localeCompare(b.date);
      if (sortOption === "high") return b.amount - a.amount;
      if (sortOption === "low") return a.amount - b.amount;
      return 0;
    });

    return list;
  }, [items, activeTab, userSearch, propSearch, selectedPropertyFilter, dateFrom, dateTo, minPrice, maxPrice, sortOption]);

  const clearFilters = () => {
    setActiveTab("all");
    setUserSearch("");
    setPropSearch("");
    setSelectedPropertyFilter("");
    setDateFrom("");
    setDateTo("");
    setMinPrice("");
    setMaxPrice("");
    setSortOption("newest");
  };

  const { ref: tableScrollRef, canScrollLeft, canScrollRight, scroll } = useHorizontalScroll([
    filtered,
    visibleColumnIds,
  ]);

  const handleAction = (id: string, action: "clear" | "reverse" | "approve") => {
    setItems((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        if (action === "clear" || action === "approve") return { ...t, status: "completed" };
        if (action === "reverse") return { ...t, status: "flagged" };
        return t;
      })
    );
  };

  const exportCSV = () => {
    const headers = ["ID", "User Name", "User ID", "Type", "Property", "Amount", "Fee", "Status", "Date"];
    const rows = filtered.map((t) => [
      t.id,
      `"${t.userName}"`,
      t.userId || "",
      t.type,
      `"${t.propertyTitle}"`,
      t.amount,
      t.fee,
      t.status,
      t.date,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
          const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `transactions_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const visibleColumnCount = useMemo(() => {
    let count = 0;
    if (isColumnVisible("id")) count++;
    if (isColumnVisible("user")) count++;
    if (isColumnVisible("type")) count++;
    if (isColumnVisible("property")) count++;
    if (isColumnVisible("amount")) count++;
    if (isColumnVisible("fee")) count++;
    if (isColumnVisible("status")) count++;
    if (isColumnVisible("date")) count++;
    count += columns.filter((c) => c.isCustom && isColumnVisible(c.id)).length;
    if (isColumnVisible("actions")) count++;
    return count;
  }, [isColumnVisible, columns]);

  const scaleClass = useMemo(() => {
    if (visibleColumnCount >= 10) return {
      padding: "px-1.5 py-1.5",
      text: "text-[10px]",
      nameW: "max-w-[85px]",
      propW: "max-w-[95px]",
      customTd: "px-1 py-1 min-w-[90px] max-w-[100px]",
      btnPadding: "px-1.5 py-0.5 text-[9px]"
    };
    if (visibleColumnCount >= 8) return {
      padding: "px-2 py-2",
      text: "text-[11px]",
      nameW: "max-w-[115px]",
      propW: "max-w-[120px]",
      customTd: "px-1.5 py-1.5 min-w-[105px] max-w-[120px]",
      btnPadding: "px-2 py-0.5 text-[10px]"
    };
    return {
      padding: "px-3 py-2.5",
      text: "text-xs",
      nameW: "max-w-[150px]",
      propW: "max-w-[150px]",
      customTd: "px-2 py-2 min-w-[120px]",
      btnPadding: "px-2.5 py-1 text-xs"
    };
  }, [visibleColumnCount]);

  return (
    <div className="space-y-6">
      {/* ── TOP 4 KEY STAT CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs relative overflow-hidden space-y-1">
          <div className="absolute top-4 right-4 text-xl opacity-40">💰</div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">TOTAL VOLUME</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">₹{totalVolume.toLocaleString('en-IN')}</div>
          <div className="text-xs text-slate-400 font-medium">All time</div>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs relative overflow-hidden space-y-1">
          <div className="absolute top-4 right-4 text-xl opacity-40">⇄</div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">TOTAL TRANSACTIONS</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{totalCount}</div>
          <div className="text-xs text-slate-400 font-medium">In system</div>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs relative overflow-hidden space-y-1">
          <div className="absolute top-4 right-4 text-xl opacity-40">⚠️</div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">FLAGGED</div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{flaggedCount}</div>
          <div className="text-xs text-rose-500 font-bold flex items-center gap-1">⚠ Needs review</div>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs relative overflow-hidden space-y-1">
          <div className="absolute top-4 right-4 text-xl opacity-40">⏳</div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">PENDING</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{pendingCount}</div>
          <div className="text-xs text-slate-400 font-medium">Awaiting processing</div>
        </div>
      </div>

      {/* ── SECTION HEADER ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white">All Transactions</h2>
        <button
          onClick={exportCSV}
          className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-2xs transition"
        >
          ⬇ Export CSV
        </button>
      </div>

      {/* ── SEARCH & FILTERS CONTROL CONTAINER ── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4 space-y-3.5 shadow-2xs">
        {/* Row 1: Filter tabs + Results counter + Clear button */}
        <div className="flex items-center justify-between flex-wrap gap-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: "all", label: "All" },
              { id: "buys", label: "▲ Buys" },
              { id: "sells", label: "▼ Sells" },
              { id: "flagged", label: "⚠ Flagged" },
              { id: "pending", label: "⏳ Pending" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === t.id
                    ? "bg-blue-100/90 text-blue-700 border border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                }`}
                onClick={() => setActiveTab(t.id as any)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-mono text-slate-400">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </span>
            <TableScrollButtons
              canScrollLeft={canScrollLeft}
              canScrollRight={canScrollRight}
              onScroll={scroll}
            />
            <button
              onClick={clearFilters}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition cursor-pointer"
            >
              × Clear Filters
            </button>
          </div>
        </div>

        {/* Row 2: Search inputs & Property dropdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-500 shadow-2xs"
            placeholder="🔑 User name or User ID..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
          />
          <input
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-500 shadow-2xs"
            placeholder="🏠 Property name or ID..."
            value={propSearch}
            onChange={(e) => setPropSearch(e.target.value)}
          />
          <select
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
            value={selectedPropertyFilter}
            onChange={(e) => setSelectedPropertyFilter(e.target.value)}
          >
            <option value="">All Properties</option>
            {propertyOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Row 3: Date inputs, preset buttons, Price min/max, Sort */}
        <div className="flex items-center gap-3 flex-wrap pt-1">
          <div className="flex items-center gap-2">
            <input
              type="date"
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500 shadow-2xs"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <span className="text-slate-400 text-xs font-bold">→</span>
            <input
              type="date"
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500 shadow-2xs"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                type="button"
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-xs cursor-pointer"
                onClick={() => {
                  const to = new Date();
                  const from = new Date(Date.now() - d * 864e5);
                  setDateFrom(from.toISOString().split("T")[0]);
                  setDateTo(to.toISOString().split("T")[0]);
                }}
              >
                {d}D
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:ml-auto">
            <span className="text-xs font-semibold text-slate-400">Price:</span>
            <input
              className="w-24 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-500 shadow-2xs"
              placeholder="Min $"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <span className="text-slate-400 text-xs">-</span>
            <input
              className="w-24 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-500 shadow-2xs"
              placeholder="Max $"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>

          <select
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="high">Highest Amount</option>
            <option value="low">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* ── TRANSACTIONS TABLE ── */}
      <TableToolbarManager
        tableTitle="Transactions Database"
        columns={columns}
        visibleColumnIds={visibleColumnIds}
        onToggleColumn={toggleColumn}
        onAddCustomColumn={addCustomColumn}
        onUpdateCustomColumn={updateCustomColumn}
        onRemoveCustomColumn={removeCustomColumn}
        onResetColumns={resetColumns}
      />

      <div ref={tableScrollRef} className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <table className={`w-full ${scaleClass.text}`}>
          <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-left text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            <tr>
              {isColumnVisible("id") && <th className={scaleClass.padding}>ID</th>}
              {isColumnVisible("user") && <th className={scaleClass.padding}>USER</th>}
              {isColumnVisible("type") && <th className={scaleClass.padding}>TYPE</th>}
              {isColumnVisible("property") && <th className={scaleClass.padding}>PROPERTY</th>}
              {isColumnVisible("amount") && <th className={scaleClass.padding}>AMOUNT</th>}
              {isColumnVisible("fee") && <th className={scaleClass.padding}>FEE</th>}
              {isColumnVisible("status") && <th className={scaleClass.padding}>STATUS</th>}
              {isColumnVisible("date") && <th className={scaleClass.padding}>DATE</th>}
              {columns.filter((c) => c.isCustom && isColumnVisible(c.id)).map((c) => (
                <th key={c.id} className={`${scaleClass.padding} text-amber-600 dark:text-amber-400`}>{c.label}</th>
              ))}
              {isColumnVisible("actions") && <th className={`${scaleClass.padding} text-right`}>ACTIONS</th>}
              <th className="px-2 py-2 text-center w-10 border-l border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const btn = document.querySelector('[data-column-manager-btn]') as HTMLButtonElement;
                    if (btn) btn.click();
                  }}
                  className="inline-flex items-center justify-center h-6 w-6 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 shadow-2xs transition"
                  title="Add / Customize Columns & Fields"
                >
                  <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={15} className="text-center py-8 text-slate-400">
                  No transactions match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((t, idx) => {
                const isBuy = t.type === "BUY";
                return (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {isColumnVisible("id") && (
                      <td className={`${scaleClass.padding} font-mono text-[10px] text-slate-500 whitespace-nowrap`}>
                        {t.id}
                      </td>
                    )}
                    {isColumnVisible("user") && (
                      <td className={scaleClass.padding}>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[10px] shrink-0" style={{ background: t.userBg || AVATAR_COLORS[idx % AVATAR_COLORS.length] }}>
                            {t.userInitials || "US"}
                          </div>
                          <div className="min-w-0">
                            <div className={`font-bold text-slate-900 dark:text-white truncate ${scaleClass.nameW}`}>{t.userName}</div>
                            <div className="text-[9px] text-slate-400 font-mono truncate">
                              {t.userId}
                            </div>
                          </div>
                        </div>
                      </td>
                    )}
                    {isColumnVisible("type") && (
                      <td className={scaleClass.padding}>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isBuy ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-sky-500/10 text-sky-600 dark:text-sky-400"}`}>
                          {t.type}
                        </span>
                      </td>
                    )}
                    {isColumnVisible("property") && (
                      <td className={scaleClass.padding}>
                        <div className={`font-semibold text-slate-900 dark:text-white truncate ${scaleClass.propW}`}>
                          {t.propertyIcon || "🏰"} {t.propertyTitle}
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono">
                          {t.propertySymbol}
                        </div>
                      </td>
                    )}
                    {isColumnVisible("amount") && (
                      <td className={`${scaleClass.padding} font-bold text-slate-900 dark:text-white tabular-nums whitespace-nowrap`}>
                        ₹{t.amount.toLocaleString("en-IN")}
                      </td>
                    )}
                    {isColumnVisible("fee") && (
                      <td className={`${scaleClass.padding} text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap`}>
                        ₹{t.fee.toLocaleString("en-IN")}
                      </td>
                    )}
                    {isColumnVisible("status") && (
                      <td className={scaleClass.padding}>
                        {t.status === "completed" && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">completed</span>}
                        {t.status === "flagged" && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">⚠ flagged</span>}
                        {t.status === "pending" && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">pending</span>}
                        {t.status === "processing" && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400">processing</span>}
                      </td>
                    )}
                    {isColumnVisible("date") && (
                      <td className={`${scaleClass.padding} text-slate-500 dark:text-slate-400 whitespace-nowrap text-[10px]`}>
                        {t.date}
                      </td>
                    )}
                    {columns.filter((c) => c.isCustom && isColumnVisible(c.id)).map((c) => (
                      <td key={c.id} className={scaleClass.customTd} onClick={(e) => e.stopPropagation()}>
                        <EditableCell
                          value={getCellValue(t.id, c.id)}
                          fieldType={c.fieldType}
                          options={c.options}
                          placeholder={`+ Enter ${c.label}...`}
                          onChange={(val) => updateCell(t.id, c.id, val)}
                        />
                      </td>
                    ))}
                    {isColumnVisible("actions") && (
                      <td className={scaleClass.padding} style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
                          <button
                            onClick={() => setSelectedTx(t)}
                            className="inline-flex items-center px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold transition shadow-2xs"
                          >
                            View
                          </button>
                          {t.status === "flagged" && (
                            <>
                              <button
                                onClick={() => handleAction(t.id, "clear")}
                                className="inline-flex items-center px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-2xs"
                              >
                                Clear
                              </button>
                              <button
                                onClick={() => handleAction(t.id, "reverse")}
                                className="inline-flex items-center px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-2xs"
                              >
                                Reverse
                              </button>
                            </>
                          )}
                          {t.status === "pending" && (
                            <button
                              onClick={() => handleAction(t.id, "approve")}
                              className="inline-flex items-center px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-2xs"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                    <td className="px-3 py-3.5 text-center border-l border-slate-200 dark:border-slate-800"></td>
                  </tr>
                );
              })
            )}

            <tr className="bg-slate-900/50 hover:bg-slate-900 transition">
              <td colSpan={15} className="px-5 py-3 text-left">
                <button
                  type="button"
                  onClick={() => {
                    const newId = `TXN-${Math.floor(1000 + Math.random() * 9000)}`;
                    const newTx: TxItem = {
                      id: newId,
                      userId: "USR-NEW",
                      userName: "New User",
                      userEmail: "user@example.com",
                      type: "BUY",
                      propertyTitle: "Kensington Manor",
                      propertySymbol: "BKV-PROP-LON-001",
                      propertyIcon: "🏰",
                      amount: 500000,
                      fee: 2500,
                      status: "pending",
                      date: new Date().toISOString().slice(0, 16).replace("T", " "),
                    };
                    setItems((prev) => [newTx, ...prev]);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white transition"
                >
                  <Plus className="h-4 w-4 text-amber-500 stroke-[2.5]" />
                  <span>+ Add New Transaction Row</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── TRANSACTION DETAIL RECEIPT MODAL ── */}
      {selectedTx && (
        <div className="a-modal-ov" onClick={() => setSelectedTx(null)}>
          <div className="a-modal" style={{ width: 500 }} onClick={(e) => e.stopPropagation()}>
            <div className="a-modal-head">
              <div>
                <div className="a-modal-title">Transaction Receipt</div>
                <div style={{ fontSize: 10, color: "var(--txt3)", fontFamily: "'IBM Plex Mono', monospace", marginTop: 2 }}>
                  Ref: {selectedTx.id}
                </div>
              </div>
              <button className="a-modal-close" onClick={() => setSelectedTx(null)}>
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="a-calc-box" style={{ marginBottom: 14 }}>
              <div className="a-calc-row">
                <span>User</span>
                <span style={{ fontWeight: 700 }}>{selectedTx.userName} ({selectedTx.userId})</span>
              </div>
              <div className="a-calc-row">
                <span>Email</span>
                <span style={{ color: "var(--txt2)" }}>{selectedTx.userEmail}</span>
              </div>
              <div className="a-calc-row">
                <span>Type</span>
                <span style={{ color: selectedTx.type === "BUY" ? "var(--grn)" : "var(--acc2)", fontWeight: 700 }}>{selectedTx.type}</span>
              </div>
              <div className="a-calc-row">
                <span>Property</span>
                <span>{selectedTx.propertyIcon} {selectedTx.propertyTitle}</span>
              </div>
              <div className="a-calc-row">
                <span>Property Symbol</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: "var(--acc2)" }}>{selectedTx.propertySymbol}</span>
              </div>
              <hr className="a-calc-divider" />
              <div className="a-calc-row total">
                <span>Gross Amount</span>
                <span>₹{selectedTx.amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="a-calc-row">
                <span>Brokerage Fee</span>
                <span>₹{selectedTx.fee.toLocaleString('en-IN')}</span>
              </div>
              <div className="a-calc-row">
                <span>Status</span>
                <span className={`a-bd ${selectedTx.status === 'completed' ? 'a-bd-g' : selectedTx.status === 'flagged' ? 'a-bd-r' : 'a-bd-a'}`}>
                  {selectedTx.status}
                </span>
              </div>
              <div className="a-calc-row">
                <span>Timestamp</span>
                <span style={{ fontSize: 10, color: "var(--txt3)" }}>{selectedTx.date}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              {selectedTx.status === "pending" && (
                <button
                  className="a-btn a-btn-grn"
                  style={{ flex: 1 }}
                  onClick={() => {
                    handleAction(selectedTx.id, "approve");
                    setSelectedTx(null);
                  }}
                >
                  <CheckCircle2 className="h-3 w-3" /> Approve Transaction
                </button>
              )}
              {selectedTx.status === "flagged" && (
                <button
                  className="a-btn a-btn-grn"
                  style={{ flex: 1 }}
                  onClick={() => {
                    handleAction(selectedTx.id, "clear");
                    setSelectedTx(null);
                  }}
                >
                  Clear Flag
                </button>
              )}
              <button className="a-btn a-btn-ghost" style={{ flex: 1 }} onClick={() => setSelectedTx(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
