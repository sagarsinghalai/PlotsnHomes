"use client";

import { useState, useMemo, useEffect } from "react";
import {
  X,
  Save,
  Ban,
  CheckCircle2,
  Trash2,
  Edit,
  ArrowDownLeft,
  Star,
  Plus,
  Building,
  MapPin,
  UserCheck,
  ShieldCheck,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { roleLabel } from "@/lib/roles";
import type { UserRow } from "./users-directory";
import { getTransactionsForUser, SyncedTransaction } from "@/lib/synced-transactions";
import { logActivity } from "@/lib/activity-logs";

/* ─── Types ─── */
type UserModalTab = "profile" | "address" | "banks" | "txns";

type BankAccount = {
  id: string;
  type: "bank" | "upi" | "escrow";
  label: string;
  flag?: string;
  primary: boolean;
  currency: string;
  accountName?: string;
  accountNumber?: string;
  ifsc?: string;
  swift?: string;
  vpa?: string;
};

/* ─── Avatar colors ─── */
const AVATAR_COLORS = [
  "linear-gradient(135deg, #4f8ef7, #a855f7)",
  "linear-gradient(135deg, #22c55e, #06b6d4)",
  "linear-gradient(135deg, #f59e0b, #f43f5e)",
  "linear-gradient(135deg, #8b5cf6, #ec4899)",
  "linear-gradient(135deg, #06b6d4, #3b82f6)",
  "linear-gradient(135deg, #f43f5e, #f59e0b)",
];

function getInitials(name: string) {
  if (!name) return "US";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function statusBadgeClass(status: string) {
  const map: Record<string, string> = {
    active: "a-bd a-bd-g",
    verified: "a-bd a-bd-g",
    completed: "a-bd a-bd-g",
    suspended: "a-bd a-bd-r",
    flagged: "a-bd a-bd-r",
    rejected: "a-bd a-bd-r",
    pending: "a-bd a-bd-a",
    submitted: "a-bd a-bd-b",
    processing: "a-bd a-bd-b",
  };
  return map[status?.toLowerCase()] || "a-bd a-bd-b";
}

/* ─── DYNAMIC MOCK DATA GENERATOR PER USER ─── */
function generateMockBanks(user: UserRow): BankAccount[] {
  const isUK = user.city?.toLowerCase().includes("london") || user.email.includes(".uk");
  const isUAE = user.city?.toLowerCase().includes("dubai") || user.email.includes(".ae");
  
  const flag = isUK ? "🇬🇧" : isUAE ? "🇦🇪" : "🇮🇳";
  const currency = isUK ? "GBP" : isUAE ? "AED" : "INR";
  const mainBankName = isUK ? "Barclays UK Escrow" : isUAE ? "Emirates NBD Escrow" : "HDFC Real Estate Escrow";
  const swiftCode = isUK ? "BARCGB22" : isUAE ? "EBILAEAD" : "HDFCINBB";

  return [
    {
      id: `b1_${user.id}`,
      type: "escrow",
      label: mainBankName,
      flag: flag,
      primary: true,
      currency: currency,
      accountName: user.name,
      accountNumber: `****${Math.floor(1000 + Math.random() * 9000)}`,
      ifsc: !isUK && !isUAE ? "HDFC0000104" : undefined,
      swift: swiftCode,
    },
    {
      id: `b2_${user.id}`,
      type: "upi",
      label: "UPI Payment Handle",
      flag: "🇮🇳",
      primary: false,
      currency: "INR",
      vpa: `${user.email.split("@")[0]}@axisbank`,
    },
  ];
}

function getCountryFromUser(user: UserRow): string {
  if (user.country && user.country.trim()) return user.country;
  if (user.city && user.city.trim()) {
    const c = user.city.toLowerCase();
    if (c.includes("dubai") || c.includes("uae") || c.includes("abu dhabi")) return "UAE";
    if (c.includes("london") || c.includes("uk") || c.includes("manchester")) return "UK";
    if (c.includes("new york") || c.includes("usa") || c.includes("chicago")) return "USA";
    if (c.includes("mumbai") || c.includes("delhi") || c.includes("bangalore") || c.includes("india")) return "India";
    return user.city;
  }
  return "India";
}

/* ═══════════════════════════════════════════════════════
   USER DETAIL MODAL
   ═══════════════════════════════════════════════════════ */
export function UserDetailModal({
  user,
  userIndex,
  onClose,
}: {
  user: UserRow;
  userIndex: number;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<UserModalTab>("profile");
  const [banks] = useState<BankAccount[]>(() => generateMockBanks(user));
  const [transactions, setTransactions] = useState<SyncedTransaction[]>(() =>
    getTransactionsForUser(user)
  );

  useEffect(() => {
    const handleUpdate = () => {
      setTransactions(getTransactionsForUser(user));
    };
    window.addEventListener("realestate_crm_transactions_updated", handleUpdate);
    return () => {
      window.removeEventListener("realestate_crm_transactions_updated", handleUpdate);
    };
  }, [user]);

  // Real Estate Profile Form States
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone || "");
  const [dob, setDob] = useState(user.dob || "15/03/1984");
  const [role, setRole] = useState(user.role);
  const [kycStatus, setKycStatus] = useState(user.kycStatus || "APPROVED");
  const [accountStatus, setAccountStatus] = useState(user.active ? "active" : "suspended");
  const [managerName, setManagerName] = useState(user.managerName || "Senior Sales Manager");

  // Address States
  const [address, setAddress] = useState(user.address || "");
  const [city, setCity] = useState(user.city || "");
  const [state, setState] = useState(user.state || "");
  const [country, setCountry] = useState(() => getCountryFromUser(user));
  const [zip, setZip] = useState(user.zip || "");

  const avatarBg = AVATAR_COLORS[userIndex % AVATAR_COLORS.length];
  const customerId = user.userId || `USR-${String(10020 + userIndex)}`;

  const tabs: { id: UserModalTab; label: string; icon: string }[] = [
    { id: "profile", label: "Profile Info", icon: "👤" },
    { id: "address", label: "Address & Location", icon: "📍" },
    { id: "banks", label: "Bank Escrow", icon: "🏦" },
    { id: "txns", label: "Deals & Transactions", icon: "⇄" },
  ];

  const handleSaveProfile = () => {
    logActivity({
      category: "edit",
      action: "User Profile Modified",
      actorName: "Admin Staff",
      actorRole: "SUPERADMIN",
      target: `User ${customerId} (${name})`,
      details: `Updated user profile details: Role set to ${role}, KYC status to ${kycStatus}, Account status to ${accountStatus}.`,
    });
    alert("User profile updated & audit log recorded!");
  };

  return (
    <div className="a-modal-ov font-sans text-slate-900 dark:text-white" onClick={onClose}>
      <div className="a-modal font-sans" style={{ width: 780 }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="a-modal-head border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3.5">
            <div className="a-ua shrink-0 font-extrabold shadow-sm" style={{ background: avatarBg, width: 48, height: 48, fontSize: 16, borderRadius: 12 }}>
              {getInitials(name)}
            </div>
            <div>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">{name}</div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{customerId}</span> · {roleLabel(role)} · {email} · Joined{" "}
                {new Date(user.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className={`a-btn a-btn-sm font-bold ${accountStatus === "active" ? "a-btn-red" : "a-btn-grn"}`}
              onClick={() => setAccountStatus(accountStatus === "active" ? "suspended" : "active")}
            >
              {accountStatus === "active" ? <><Ban className="h-3.5 w-3.5" /> Suspend</> : <><CheckCircle2 className="h-3.5 w-3.5" /> Reactivate</>}
            </button>
            <button className="a-btn a-btn-acc a-btn-sm font-bold" onClick={handleSaveProfile}>
              <Save className="h-3.5 w-3.5" /> Save Changes
            </button>
            <button className="a-modal-close" onClick={onClose}><X className="h-4 w-4" /></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-5">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`a-um-tab font-bold text-xs tracking-wide transition-all ${activeTab === t.id ? "on text-amber-600 dark:text-gold border-b-2 border-gold" : "text-slate-500 dark:text-slate-400"}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span className="mr-1.5">{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {/* 1. PROFILE INFO TAB */}
        {activeTab === "profile" && (
          <div className="space-y-5 font-sans">
            <div className="grid grid-cols-2 gap-4">
              <div className="a-fg">
                <label className="a-fl font-extrabold text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300">FULL NAME</label>
                <input className="a-fi text-xs font-semibold" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="a-fg">
                <label className="a-fl font-extrabold text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300">EMAIL ADDRESS</label>
                <input className="a-fi text-xs font-semibold" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="a-fg">
                <label className="a-fl font-extrabold text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300">PHONE NUMBER</label>
                <input className="a-fi text-xs font-semibold" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
              </div>
              <div className="a-fg">
                <label className="a-fl font-extrabold text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300">DATE OF BIRTH</label>
                <input className="a-fi text-xs font-semibold" value={dob} onChange={(e) => setDob(e.target.value)} placeholder="DD/MM/YYYY" />
              </div>
              <div className="a-fg">
                <label className="a-fl font-extrabold text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300">ACCOUNT ROLE</label>
                <SearchableSelect
                  options={[
                    { value: "BUYER", label: "Buyer (Customer)" },
                    { value: "AGENT", label: "Agent" },
                    { value: "SELLER", label: "Seller" },
                    { value: "EMPLOYEE", label: "Employee" },
                    { value: "SUPERADMIN", label: "Super Admin" },
                  ]}
                  value={role}
                  onChange={(val) => setRole(val as any)}
                  placeholder="Select Role..."
                  searchPlaceholder="Search Role..."
                />
              </div>
              <div className="a-fg">
                <label className="a-fl font-extrabold text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300">KYC STATUS</label>
                <SearchableSelect
                  options={[
                    { value: "APPROVED", label: "Approved ✓" },
                    { value: "PENDING", label: "Pending Verification" },
                    { value: "SUBMITTED", label: "Documents Submitted" },
                    { value: "REJECTED", label: "Rejected" },
                  ]}
                  value={kycStatus}
                  onChange={(val) => setKycStatus(val)}
                  placeholder="Select KYC status..."
                  searchPlaceholder="Search KYC status..."
                />
              </div>
              <div className="a-fg">
                <label className="a-fl font-extrabold text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300">ACCOUNT STATUS</label>
                <SearchableSelect
                  options={[
                    { value: "active", label: "Active" },
                    { value: "suspended", label: "Suspended" },
                  ]}
                  value={accountStatus}
                  onChange={(val) => setAccountStatus(val)}
                  placeholder="Select Account status..."
                  searchPlaceholder="Search Account status..."
                />
              </div>
              <div className="a-fg">
                <label className="a-fl font-extrabold text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300">ASSIGNED CRM MANAGER</label>
                <input className="a-fi text-xs font-semibold" value={managerName} onChange={(e) => setManagerName(e.target.value)} placeholder="Senior Sales Lead" />
              </div>
            </div>

            {/* Real Estate Profile Summary Box */}
            <div className="a-calc-box font-sans rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/70 dark:bg-slate-900/70 shadow-xs space-y-2.5">
              <div className="text-xs font-extrabold uppercase tracking-wider border-b pb-2 text-slate-800 dark:text-slate-200">
                Real Estate Profile Snapshot
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[11px] text-slate-500 font-semibold block">User ID</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{customerId}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-semibold block">Account Role</span>
                  <span className="font-bold text-slate-900 dark:text-white">{roleLabel(role)}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-semibold block">Assigned CRM Manager</span>
                  <span className="font-bold text-slate-900 dark:text-white">{managerName}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-semibold block">Listed Properties</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">{user._count.properties} properties</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-semibold block">Deals & Transactions</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">{user._count.transactions} logged</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-semibold block">KYC Status</span>
                  <span className={`font-bold ${kycStatus === "APPROVED" ? "text-emerald-600" : "text-amber-600"}`}>{kycStatus}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button className="a-btn a-btn-ghost font-bold" onClick={onClose}>Cancel</button>
              <button className="a-btn a-btn-acc font-bold ml-auto" onClick={() => alert("Profile updated!")}>
                <Save className="h-3.5 w-3.5" /> Save Profile
              </button>
            </div>
          </div>
        )}

        {/* 2. ADDRESS & LOCATION TAB */}
        {activeTab === "address" && (
          <div className="space-y-4 font-sans">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 a-fg">
                <label className="a-fl font-extrabold text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300">STREET ADDRESS</label>
                <input className="a-fi text-xs font-semibold" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House/Flat No., Street, Locality" />
              </div>
              <div className="a-fg">
                <label className="a-fl font-extrabold text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300">CITY / LOCALITY</label>
                <input className="a-fi text-xs font-semibold" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Gurgaon, Dubai, London" />
              </div>
              <div className="a-fg">
                <label className="a-fl font-extrabold text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300">STATE / REGION</label>
                <input className="a-fi text-xs font-semibold" value={state} onChange={(e) => setState(e.target.value)} placeholder="e.g. Haryana" />
              </div>
              <div className="a-fg">
                <label className="a-fl font-extrabold text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300">COUNTRY</label>
                <input className="a-fi text-xs font-semibold" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. India" />
              </div>
              <div className="a-fg">
                <label className="a-fl font-extrabold text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300">ZIP / POSTAL CODE</label>
                <input className="a-fi text-xs font-semibold font-mono" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="122001" />
              </div>
            </div>

            <div className="flex gap-2.5 pt-4 border-t">
              <button className="a-btn a-btn-ghost font-bold" onClick={onClose}>Cancel</button>
              <button className="a-btn a-btn-acc font-bold ml-auto" onClick={() => alert("Address updated!")}>
                <Save className="h-3.5 w-3.5" /> Save Address
              </button>
            </div>
          </div>
        )}

        {/* 3. BANK ESCROW TAB */}
        {activeTab === "banks" && (
          <div className="font-sans space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="text-xs font-bold text-slate-600 dark:text-slate-400">{banks.length} linked payout & escrow accounts</div>
              <button className="a-btn a-btn-acc a-btn-sm font-bold"><Plus className="h-3.5 w-3.5" /> Add Bank Account</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {banks.map((b) => (
                <div key={b.id} className={`a-ub-card ${b.primary ? "primary" : ""}`}>
                  <div className="a-ub-card-type flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{b.flag || "💳"}</span>
                      <span className="font-bold text-xs">{b.type.toUpperCase()}</span>
                    </div>
                    {b.primary && <span className="a-bd a-bd-g text-[9px] font-bold">PRIMARY ESCROW</span>}
                  </div>
                  <div className="a-ub-card-name text-sm font-extrabold mt-1">{b.label}</div>
                  <div className="a-ub-card-detail text-xs leading-relaxed my-2 space-y-0.5">
                    {b.accountName && <div><span className="text-slate-400">Holder:</span> {b.accountName}</div>}
                    {b.accountNumber && <div><span className="text-slate-400">Account:</span> {b.accountNumber}</div>}
                    {b.vpa && <div><span className="text-slate-400">VPA:</span> {b.vpa}</div>}
                    {b.ifsc && <div><span className="text-slate-400">IFSC:</span> {b.ifsc}</div>}
                    {b.swift && <div><span className="text-slate-400">SWIFT:</span> {b.swift}</div>}
                    <div className="text-amber-600 font-bold mt-1">{b.currency}</div>
                  </div>
                  <div className="a-ub-card-actions flex gap-1 pt-2">
                    <button className="a-btn a-btn-ghost a-btn-sm font-bold"><Edit className="h-3 w-3" /> Edit</button>
                    {!b.primary && <button className="a-btn a-btn-ghost a-btn-sm font-bold"><Star className="h-3 w-3" /> Set Primary</button>}
                    <button className="a-btn a-btn-ghost a-btn-sm text-rose-500 ml-auto"><Trash2 className="h-3 w-3" /></button>
                  </div>
                </div>
              ))}

              <div className="bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-5 flex items-center justify-center cursor-pointer hover:border-gold transition min-h-[150px]">
                <div className="text-center">
                  <div className="text-xl font-bold mb-1">+</div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Add Bank Account</div>
                  <div className="text-[10px] text-slate-400 mt-1">Escrow Bank · NEFT / RTGS · UPI</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. DEALS & TRANSACTIONS TAB */}
        {activeTab === "txns" && (
          <div className="font-sans space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="text-xs font-bold text-slate-600 dark:text-slate-400">{transactions.length} real estate transactions logged</div>
              <button className="a-btn a-btn-ghost a-btn-sm font-bold"><ArrowDownLeft className="h-3.5 w-3.5" /> Export CSV</button>
            </div>
            <div className="a-tbl-wrap overflow-x-auto rounded-xl border">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 font-extrabold uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">Ref ID</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Method</th>
                    <th className="p-2.5">Property</th>
                    <th className="p-2.5">Amount</th>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                      <td className="p-2.5 font-mono text-[11px] font-bold text-slate-900 dark:text-white">{t.id}</td>
                      <td className="p-2.5 font-bold uppercase">{t.type}</td>
                      <td className="p-2.5 text-slate-500">{t.method}</td>
                      <td className="p-2.5 font-semibold">{t.propertyTitle || "Primary Asset"}</td>
                      <td className="p-2.5 font-extrabold text-slate-900 dark:text-white">{formatCurrency(t.amount)}</td>
                      <td className="p-2.5 text-slate-500 whitespace-nowrap">{t.date}</td>
                      <td className="p-2.5"><span className={statusBadgeClass(t.status)}>{t.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
