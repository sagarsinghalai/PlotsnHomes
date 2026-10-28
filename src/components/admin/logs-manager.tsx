"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  FileText,
  Search,
  Filter,
  UserCheck,
  User,
  Edit,
  Activity,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  Plus,
  ArrowUpRight,
  RefreshCw,
  X,
  CheckCircle2,
  Briefcase,
  Store,
  Building2,
} from "lucide-react";
import {
  getAllActivityLogs,
  logActivity,
  ActivityLogItem,
  LogCategory,
} from "@/lib/activity-logs";
import { useAdminPermissions } from "@/components/admin/admin-permissions-context";
import { useHorizontalScroll } from "@/hooks/use-horizontal-scroll";
import { TableScrollButtons } from "@/components/ui/table-scroll-buttons";

export function LogsManager({
  allowedActorEmails = null,
  viewerEmail = null,
}: {
  // null = this viewer may see every actor's activity (owner/admin). Otherwise,
  // only activity by these actor emails (their subtree, or just themselves).
  allowedActorEmails?: string[] | null;
  viewerEmail?: string | null;
} = {}) {
  const { hasAddPermission } = useAdminPermissions();
  const canAdd = hasAddPermission("/admin/emails");

  // Restrict the mock activity feed to the actors this viewer is allowed to see,
  // so an agent/staffer sees only their own (or downline) activity — never the
  // superadmin's or other teams'.
  const scopeLogs = useCallback(
    (all: ActivityLogItem[]): ActivityLogItem[] => {
      if (!allowedActorEmails) return all;
      const allow = new Set(allowedActorEmails.map((e) => e.toLowerCase()));
      if (viewerEmail) allow.add(viewerEmail.toLowerCase());
      return all.filter((l) => l.actorEmail && allow.has(l.actorEmail.toLowerCase()));
    },
    [allowedActorEmails, viewerEmail]
  );

  const [logs, setLogs] = useState<ActivityLogItem[]>(() => scopeLogs(getAllActivityLogs()));
  const [activeTab, setActiveTab] = useState<LogCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);

  // New Log Form State
  const [newCategory, setNewCategory] = useState<LogCategory>("agent");
  const [newAction, setNewAction] = useState("");
  const [newActorName, setNewActorName] = useState("");
  const [newActorRole, setNewActorRole] = useState("AGENT");
  const [newTarget, setNewTarget] = useState("");
  const [newDetails, setNewDetails] = useState("");

  useEffect(() => {
    const handleUpdate = () => {
      setLogs(scopeLogs(getAllActivityLogs()));
    };
    window.addEventListener("plotsnhomes_logs_updated", handleUpdate);
    return () => {
      window.removeEventListener("plotsnhomes_logs_updated", handleUpdate);
    };
  }, [scopeLogs]);

  // Re-apply the scope if it changes (and on mount, so SSR's unscoped seed is
  // replaced immediately on the client).
  useEffect(() => {
    setLogs(scopeLogs(getAllActivityLogs()));
  }, [scopeLogs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (activeTab !== "all" && log.category !== activeTab) return false;
      if (roleFilter !== "ALL" && log.actorRole !== roleFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchAction = log.action.toLowerCase().includes(q);
        const matchActor = log.actorName.toLowerCase().includes(q);
        const matchEmail = (log.actorEmail || "").toLowerCase().includes(q);
        const matchTarget = log.target.toLowerCase().includes(q);
        const matchDetails = log.details.toLowerCase().includes(q);
        const matchId = log.id.toLowerCase().includes(q);
        if (!matchAction && !matchActor && !matchEmail && !matchTarget && !matchDetails && !matchId) {
          return false;
        }
      }
      return true;
    });
  }, [logs, activeTab, roleFilter, search]);

  const adminCount = useMemo(() => logs.filter((l) => l.category === "admin").length, [logs]);
  const employeeCount = useMemo(() => logs.filter((l) => l.category === "employee").length, [logs]);
  const agentCount = useMemo(() => logs.filter((l) => l.category === "agent").length, [logs]);
  const sellerCount = useMemo(() => logs.filter((l) => l.category === "seller").length, [logs]);
  const customerCount = useMemo(() => logs.filter((l) => l.category === "customer").length, [logs]);
  const editCount = useMemo(() => logs.filter((l) => l.category === "edit").length, [logs]);

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAction || !newActorName || !newTarget) {
      alert("Please fill in Action, Actor Name, and Target fields.");
      return;
    }

    logActivity({
      category: newCategory,
      action: newAction,
      actorName: newActorName,
      actorRole: newActorRole,
      target: newTarget,
      details: newDetails || "Manual audit entry recorded by admin.",
      location: "India",
      ipAddress: "103.211.12.8",
    });

    setNewAction("");
    setNewActorName("");
    setNewTarget("");
    setNewDetails("");
    setShowAddModal(false);
  };

  const { ref: tableScrollRef, canScrollLeft, canScrollRight, scroll } = useHorizontalScroll([filteredLogs]);

  const hasActiveFilters = search !== "" || roleFilter !== "ALL" || activeTab !== "all";
  const clearAllFilters = () => {
    setSearch("");
    setRoleFilter("ALL");
    setActiveTab("all");
  };

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-white">
      {/* Overview Cards Grid for ALL User Roles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Admin Card */}
        <div
          onClick={() => setActiveTab("admin")}
          className={`group cursor-pointer p-5 rounded-2xl border transition-all duration-200 relative overflow-hidden shadow-2xs hover:shadow-md ${
            activeTab === "admin"
              ? "bg-blue-50/50 dark:bg-blue-950/30 border-blue-400 dark:border-blue-700 ring-2 ring-blue-400/20"
              : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-700 hover:bg-blue-50/40 dark:hover:bg-blue-950/20"
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors truncate ${
              activeTab === "admin" ? "text-blue-700 dark:text-blue-400" : "text-slate-500 dark:text-slate-400 group-hover:text-blue-700 dark:group-hover:text-blue-400"
            }`}>
              ADMIN LOGS
            </span>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
              activeTab === "admin" ? "bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-blue-100 group-hover:text-blue-700 dark:group-hover:bg-blue-900/60 dark:group-hover:text-blue-300"
            }`}>
              {adminCount} Logs
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white my-1">{adminCount}</div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-normal line-clamp-1 mt-0.5">
            Governance & security rules
          </p>
        </div>

        {/* Employee Card */}
        <div
          onClick={() => setActiveTab("employee")}
          className={`group cursor-pointer p-5 rounded-2xl border transition-all duration-200 relative overflow-hidden shadow-2xs hover:shadow-md ${
            activeTab === "employee"
              ? "bg-purple-50/50 dark:bg-purple-950/30 border-purple-400 dark:border-purple-700 ring-2 ring-purple-400/20"
              : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-700 hover:bg-purple-50/40 dark:hover:bg-purple-950/20"
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors truncate ${
              activeTab === "employee" ? "text-purple-700 dark:text-purple-400" : "text-slate-500 dark:text-slate-400 group-hover:text-purple-700 dark:group-hover:text-purple-400"
            }`}>
              EMPLOYEE LOGS
            </span>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
              activeTab === "employee" ? "bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-purple-100 group-hover:text-purple-700 dark:group-hover:bg-purple-900/60 dark:group-hover:text-purple-300"
            }`}>
              {employeeCount} Logs
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white my-1">{employeeCount}</div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-normal line-clamp-1 mt-0.5">
            Lead routing & CRM updates
          </p>
        </div>

        {/* Agent Card */}
        <div
          onClick={() => setActiveTab("agent")}
          className={`group cursor-pointer p-5 rounded-2xl border transition-all duration-200 relative overflow-hidden shadow-2xs hover:shadow-md ${
            activeTab === "agent"
              ? "bg-amber-50/50 dark:bg-amber-950/30 border-amber-400 dark:border-amber-700 ring-2 ring-amber-400/20"
              : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-700 hover:bg-amber-50/40 dark:hover:bg-amber-950/20"
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors truncate ${
              activeTab === "agent" ? "text-amber-800 dark:text-amber-300" : "text-slate-500 dark:text-slate-400 group-hover:text-amber-800 dark:group-hover:text-amber-300"
            }`}>
              AGENT LOGS
            </span>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
              activeTab === "agent" ? "bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-amber-100 group-hover:text-amber-800 dark:group-hover:bg-amber-900/60 dark:group-hover:text-amber-300"
            }`}>
              {agentCount} Logs
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white my-1">{agentCount}</div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-normal line-clamp-1 mt-0.5">
            Site visits & commissions
          </p>
        </div>

        {/* Seller Card */}
        <div
          onClick={() => setActiveTab("seller")}
          className={`group cursor-pointer p-5 rounded-2xl border transition-all duration-200 relative overflow-hidden shadow-2xs hover:shadow-md ${
            activeTab === "seller"
              ? "bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-400 dark:border-indigo-700 ring-2 ring-indigo-400/20"
              : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-700 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20"
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors truncate ${
              activeTab === "seller" ? "text-indigo-700 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-400"
            }`}>
              SELLER LOGS
            </span>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
              activeTab === "seller" ? "bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-100 group-hover:text-indigo-700 dark:group-hover:bg-indigo-900/60 dark:group-hover:text-indigo-300"
            }`}>
              {sellerCount} Logs
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white my-1">{sellerCount}</div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-normal line-clamp-1 mt-0.5">
            Listings & payout claims
          </p>
        </div>

        {/* Customer Card */}
        <div
          onClick={() => setActiveTab("customer")}
          className={`group cursor-pointer p-5 rounded-2xl border transition-all duration-200 relative overflow-hidden shadow-2xs hover:shadow-md ${
            activeTab === "customer"
              ? "bg-sky-50/50 dark:bg-sky-950/30 border-sky-400 dark:border-sky-700 ring-2 ring-sky-400/20"
              : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-sky-400 dark:hover:border-sky-700 hover:bg-sky-50/40 dark:hover:bg-sky-950/20"
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors truncate ${
              activeTab === "customer" ? "text-sky-700 dark:text-sky-400" : "text-slate-500 dark:text-slate-400 group-hover:text-sky-700 dark:group-hover:text-sky-400"
            }`}>
              CUSTOMER LOGS
            </span>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
              activeTab === "customer" ? "bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-sky-100 group-hover:text-sky-700 dark:group-hover:bg-sky-900/60 dark:group-hover:text-sky-300"
            }`}>
              {customerCount} Logs
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white my-1">{customerCount}</div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-normal line-clamp-1 mt-0.5">
            Inquiries & EMI checks
          </p>
        </div>

        {/* Edit & System Mutation Card */}
        <div
          onClick={() => setActiveTab("edit")}
          className={`group cursor-pointer p-5 rounded-2xl border transition-all duration-200 relative overflow-hidden shadow-2xs hover:shadow-md ${
            activeTab === "edit"
              ? "bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-700 ring-2 ring-emerald-400/20"
              : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-700 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20"
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors truncate ${
              activeTab === "edit" ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-400"
            }`}>
              EDIT & MUTATION
            </span>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
              activeTab === "edit" ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-emerald-100 group-hover:text-emerald-700 dark:group-hover:bg-emerald-900/60 dark:group-hover:text-emerald-300"
            }`}>
              {editCount} Logs
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white my-1">{editCount}</div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-normal line-clamp-1 mt-0.5">
            RERA, master specs & edits
          </p>
        </div>
      </div>

      {/* Main Filter Tabs Bar & Add Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: "all", label: `All Logs (${logs.length})` },
            { id: "admin", label: `Admin (${adminCount})` },
            { id: "employee", label: `Employee (${employeeCount})` },
            { id: "agent", label: `Agent (${agentCount})` },
            { id: "seller", label: `Seller (${sellerCount})` },
            { id: "customer", label: `Customer (${customerCount})` },
            { id: "edit", label: `System Edits (${editCount})` },
          ].map((t) => {
            const isSel = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                  isSel
                    ? "bg-slate-900 text-white dark:bg-[#b58a18] dark:text-slate-950 shadow-md"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {canAdd && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#b58a18] hover:bg-[#9e7713] text-slate-950 text-xs font-black transition shadow-md shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[3]" /> Log Custom Activity
          </button>
        )}
      </div>

      {/* Search & Role Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search activity logs by action, actor name, target, or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-10 pr-4 py-2 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#b58a18]"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Actor Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-xs font-extrabold text-slate-900 dark:text-white outline-none focus:border-[#b58a18] cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            <option value="SUPERADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="EMPLOYEE">Employee</option>
            <option value="AGENT">Agent</option>
            <option value="SELLER">Seller</option>
            <option value="BUYER">Buyer (Customer)</option>
          </select>
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

      {/* Real-time Logs List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div ref={tableScrollRef} className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-extrabold uppercase text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Log Ref & Category</th>
                <th className="px-4 py-3.5">Actor (Who)</th>
                <th className="px-4 py-3.5">Action Executed</th>
                <th className="px-4 py-3.5">Target Entity</th>
                <th className="px-4 py-3.5">Activity Details</th>
                <th className="px-4 py-3.5">Timestamp & Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredLogs.map((log) => {
                const categoryBadge = {
                  admin: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800",
                  employee: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-800",
                  agent: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800",
                  seller: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-300 dark:border-indigo-800",
                  customer: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-300 dark:border-sky-800",
                  edit: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800",
                }[log.category];

                const categoryLabel = {
                  admin: "ADMIN GOVERNANCE",
                  employee: "EMPLOYEE TASK",
                  agent: "AGENT ACTIVITY",
                  seller: "SELLER SUBMISSION",
                  customer: "CUSTOMER INTERACTION",
                  edit: "SYSTEM MUTATION",
                }[log.category];

                return (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="px-4 py-4 align-top">
                      <span className="font-mono font-black text-xs text-[#b58a18] dark:text-[#d4af37] block mb-1">
                        {log.id}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wide whitespace-nowrap ${categoryBadge}`}>
                        {categoryLabel}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="font-black text-slate-900 dark:text-white text-xs">{log.actorName}</div>
                      <div className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wide mt-0.5">{log.actorRole}</div>
                      {log.actorEmail && <div className="text-[10px] text-slate-400 font-mono mt-0.5">{log.actorEmail}</div>}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="font-black text-slate-900 dark:text-white text-xs leading-snug">{log.action}</div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="font-extrabold text-slate-800 dark:text-slate-200 text-xs leading-snug">{log.target}</div>
                    </td>
                    <td className="px-4 py-4 align-top max-w-sm">
                      <div className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed font-medium">
                        {log.details}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top whitespace-nowrap">
                      <div className="text-slate-900 dark:text-white font-mono text-xs font-black">
                        {log.timestamp}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-1">
                        <MapPin className="h-3 w-3 text-slate-400 shrink-0" /> {log.location || "India"} ({log.ipAddress || "Internal"})
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredLogs.length === 0 && (
            <div className="text-center py-16 text-slate-400 font-bold">
              No activity logs match your filters or search query.
            </div>
          )}
        </div>
      </div>

      {/* Manual Custom Log Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Log Custom Activity Event</h3>
              <button onClick={() => setShowAddModal(false)} className="cursor-pointer"><X className="h-4 w-4 text-slate-400 hover:text-slate-600" /></button>
            </div>

            <form onSubmit={handleAddLog} className="space-y-3.5 text-xs font-semibold">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">Log Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as LogCategory)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 bg-slate-50 dark:bg-slate-950 font-bold outline-none focus:border-[#b58a18]"
                >
                  <option value="admin">Admin Governance Log</option>
                  <option value="employee">Employee Task Log</option>
                  <option value="agent">Agent Activity Log</option>
                  <option value="seller">Seller Submission Log</option>
                  <option value="customer">Customer Interaction Log</option>
                  <option value="edit">System Mutation Log</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">Actor Role</label>
                <select
                  value={newActorRole}
                  onChange={(e) => setNewActorRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 bg-slate-50 dark:bg-slate-950 font-bold outline-none focus:border-[#b58a18]"
                >
                  <option value="SUPERADMIN">Super Admin</option>
                  <option value="ADMIN">Admin</option>
                  <option value="EMPLOYEE">Employee</option>
                  <option value="AGENT">Agent</option>
                  <option value="SELLER">Seller</option>
                  <option value="BUYER">Buyer (Customer)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">Action Executed</label>
                <input
                  type="text"
                  placeholder="e.g. Site Visit Completed / Price Updated"
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 bg-slate-50 dark:bg-slate-950 font-bold outline-none focus:border-[#b58a18]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">Actor Name</label>
                <input
                  type="text"
                  placeholder="e.g. Bhavya / Rahul Sharma"
                  value={newActorName}
                  onChange={(e) => setNewActorName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 bg-slate-50 dark:bg-slate-950 font-bold outline-none focus:border-[#b58a18]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">Target Entity</label>
                <input
                  type="text"
                  placeholder="e.g. DLF Privana / User USR-10030"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 bg-slate-50 dark:bg-slate-950 font-bold outline-none focus:border-[#b58a18]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">Log Details</label>
                <textarea
                  rows={3}
                  placeholder="Provide context and notes for this log entry..."
                  value={newDetails}
                  onChange={(e) => setNewDetails(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 bg-slate-50 dark:bg-slate-950 font-bold outline-none focus:border-[#b58a18]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-extrabold text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-[#b58a18] hover:bg-[#9e7713] text-slate-950 font-black flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" /> Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
