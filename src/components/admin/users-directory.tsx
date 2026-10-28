"use client";

import { Role } from "@prisma/client";
import { Pencil, Plus, Search, SlidersHorizontal, Users, UserCheck, ShieldCheck, UserX, X, Download, ChevronDown, FileSpreadsheet, FileText, Loader2, Upload, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useRef, useEffect } from "react";
import { hasCrmAccess, roleLabel } from "@/lib/roles";
import { activityLabel, isUserOnline } from "@/lib/user-activity";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { TableToolbarManager } from "@/components/ui/table-toolbar-manager";
import { useTableColumns, useCustomCellData } from "@/hooks/use-table-columns";
import { EditableCell } from "@/components/ui/editable-cell";
import { UserDetailModal } from "@/components/admin/user-detail-modal";
import { BulkImportUsersModal } from "@/components/admin/bulk-import-users-modal";
import { ViewToggle, useViewMode, viewContainerClass } from "@/components/admin/view-toggle";

import { useAdminPermissions } from "@/components/admin/admin-permissions-context";

export type UserRow = {
  id: string;
  userId?: string | null;
  name: string;
  email: string;
  phone: string | null;
  dob?: string | null;
  address?: string | null;
  city: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  role: Role;
  managerName?: string | null;
  department?: string | null;
  active: boolean;
  selfDeleted?: boolean;
  deactivationReason?: string | null;
  deactivatedAt?: string | null;
  lastActiveAt: string | null;
  createdAt: string;
  kycStatus: string | null;
  canManage?: boolean;
  _count: { properties: number; transactions: number };
};

type Tab = "all" | Role;

// Full role taxonomy in valid hierarchical order (platform → franchise → team → customers).
const ROLE_HIERARCHY: Role[] = [
  "SUPERADMIN",
  "PLATFORM_ADMIN",
  "WHITE_LABEL_ADMIN",
  "FRANCHISE_ADMIN",
  "BRANCH_MANAGER",
  "DEPARTMENT_HEAD",
  "TEAM_LEADER",
  "EXECUTIVE",
  "EMPLOYEE",
  "AGENT",
  "SELLER",
  "BUYER",
  "DEMO",
];

export function UsersDirectory({
  users,
  initialSearch = "",
  initialTab = "all",
}: {
  users: UserRow[];
  initialSearch?: string;
  initialTab?: Tab;
}) {
  const router = useRouter();
  const { hasEditPermission } = useAdminPermissions();
  const canEdit = hasEditPermission("/admin/users");
  const [search, setSearch] = useState(initialSearch);
  const [roleFilter, setRoleFilter] = useState<string>(
    initialTab && initialTab !== "all" ? initialTab : "ALL"
  );
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>("ALL");
  const [modalUser, setModalUser] = useState<UserRow | null>(null);
  const [modalUserIndex, setModalUserIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [viewMode, setViewMode] = useViewMode("admin-users", "list");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const itemsPerPage = 5;

  function showToast(kind: "ok" | "err", text: string) {
    setToast({ kind, text });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleDeleteUser(u: UserRow) {
    if (!window.confirm(`Delete ${u.name} (${u.userId ?? u.email})? This permanently removes the account and cannot be undone.`)) return;
    setDeletingId(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { showToast("err", data.error || "Could not delete user."); return; }
      showToast("ok", `Deleted ${u.name}.`);
      router.refresh();
    } catch {
      showToast("err", "Could not delete user.");
    } finally {
      setDeletingId(null);
    }
  }


  async function handleToggleActive(u: UserRow) {
    const next = !u.active;
    if (!next && !window.confirm(`Deactivate ${u.name}? They will be signed out and cannot log in until reactivated. No data is deleted.`)) return;
    setTogglingId(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { showToast("err", data.error || "Could not update account."); return; }
      showToast("ok", `${next ? "Activated" : "Deactivated"} ${u.name}.`);
      router.refresh();
    } catch {
      showToast("err", "Could not update account.");
    } finally {
      setTogglingId(null);
    }
  }

  const { getCellValue, updateCell } = useCustomCellData("users_directory");

  const {
    columns,
    visibleColumnIds,
    toggleColumn,
    addCustomColumn,
    updateCustomColumn,
    removeCustomColumn,
    resetColumns,
    isColumnVisible,
  } = useTableColumns("users_directory_v4", [
    // Standard Base Columns (From 2nd Screenshot)
    { id: "userId", label: "User ID", defaultVisible: true, isPermanent: true },
    { id: "user", label: "User Name", defaultVisible: true },
    { id: "contact", label: "Contact Info", defaultVisible: true },
    { id: "location", label: "Location", defaultVisible: true },
    { id: "type", label: "Account Role", defaultVisible: true },
    { id: "kyc", label: "KYC Status", defaultVisible: true },
    { id: "activity", label: "Last Activity", defaultVisible: true },
    { id: "actions", label: "Actions", defaultVisible: true },

    // Account & contact Section Fields (Non-duplicate Profile Fields)
    { id: "acc_dob", label: "Date of birth", defaultVisible: false, category: "Account & contact" },
    { id: "acc_active", label: "Account active", defaultVisible: false, category: "Account & contact" },

    // Address Section Fields (Non-duplicate Address Fields)
    { id: "addr_street", label: "Street address", defaultVisible: false, category: "Address" },
    { id: "addr_country", label: "Country", defaultVisible: false, category: "Address" },
    { id: "addr_state", label: "State / region", defaultVisible: false, category: "Address" },
    { id: "addr_zip", label: "ZIP / Postal Code", defaultVisible: false, category: "Address" },
  ]);

  const userDropdownOptions = useMemo(() => {
    return [
      { value: "ALL", label: "All Listed Users" },
      ...users.map((u) => ({
        value: u.id,
        label: `${u.name} (${roleLabel(u.role)})`,
        sublabel: `${u.userId || "USR-XXXXX"} · ${u.email}`,
      })),
    ];
  }, [users]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, selectedUserFilter]);

  const filtered = useMemo(() => {
    let list = users;
    if (roleFilter !== "ALL") {
      list = list.filter((u) => u.role === roleFilter);
    }
    if (selectedUserFilter !== "ALL") {
      list = list.filter((u) => u.id === selectedUserFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          (u.userId ?? "").toLowerCase().includes(q) ||
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.phone ?? "").includes(q)
      );
    }
    return list;
  }, [users, search, roleFilter, selectedUserFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const hasActiveFilters =
    search.trim() !== "" ||
    roleFilter !== "ALL" ||
    selectedUserFilter !== "ALL";

  const clearAllFilters = () => {
    setSearch("");
    setRoleFilter("ALL");
    setSelectedUserFilter("ALL");
    setCurrentPage(1);
  };

  // Close the export menu when clicking outside it.
  useEffect(() => {
    if (!exportOpen) return;
    const onClick = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [exportOpen]);

  // Export the currently filtered users to Excel (.xlsx) or CSV.
  async function exportUsers(format: "xlsx" | "csv") {
    setExportOpen(false);
    setExporting(true);
    try {
      const XLSX = await import("xlsx");
      const rows = filtered.map((u) => ({
        "User ID": u.userId ?? "",
        Name: u.name,
        Email: u.email,
        Phone: u.phone ?? "",
        Role: roleLabel(u.role),
        City: u.city ?? "",
        "KYC Status": u.kycStatus ?? "Not submitted",
        Status: u.active ? "Active" : "Inactive",
        "Last Activity": u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleString() : "Never",
        Joined: new Date(u.createdAt).toLocaleDateString(),
        Properties: u._count?.properties ?? 0,
        Transactions: u._count?.transactions ?? 0,
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Users");
      const date = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `plotsnhomes-users-${date}.${format}`, { bookType: format });
    } finally {
      setExporting(false);
    }
  }

  const roleCounts = useMemo(() => {
    const m = new Map<Role, number>();
    for (const u of users) m.set(u.role, (m.get(u.role) ?? 0) + 1);
    return m;
  }, [users]);

  // "All Users" + every account type / role, in hierarchy order. Each pill
  // drives the single roleFilter so clicking it filters the table below.
  const filterPills: { value: string; label: string; count: number }[] = [
    { value: "ALL", label: "All Users", count: users.length },
    ...ROLE_HIERARCHY.map((r) => ({
      value: r as string,
      label: roleLabel(r),
      count: roleCounts.get(r) ?? 0,
    })),
  ];

  const visibleColumnCount = useMemo(() => {
    return visibleColumnIds.length;
  }, [visibleColumnIds]);

  const scaleClass = useMemo(() => {
    if (visibleColumnCount >= 12) return {
      padding: "px-1.5 py-1.5",
      text: "text-[10px]",
      nameW: "max-w-[80px]",
      emailW: "max-w-[90px]",
      customMinW: "min-w-[90px]",
      btnPadding: "px-1.5 py-0.5 text-[9px]"
    };
    if (visibleColumnCount >= 8) return {
      padding: "px-2 py-2",
      text: "text-[11px]",
      nameW: "max-w-[110px]",
      emailW: "max-w-[125px]",
      customMinW: "min-w-[105px]",
      btnPadding: "px-2 py-0.5 text-[10px]"
    };
    return {
      padding: "px-3 py-2.5",
      text: "text-xs",
      nameW: "max-w-[150px]",
      emailW: "max-w-[180px]",
      customMinW: "min-w-[130px]",
      btnPadding: "px-2.5 py-1 text-xs"
    };
  }, [visibleColumnCount]);

  return (
    <div className="space-y-6">
      {/* Account type / role filter pills — the single working type filter */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          Filter by account type &amp; role
        </p>
        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-2.5">
          {filterPills.map((p) => {
            const active = roleFilter === p.value;
            const empty = p.count === 0;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setRoleFilter(p.value)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  active
                    ? "bg-brand text-white shadow-sm"
                    : empty
                      ? "bg-transparent text-slate-400 dark:text-slate-600 hover:bg-white dark:hover:bg-slate-800"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-brand/60 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {p.label}
                <span
                  className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-extrabold ${
                    active
                      ? "bg-slate-950/15 text-slate-950"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300"
                  }`}
                >
                  {p.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <TableToolbarManager
        tableTitle="Users Directory"
        addRowLabel="Add User"
        onAddRow={() => {
          const btn = document.querySelector('button:has(svg.lucide-plus)') as HTMLButtonElement;
          if (btn) btn.click();
        }}
        columns={columns}
        visibleColumnIds={visibleColumnIds}
        onToggleColumn={toggleColumn}
        onAddCustomColumn={addCustomColumn}
        onUpdateCustomColumn={updateCustomColumn}
        onRemoveCustomColumn={removeCustomColumn}
        onResetColumns={resetColumns}
        importSlot={
          <button
            type="button"
            onClick={() => setBulkOpen(true)}
            title="Bulk import users from an Excel or CSV file"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition shadow-xs"
          >
            <Upload className="h-4 w-4" />
            <span>Bulk Import</span>
          </button>
        }
      />

      <BulkImportUsersModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onImported={() => router.refresh()}
      />

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-3 space-y-3">
        {/* Row 1: search + dropdowns */}
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="search"
              placeholder="Search by User ID (e.g. USR-4TYQ…), name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-brand shadow-2xs"
            />
          </div>
          <div className="flex gap-2.5">
            <div className="w-52 sm:w-64">
              <SearchableSelect
                options={userDropdownOptions}
                value={selectedUserFilter}
                onChange={(val) => setSelectedUserFilter(val)}
                placeholder="Jump to a specific user..."
                searchPlaceholder="Search User ID, name, email..."
              />
            </div>
          </div>
        </div>

        {/* Row 2: action buttons */}
        <div className="flex items-center gap-2 flex-wrap justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Clear All Filters */}
            <button
              type="button"
              onClick={clearAllFilters}
              disabled={!hasActiveFilters}
              title={hasActiveFilters ? "Clear all filters" : "No filters applied"}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed ${
                hasActiveFilters
                  ? "bg-brand text-white hover:bg-amber-600 shadow-sm"
                  : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <X className="h-4 w-4 stroke-[2.5]" /> Clear All
            </button>
            <ViewToggle mode={viewMode} onChange={setViewMode} />
          </div>

          {/* Export dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setExportOpen((o) => !o)}
              disabled={exporting || filtered.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 dark:hover:bg-white transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export the currently filtered users"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 stroke-[2.5]" />}
              Export
              <span className="hidden sm:inline text-[10px] font-extrabold opacity-70">({filtered.length})</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${exportOpen ? "rotate-180" : ""}`} />
            </button>
            {exportOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl z-30 overflow-hidden">
                <p className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  Export {filtered.length} user{filtered.length !== 1 ? "s" : ""}
                </p>
                <button
                  type="button"
                  onClick={() => exportUsers("xlsx")}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Excel workbook (.xlsx)
                </button>
                <button
                  type="button"
                  onClick={() => exportUsers("csv")}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition border-t border-slate-100 dark:border-slate-800"
                >
                  <FileText className="h-4 w-4 text-blue-600" /> CSV file (.csv)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {viewMode !== "list" ? (
        filtered.length === 0 ? (
          <p className="text-center text-slate-500 py-16 font-medium border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">No users match your filters.</p>
        ) : (
          <div className={viewContainerClass(viewMode)}>
            {paginatedUsers.map((u) => {
              const last = u.lastActiveAt ? new Date(u.lastActiveAt) : null;
              const act = activityLabel(last);
              const online = u.active && isUserOnline(last);
              const isStaff = hasCrmAccess(u.role);
              return (
                <div
                  key={u.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md transition flex flex-col gap-3 cursor-pointer"
                  onClick={() => { setModalUser(u); setModalUserIndex(users.indexOf(u)); }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">{u.name}</h3>
                      <span className="inline-block mt-1 font-mono text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 px-1.5 py-0.5 rounded-md">{u.userId || "USR-XXXXX"}</span>
                    </div>
                    <span className={`shrink-0 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${isStaff ? "bg-violet-100 dark:bg-violet-950/60 text-violet-800 dark:text-violet-300" : "bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300"}`}>{roleLabel(u.role)}</span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 border-t border-slate-100 dark:border-slate-800 pt-2 break-all">
                    <p className="font-medium text-slate-800 dark:text-slate-200">{u.email}</p>
                    <p>{u.phone ?? "—"}</p>
                    {u.city && <p>{u.city}{u.country ? `, ${u.country}` : ""}</p>}
                  </div>
                  <div className="flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-800 pt-2">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${!u.active ? "bg-rose-400" : online ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`} />
                      <span className="font-medium text-slate-600 dark:text-slate-300">{!u.active ? "Disabled" : act.label}</span>
                      {!u.active && u.selfDeleted && (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700" title={u.deactivatedAt ? `on ${new Date(u.deactivatedAt).toLocaleString()}` : undefined}>
                          Deleted by user
                        </span>
                      )}
                      {!u.active && !u.selfDeleted && u.deactivationReason && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">{u.deactivationReason}</span>
                      )}
                    </span>
                    {u.kycStatus ? (
                      <span className={`font-bold ${u.kycStatus === "APPROVED" ? "text-emerald-600" : u.kycStatus === "REJECTED" ? "text-rose-600" : "text-amber-600"}`}>{u.kycStatus}</span>
                    ) : (
                      <span className="text-slate-400">No KYC</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 mt-auto" onClick={(e) => e.stopPropagation()}>
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 px-3 py-2 text-xs font-extrabold text-amber-950 dark:text-amber-200 hover:bg-brand hover:text-white transition"
                    >
                      <Pencil className="h-3.5 w-3.5" /> {canEdit ? "Edit" : "View"}
                    </Link>
                    {u.canManage && (
                      <button
                        type="button"
                        onClick={() => handleToggleActive(u)}
                        disabled={togglingId === u.id}
                        title={u.active ? "Deactivate account" : "Activate account"}
                        className={`p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50 ${u.active ? "text-slate-500 hover:text-rose-600" : "text-slate-500 hover:text-emerald-600"}`}
                      >
                        {togglingId === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (u.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />)}
                      </button>
                    )}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u)}
                        disabled={deletingId === u.id}
                        title="Delete user"
                        className="p-2 text-slate-500 hover:text-rose-600 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50"
                      >
                        {deletingId === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
      <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm scrollbar-thin relative">
        <table className="w-full min-w-max border-collapse text-xs text-left">
          <thead className="bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            <tr>
              {/* Permanent Base Column */}
              {isColumnVisible("userId") && <th className="px-3.5 py-3 border-r border-slate-200/80 dark:border-slate-800 whitespace-nowrap">User ID</th>}

              {/* Account & Contact Section Headers */}
              {isColumnVisible("user") && <th className="px-3.5 py-3 border-r border-slate-200/80 dark:border-slate-800 whitespace-nowrap">User Name</th>}
              {isColumnVisible("contact") && <th className="px-3.5 py-3 border-r border-slate-200/80 dark:border-slate-800 whitespace-nowrap">Contact Info</th>}
              {isColumnVisible("acc_dob") && <th className="px-3.5 py-3 border-r border-slate-200/80 dark:border-slate-800 whitespace-nowrap">Date of birth</th>}
              {isColumnVisible("type") && <th className="px-3.5 py-3 border-r border-slate-200/80 dark:border-slate-800 whitespace-nowrap">Account Role</th>}
              {isColumnVisible("acc_active") && <th className="px-3.5 py-3 border-r border-slate-200/80 dark:border-slate-800 whitespace-nowrap">Account active</th>}

              {/* Address Section Headers */}
              {isColumnVisible("addr_street") && <th className="px-3.5 py-3 border-r border-slate-200/80 dark:border-slate-800 whitespace-nowrap">Street address</th>}
              {isColumnVisible("addr_country") && <th className="px-3.5 py-3 border-r border-slate-200/80 dark:border-slate-800 whitespace-nowrap">Country</th>}
              {isColumnVisible("addr_state") && <th className="px-3.5 py-3 border-r border-slate-200/80 dark:border-slate-800 whitespace-nowrap">State / region</th>}
              {isColumnVisible("location") && <th className="px-3.5 py-3 border-r border-slate-200/80 dark:border-slate-800 whitespace-nowrap">Location</th>}
              {isColumnVisible("addr_zip") && <th className="px-3.5 py-3 border-r border-slate-200/80 dark:border-slate-800 whitespace-nowrap">ZIP / Postal Code</th>}

              {/* Verification & Activity Section Headers */}
              {isColumnVisible("kyc") && <th className="px-3.5 py-3 border-r border-slate-200/80 dark:border-slate-800 whitespace-nowrap">KYC Status</th>}
              {isColumnVisible("activity") && <th className="px-3.5 py-3 border-r border-slate-200/80 dark:border-slate-800 whitespace-nowrap">Last Activity</th>}

              {/* Custom Columns */}
              {columns.filter((c) => c.isCustom && isColumnVisible(c.id)).map((c) => (
                <th key={c.id} className="px-3.5 py-3 border-r border-slate-200/80 dark:border-slate-800 text-amber-700 dark:text-amber-400 font-mono whitespace-nowrap">{c.label}</th>
              ))}

              {/* Sticky Far Right Pinned ACTIONS Column Header with Solid Dark Left Border */}
              {isColumnVisible("actions") && (
                <th className="sticky right-0 z-30 px-4 py-3 border-l-2 border-slate-900 dark:border-slate-100 bg-slate-100 dark:bg-slate-800 text-right font-extrabold uppercase tracking-wider text-slate-900 dark:text-white shadow-[-6px_0_12px_rgba(0,0,0,0.14)] whitespace-nowrap">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {paginatedUsers.map((u) => {
              const last = u.lastActiveAt ? new Date(u.lastActiveAt) : null;
              const act = activityLabel(last);
              const online = u.active && isUserOnline(last);
              const isStaff = hasCrmAccess(u.role);
              return (
                <tr key={u.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer" onClick={() => { setModalUser(u); setModalUserIndex(users.indexOf(u)); }}>
                  {/* User ID */}
                  {isColumnVisible("userId") && (
                    <td className="px-3.5 py-2.5 border-r border-slate-100 dark:border-slate-800/60 whitespace-nowrap align-middle">
                      <span className="inline-block whitespace-nowrap font-mono font-bold text-slate-900 dark:text-slate-100 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 px-2 py-0.5 rounded-md shadow-2xs">
                        {u.userId || "USR-XXXXX"}
                      </span>
                    </td>
                  )}

                  {/* Account & Contact Category Cells */}
                  {isColumnVisible("user") && (
                    <td className="px-3.5 py-2.5 border-r border-slate-100 dark:border-slate-800/60 align-middle">
                      <div className="max-w-[170px] break-words">
                        <p className="font-bold text-slate-900 dark:text-white leading-tight">{u.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5" suppressHydrationWarning>Joined {new Date(u.createdAt).toLocaleDateString("en-IN")}</p>
                      </div>
                    </td>
                  )}
                  {isColumnVisible("contact") && (
                    <td className="px-3.5 py-2.5 border-r border-slate-100 dark:border-slate-800/60 align-middle">
                      <div className="max-w-[190px] break-all leading-tight">
                        <p className="font-medium text-slate-900 dark:text-slate-200">{u.email}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{u.phone ?? "—"}</p>
                      </div>
                    </td>
                  )}
                  {isColumnVisible("acc_dob") && (
                    <td className="px-3.5 py-2.5 border-r border-slate-100 dark:border-slate-800/60 text-slate-700 dark:text-slate-300 text-xs whitespace-nowrap align-middle">
                      {u.dob ? new Date(u.dob).toLocaleDateString("en-IN") : "—"}
                    </td>
                  )}
                  {isColumnVisible("type") && (
                    <td className="px-3.5 py-2.5 border-r border-slate-100 dark:border-slate-800/60 whitespace-nowrap align-middle">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 font-bold ${
                          isStaff ? "bg-violet-100 dark:bg-violet-950/60 text-violet-800 dark:text-violet-300" : "bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300"
                        }`}
                      >
                        {roleLabel(u.role)}
                      </span>
                    </td>
                  )}
                  {isColumnVisible("acc_active") && (
                    <td className="px-3.5 py-2.5 border-r border-slate-100 dark:border-slate-800/60 whitespace-nowrap align-middle">
                      <span className={`inline-flex items-center gap-1 font-bold text-xs ${u.active ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${u.active ? "bg-emerald-500" : "bg-rose-500"}`} />
                        {u.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  )}

                  {/* Address Category Cells */}
                  {isColumnVisible("addr_street") && (
                    <td className="px-3.5 py-2.5 border-r border-slate-100 dark:border-slate-800/60 align-middle">
                      <div className="max-w-[220px] text-xs font-medium text-slate-700 dark:text-slate-300 break-words leading-snug">
                        {u.address ?? "—"}
                      </div>
                    </td>
                  )}
                  {isColumnVisible("addr_country") && (
                    <td className="px-3.5 py-2.5 border-r border-slate-100 dark:border-slate-800/60 text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap align-middle">
                      {u.country ?? "—"}
                    </td>
                  )}
                  {isColumnVisible("addr_state") && (
                    <td className="px-3.5 py-2.5 border-r border-slate-100 dark:border-slate-800/60 align-middle">
                      <div className="max-w-[160px] text-xs font-medium text-slate-700 dark:text-slate-300 break-words leading-snug">
                        {u.state ?? "—"}
                      </div>
                    </td>
                  )}
                  {isColumnVisible("location") && (
                    <td className="px-3.5 py-2.5 border-r border-slate-100 dark:border-slate-800/60 font-medium text-slate-700 dark:text-slate-300 align-middle whitespace-nowrap">
                      {u.city ?? "—"}
                    </td>
                  )}
                  {isColumnVisible("addr_zip") && (
                    <td className="px-3.5 py-2.5 border-r border-slate-100 dark:border-slate-800/60 font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap align-middle">
                      {u.zip ?? "—"}
                    </td>
                  )}

                  {/* Verification & Activity Category Cells */}
                  {isColumnVisible("kyc") && (
                    <td className="px-3.5 py-2.5 border-r border-slate-100 dark:border-slate-800/60 whitespace-nowrap align-middle">
                      {u.kycStatus ? (
                        <span
                          className={`font-bold ${
                            u.kycStatus === "APPROVED"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : u.kycStatus === "REJECTED"
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {u.kycStatus}
                        </span>
                      ) : (
                        <span className="text-slate-400">Not submitted</span>
                      )}
                    </td>
                  )}
                  {isColumnVisible("activity") && (
                    <td className="px-3.5 py-2.5 border-r border-slate-100 dark:border-slate-800/60 whitespace-nowrap align-middle">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            !u.active ? "bg-rose-400" : online ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                          }`}
                        />
                        <span className="font-medium text-slate-700 dark:text-slate-300">{!u.active ? "Disabled" : act.label}</span>
                      </div>
                    </td>
                  )}

                  {/* Custom Added Field Columns */}
                  {columns.filter((c) => c.isCustom && isColumnVisible(c.id)).map((c) => (
                    <td key={c.id} className="px-3.5 py-2.5 border-r border-slate-100 dark:border-slate-800/60 align-middle min-w-[140px]" onClick={(e) => e.stopPropagation()}>
                      <EditableCell
                        value={getCellValue(u.id, c.id)}
                        fieldType={c.fieldType}
                        options={c.options}
                        placeholder={`+ Enter ${c.label}...`}
                        onChange={(val) => updateCell(u.id, c.id, val)}
                      />
                    </td>
                  ))}

                  {/* Sticky Far Right Pinned ACTIONS Column Cell with Solid Dark Left Border */}
                  {isColumnVisible("actions") && (
                    <td
                      className="sticky right-0 z-20 px-4 py-2.5 border-l-2 border-slate-900 dark:border-slate-100 bg-white dark:bg-slate-900 group-hover:bg-slate-100 dark:group-hover:bg-slate-800/95 text-right whitespace-nowrap align-middle shadow-[-6px_0_12px_rgba(0,0,0,0.14)] transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          href={`/admin/users/${u.id}`}
                          onClick={(e) => e.stopPropagation()}
                          title={canEdit ? "Edit profile" : "View profile"}
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 px-2.5 py-1 text-xs font-extrabold text-amber-950 dark:text-amber-200 hover:bg-brand hover:text-white shadow-2xs transition"
                        >
                          <Pencil className="h-3 w-3" />
                          {canEdit ? "Edit" : "View"}
                        </Link>
                        {u.canManage && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleToggleActive(u); }}
                            disabled={togglingId === u.id}
                            title={u.active ? "Deactivate account" : "Activate account"}
                            className={`inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 transition disabled:opacity-50 ${u.active ? "text-slate-500 hover:border-rose-400 hover:text-rose-600" : "text-slate-500 hover:border-emerald-400 hover:text-emerald-600"}`}
                          >
                            {togglingId === u.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (u.active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />)}
                          </button>
                        )}
                        {canEdit && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDeleteUser(u); }}
                            disabled={deletingId === u.id}
                            title="Delete user"
                            className="inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 text-slate-500 hover:border-rose-400 hover:text-rose-600 dark:hover:text-rose-400 transition disabled:opacity-50"
                          >
                            {deletingId === u.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}

          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-slate-500 py-16 font-medium">No users match your filters.</p>
        )}
      </div>
      )}

      {/* Pagination & Broad Table Scroll Controls Bar */}
      <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Item Counter */}
        <div className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
          Showing {filtered.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{" "}
          {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} users
        </div>

        {/* Right: Page Navigation */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
            <button
              key={pg}
              type="button"
              onClick={() => setCurrentPage(pg)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
                currentPage === pg
                  ? "bg-slate-900 text-white dark:bg-brand dark:text-white shadow-md"
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100"
              }`}
            >
              {pg}
            </button>
          ))}

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Next
          </button>
        </div>
      </div>

      {/* User Detail Modal */}
      {modalUser && (
        <UserDetailModal
          user={modalUser}
          userIndex={modalUserIndex}
          onClose={() => setModalUser(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[10000] rounded-xl px-4 py-3 text-sm font-bold shadow-xl border ${
          toast.kind === "ok"
            ? "bg-emerald-600 text-white border-emerald-700"
            : "bg-rose-600 text-white border-rose-700"
        }`}>
          {toast.text}
        </div>
      )}
    </div>
  );
}
