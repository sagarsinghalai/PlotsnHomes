"use client";

import { useState, useEffect, useMemo } from "react";
import { CreditCard, Landmark, Check, X, ShieldAlert, Coins, Settings, Plus, Copy, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

type PaymentLog = {
  id: string;
  userName: string;
  userEmail: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  type: string;
  createdAt: string;
};

type Gateway = {
  id: string;
  name: string;
  desc: string;
  logo: string;
  fee: string;
  min: string;
  max: string;
  settle: string;
  active: boolean;
  volume: number;
  txns: number;
};

type BankAccount = {
  id: string;
  flag: string;
  label: string;
  primary: boolean;
  active: boolean;
  currency: string;
  fields: { label: string; value: string }[];
};

export function PaymentsManager({ recentPayments }: { recentPayments: PaymentLog[] }) {
  const [activeTab, setActiveTab] = useState<"domestic" | "international" | "crypto" | "bank" | "settings">("domestic");

  // Gateways State
  const [gateways, setGateways] = useState<{ domestic: Gateway[]; international: Gateway[]; crypto: Gateway[] }>({
    domestic: [
      { id: "rzp", name: "Razorpay", desc: "Cards, Netbanking, UPI, Wallets", logo: "💳", fee: "2.0%", min: "₹100", max: "₹1,000,000", settle: "T+2 Days", active: true, volume: 45000, txns: 120 },
      { id: "pe", name: "PhonePe PG", desc: "UPI, Cards, Wallets", logo: "🟣", fee: "1.8%", min: "₹100", max: "₹500,000", settle: "T+1 Day", active: true, volume: 32000, txns: 98 },
      { id: "cf", name: "Cashfree", desc: "Instant settlements, UPI, Cards", logo: "⚡", fee: "1.9%", min: "₹100", max: "₹1,000,000", settle: "T+1 Day", active: false, volume: 0, txns: 0 },
    ],
    international: [
      { id: "stripe", name: "Stripe Global", desc: "Global cards, Apple Pay, Google Pay", logo: "💳", fee: "2.9% + $0.30", min: "$5", max: "$250,000", settle: "Rolling 2 Days", active: true, volume: 148000, txns: 240 },
      { id: "adyen", name: "Adyen", desc: "Global payment methods, local cards", logo: "🌐", fee: "2.5%", min: "$10", max: "No Cap", settle: "Weekly", active: false, volume: 0, txns: 0 },
      { id: "paypal", name: "PayPal Business", desc: "PayPal wallet, express checkout", logo: "🔵", fee: "3.4% + $0.30", min: "$1", max: "$50,000", settle: "Instant", active: true, volume: 22000, txns: 48 },
    ],
    crypto: [
      { id: "cb", name: "Coinbase Commerce", desc: "BTC, ETH, USDC, USDT payments", logo: "₿", fee: "1.0%", min: "$10", max: "No Cap", settle: "Instant", active: true, volume: 92000, txns: 85 },
      { id: "now", name: "NOWPayments", desc: "50+ altcoins, instant auto-conversion", logo: "🪙", fee: "0.5%", min: "$5", max: "No Cap", settle: "Instant", active: false, volume: 0, txns: 0 },
    ],
  });

  // Bank Accounts State (Persisted locally in component state)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([
    {
      id: "bank_01",
      flag: "🇮🇳",
      label: "HDFC Bank Escrow",
      primary: true,
      active: true,
      currency: "INR",
      fields: [
        { label: "Account Name", value: "Plotsnhomes India Private Limited" },
        { label: "Account Number", value: "50200012345678" },
        { label: "IFSC Code", value: "HDFC0000104" },
        { label: "Branch", value: "MG Road, Bangalore" },
      ],
    },
    {
      id: "bank_02",
      flag: "🇺🇸",
      label: "Chase Checking",
      primary: false,
      active: true,
      currency: "USD",
      fields: [
        { label: "Account Name", value: "Plotsnhomes Corp LLC" },
        { label: "Account Number", value: "9876543210" },
        { label: "Routing Number", value: "021000021" },
        { label: "Swift Code", value: "CHASUS33" },
      ],
    },
  ]);

  // System settings state
  const [minWithdrawal, setMinWithdrawal] = useState(100);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [settlementDelay, setSettlementDelay] = useState(2);
  const [defaultCurrency, setDefaultCurrency] = useState("USD");

  // Load from localStorage if present
  useEffect(() => {
    const savedBanks = localStorage.getItem("bv_bank_accounts");
    if (savedBanks) {
      try {
        setBankAccounts(JSON.parse(savedBanks));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveBanks = (banks: BankAccount[]) => {
    setBankAccounts(banks);
    localStorage.setItem("bv_bank_accounts", JSON.stringify(banks));
  };

  // Gateway toggler
  const handleToggleGateway = (panel: "domestic" | "international" | "crypto", id: string) => {
    setGateways(prev => {
      const list = prev[panel].map(g => (g.id === id ? { ...g, active: !g.active } : g));
      return { ...prev, [panel]: list };
    });
  };

  // Add Bank account
  const handleAddBank = () => {
    const label = prompt("Enter bank account label:");
    if (!label) return;

    const accNum = prompt("Enter Account Number:");
    if (!accNum) return;

    const ifscOrSwift = prompt("Enter Swift / IFSC Code:");
    if (!ifscOrSwift) return;

    const newBank: BankAccount = {
      id: `bank_${Date.now()}`,
      flag: "🏦",
      label,
      primary: false,
      active: true,
      currency: defaultCurrency,
      fields: [
        { label: "Account Number", value: accNum },
        { label: "Identifier Code", value: ifscOrSwift },
      ],
    };

    saveBanks([...bankAccounts, newBank]);
    alert("New receiver bank account registered.");
  };

  // Delete bank
  const handleDeleteBank = (id: string) => {
    const bank = bankAccounts.find(b => b.id === id);
    if (!bank) return;
    if (bank.primary) {
      alert("Cannot delete the primary payout account. Set another bank as primary first.");
      return;
    }
    if (confirm(`Remove bank account: ${bank.label}?`)) {
      saveBanks(bankAccounts.filter(b => b.id !== id));
    }
  };

  // Set primary bank
  const handleSetPrimaryBank = (id: string) => {
    saveBanks(bankAccounts.map(b => ({ ...b, primary: b.id === id })));
    alert("Primary settlement account updated.");
  };

  // Statistics
  const activeCount = useMemo(() => {
    const dom = gateways.domestic.filter(g => g.active).length;
    const int = gateways.international.filter(g => g.active).length;
    const cry = gateways.crypto.filter(g => g.active).length;
    return dom + int + cry;
  }, [gateways]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition-colors">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Gateways</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{activeCount} / 8</p>
          <p className="text-xs text-slate-400 mt-1">Configured methods</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition-colors">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total volume (30D)</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{formatCurrency(342000)}</p>
          <p className="text-xs text-slate-400 mt-1">Settled payments</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition-colors">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Success Rate</p>
          <p className="mt-2 text-2xl font-bold text-blue-600">98.4%</p>
          <p className="text-xs text-slate-400 mt-1">API gateway response</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition-colors">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Escrow Accounts</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">{bankAccounts.length}</p>
          <p className="text-xs text-slate-400 mt-1">Receiving banks configured</p>
        </div>
      </div>

      {/* 2. Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200">
        {(["domestic", "international", "crypto", "bank", "settings"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`border-b-2 px-4 py-2.5 text-xs font-bold transition-all -mb-px outline-none ${
              activeTab === tab
                ? "border-gold text-slate-900 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            {tab === "domestic" && "🇮🇳 Domestic (India)"}
            {tab === "international" && "🌐 International"}
            {tab === "crypto" && "₿ Crypto"}
            {tab === "bank" && "🏦 Bank Escrow Accounts"}
            {tab === "settings" && "⚙ Gateway Settings"}
          </button>
        ))}
      </div>

      {/* 3. Panel Content */}
      <div className="mt-4">
        {/* Gateways Render */}
        {(activeTab === "domestic" || activeTab === "international" || activeTab === "crypto") && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gateways[activeTab].map(g => (
              <div
                key={g.id}
                className={`rounded-2xl border p-5 shadow-sm bg-white flex flex-col justify-between transition ${
                  g.active ? "border-emerald-200 shadow-emerald-50/10" : "border-slate-200 opacity-60"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl">{g.logo}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={g.active}
                        onChange={() => handleToggleGateway(activeTab, g.id)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  <h3 className="font-semibold text-slate-900 text-base">{g.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{g.desc}</p>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-600 font-medium">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Gateway Fee</span>
                      <span>{g.fee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Min / Max</span>
                      <span>{g.min} – {g.max}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Settlement</span>
                      <span>{g.settle}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex gap-2">
                  <button
                    onClick={() => alert(`Configuring API credentials for ${g.name}...`)}
                    className="flex-1 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Configure
                  </button>
                  <button
                    onClick={() => alert(`Showing API response logs for ${g.name}...`)}
                    className="flex-1 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    API Logs
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bank Escrow Panel */}
        {activeTab === "bank" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {bankAccounts.map(b => (
                <div key={b.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl">{b.flag}</span>
                      <h3 className="font-semibold text-slate-900">{b.label}</h3>
                      {b.primary && (
                        <span className="ml-auto inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          PRIMARY
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 text-xs">
                      {b.fields.map((f, i) => (
                        <div key={i} className="flex justify-between py-1 border-b border-slate-50">
                          <span className="text-slate-400">{f.label}</span>
                          <span className="font-semibold text-slate-900 font-mono select-all truncate max-w-[180px]">{f.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex gap-2">
                    {!b.primary && (
                      <button
                        onClick={() => handleSetPrimaryBank(b.id)}
                        className="flex-1 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        Set Primary
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteBank(b.id)}
                      className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 transition"
                      title="Delete Account"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add Bank Account Dotted Card */}
              <div
                onClick={handleAddBank}
                className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 hover:border-gold hover:bg-amber-50/20 transition cursor-pointer flex flex-col items-center justify-center p-6 min-h-[160px]"
              >
                <Plus className="h-7 w-7 text-slate-400 mb-2" />
                <span className="font-semibold text-slate-700 text-sm">Add Escrow Account</span>
                <span className="text-slate-400 text-xs mt-1 text-center">Configure a new bank or wallet for receiving investor funds</span>
              </div>
            </div>
          </div>
        )}

        {/* Settings Panel */}
        {activeTab === "settings" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm max-w-xl">
            <h3 className="font-display text-lg font-bold text-slate-900 mb-4">Global Gateway Parameters</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Minimum Withdrawal ($)</label>
                <input
                  type="number"
                  value={minWithdrawal}
                  onChange={e => setMinWithdrawal(parseInt(e.target.value) || 0)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-gold focus:outline-none w-full bg-slate-50/50 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Admin Session Timeout (Minutes)</label>
                <input
                  type="number"
                  value={sessionTimeout}
                  onChange={e => setSessionTimeout(parseInt(e.target.value) || 0)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-gold focus:outline-none w-full bg-slate-50/50 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Standard Settlement Delay (Days)</label>
                <input
                  type="number"
                  value={settlementDelay}
                  onChange={e => setSettlementDelay(parseInt(e.target.value) || 0)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-gold focus:outline-none w-full bg-slate-50/50 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Default Settlement Currency</label>
                <select
                  value={defaultCurrency}
                  onChange={e => setDefaultCurrency(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-gold focus:outline-none w-full bg-slate-50/50 focus:bg-white transition cursor-pointer"
                >
                  <option value="USD">USD ($)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              <div className="pt-2">
                <Button
                  variant="gold"
                  className="w-full text-xs"
                  onClick={() => alert("Global payment configuration settings successfully saved.")}
                >
                  Save Platform Settings
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Recent Payment Activity */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden mt-8">
        <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-slate-900">Recent Payment Activity Logs</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-5 py-3 text-[11px] uppercase tracking-wider">Ref ID</th>
                <th className="px-5 py-3 text-[11px] uppercase tracking-wider">User</th>
                <th className="px-5 py-3 text-[11px] uppercase tracking-wider">Type</th>
                <th className="px-5 py-3 text-[11px] uppercase tracking-wider">Method</th>
                <th className="px-5 py-3 text-[11px] uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3 text-[11px] uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-[11px] uppercase tracking-wider">Settlement Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-6 text-center text-slate-400">
                    No recent payment activity logged.
                  </td>
                </tr>
              ) : (
                recentPayments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-slate-400">
                      {p.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-semibold text-slate-900 block leading-tight">{p.userName}</span>
                      <span className="text-[10px] text-slate-400">{p.userEmail}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-700 font-semibold text-xs">
                      {p.type}
                    </td>
                    <td className="px-5 py-3 text-slate-600 font-medium">
                      {p.method}
                    </td>
                    <td className="px-5 py-3 font-bold text-slate-900">
                      {formatCurrency(p.amount, p.currency)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                        p.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 font-mono text-xs">
                      {new Date(p.createdAt).toLocaleString()}
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
