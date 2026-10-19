"use client";

import { useState, useMemo } from "react";
import { Landmark, CircleDollarSign, Check, X, ShieldAlert, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useHorizontalScroll } from "@/hooks/use-horizontal-scroll";
import { TableScrollButtons } from "@/components/ui/table-scroll-buttons";
import { ViewToggle, useViewMode } from "@/components/admin/view-toggle";

type WalletUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  walletBalance: number;
  investedBalance: number;
  createdAt: string;
};

type Withdrawal = {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  method: string;
  date: string;
  status: "PENDING" | "COMPLETED" | "REJECTED";
};

export function WalletsManager({ users }: { users: WalletUser[] }) {
  // Local state for user balances
  const [walletUsers, setWalletUsers] = useState<WalletUser[]>(users);
  const [viewMode, setViewMode] = useViewMode("admin-wallets", "grid");

  // Initialize mock pending withdrawals matching HTML mockup
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([
    { id: "WD-001", userId: "usr_liam", userName: "Liam O'Sullivan", amount: 12000, method: "Bank Transfer", date: "2026-04-14", status: "PENDING" },
    { id: "WD-002", userId: "usr_marcus", userName: "Marcus Chen", amount: 8500, method: "Wire Transfer", date: "2026-04-13", status: "PENDING" },
    { id: "WD-003", userId: "usr_adeola", userName: "Adeola Williams", amount: 2100, method: "Bank Transfer", date: "2026-04-13", status: "PENDING" },
    { id: "WD-004", userId: "usr_james", userName: "James Harrington", amount: 5000, method: "Bank Transfer", date: "2026-04-12", status: "PENDING" },
  ]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalWallet = walletUsers.reduce((sum, u) => sum + u.walletBalance, 0);
    const totalInvested = walletUsers.reduce((sum, u) => sum + u.investedBalance, 0);
    const totalFunds = totalWallet + totalInvested;
    const pendingWithdrawalSum = withdrawals
      .filter(w => w.status === "PENDING")
      .reduce((sum, w) => sum + w.amount, 0);

    return {
      totalWallet,
      totalInvested,
      totalFunds,
      pendingWithdrawalSum,
    };
  }, [walletUsers, withdrawals]);

  // Actions
  const handleAdjustBalance = (id: string) => {
    const user = walletUsers.find(u => u.id === id);
    if (!user) return;

    const input = prompt(
      `Adjust wallet balance for ${user.name}\nCurrent Balance: ${formatCurrency(user.walletBalance)}\nEnter new balance ($):`
    );

    if (input === null) return;
    const newBal = parseFloat(input);
    if (isNaN(newBal) || newBal < 0) {
      alert("Please enter a valid positive number.");
      return;
    }

    setWalletUsers(prev =>
      prev.map(u => (u.id === id ? { ...u, walletBalance: newBal } : u))
    );
  };

  const handleApproveWithdrawal = (id: string) => {
    const w = withdrawals.find(x => x.id === id);
    if (!w) return;

    // Deduct from user wallet if they exist in our list
    // (fallback matching user by name or ID)
    setWalletUsers(prev =>
      prev.map(u => {
        if (u.name.toLowerCase() === w.userName.toLowerCase() || u.id === w.userId) {
          return { ...u, walletBalance: Math.max(0, u.walletBalance - w.amount) };
        }
        return u;
      })
    );

    setWithdrawals(prev =>
      prev.map(x => (x.id === id ? { ...x, status: "COMPLETED" as const } : x))
    );
  };

  const handleRejectWithdrawal = (id: string) => {
    setWithdrawals(prev =>
      prev.map(x => (x.id === id ? { ...x, status: "REJECTED" as const } : x))
    );
  };

  const { ref: tableScrollRef, canScrollLeft, canScrollRight, scroll } = useHorizontalScroll([withdrawals]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition-colors">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Platform Total Funds</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(stats.totalFunds)}</p>
          <p className="text-xs text-slate-400 mt-1">Cash + Deployed Assets</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition-colors">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Wallet Balances</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{formatCurrency(stats.totalWallet)}</p>
          <p className="text-xs text-slate-400 mt-1">Liquid Cash Available</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition-colors">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Invested (Active)</p>
          <p className="mt-2 text-2xl font-bold text-blue-600">{formatCurrency(stats.totalInvested)}</p>
          <p className="text-xs text-slate-400 mt-1">Deployed in properties</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition-colors">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Withdrawals</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">{formatCurrency(stats.pendingWithdrawalSum)}</p>
          <p className="text-xs text-slate-400 mt-1">
            {withdrawals.filter(w => w.status === "PENDING").length} pending requests
          </p>
        </div>
      </div>

      {/* 2. User Wallets Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-slate-900">User Account Wallets</h2>
          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </div>
        <div className={viewMode === "list" ? "flex flex-col gap-3" : viewMode === "tile" ? "grid gap-4 sm:grid-cols-2" : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}>
          {walletUsers.map((u, idx) => {
            const total = u.walletBalance + u.investedBalance;
            const deployedPct = total > 0 ? Math.round((u.investedBalance / total) * 100) : 0;
            
            // Deterministic avatar colors
            const colors = ["bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500", "bg-cyan-500", "bg-rose-500"];
            const avatarColor = colors[idx % colors.length];

            return (
              <div key={u.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm ${avatarColor}`}>
                      {u.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-slate-900 block truncate leading-tight">{u.name}</span>
                      <span className="text-slate-400 text-[10px] font-mono">{u.id.slice(-8).toUpperCase()}</span>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      u.active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                    }`}>
                      {u.active ? "ACTIVE" : "SUSPENDED"}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Available Balance</p>
                    <p className="text-xl font-extrabold text-slate-900">{formatCurrency(u.walletBalance)}</p>
                  </div>

                  {/* Deployed asset progress bar */}
                  <div className="mt-4">
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full ${avatarColor}`} style={{ width: `${deployedPct}%` }}></div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1.5 font-medium">
                      <span>Invested: {formatCurrency(u.investedBalance)}</span>
                      <span>{deployedPct}% deployed</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex gap-2">
                  <button
                    onClick={() => handleAdjustBalance(u.id)}
                    className="flex-1 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Adjust Cash
                  </button>
                  <button
                    onClick={() => alert(`Ledger view for ${u.name} is fully integrated. All transactions are logged under Trade History.`)}
                    className="flex-1 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Ledger
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Pending Withdrawals */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-slate-700" />
            <h2 className="font-display text-lg font-bold text-slate-900">Pending Wallet Withdrawals</h2>
          </div>
          <TableScrollButtons canScrollLeft={canScrollLeft} canScrollRight={canScrollRight} onScroll={scroll} />
        </div>
        <div ref={tableScrollRef} className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-5 py-3 text-[11px] uppercase tracking-wider">User Account</th>
                <th className="px-5 py-3 text-[11px] uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3 text-[11px] uppercase tracking-wider">Gateway / Method</th>
                <th className="px-5 py-3 text-[11px] uppercase tracking-wider">Request Date</th>
                <th className="px-5 py-3 text-[11px] uppercase tracking-wider">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-slate-400">
                    No withdrawal requests logged.
                  </td>
                </tr>
              ) : (
                withdrawals.map(w => (
                  <tr key={w.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-slate-900 block leading-tight">{w.userName}</span>
                      <span className="text-[10px] text-slate-400 font-mono uppercase">{w.userId}</span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{formatCurrency(w.amount)}</td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium">{w.method}</td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">{w.date}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        w.status === "PENDING" ? "bg-amber-100 text-amber-800" :
                        w.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {w.status === "PENDING" ? (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleApproveWithdrawal(w.id)}
                            className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                            title="Approve & Send Funds"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRejectWithdrawal(w.id)}
                            className="p-1 rounded bg-red-50 hover:bg-red-100 text-red-700 transition"
                            title="Reject & Cancel Request"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-semibold italic">Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
