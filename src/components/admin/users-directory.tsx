"use client";

import { Role } from "@prisma/client";
import { Pencil, Plus, Search, SlidersHorizontal, Users, UserCheck, ShieldCheck, UserX, ChevronLeft, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useRef, useEffect } from "react";
import { hasCrmAccess, isCustomerRole, roleLabel } from "@/lib/roles";
import { activityLabel, isUserOnline } from "@/lib/user-activity";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { TableToolbarManager } from "@/components/ui/table-toolbar-manager";
import { useTableColumns, useCustomCellData } from "@/hooks/use-table-columns";
import { EditableCell } from "@/components/ui/editable-cell";
import { UserDetailModal } from "@/components/admin/user-detail-modal";

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
  active: boolean;
  lastActiveAt: string | null;
  createdAt: string;
  kycStatus: string | null;
  _count: { properties: number; transactions: number };
};

type Tab = "all" | "customers" | "staff" | "agents";

export function UsersDirectory({
  users,
  initialSearch = "",
  initialTab = "all",
}: {
  users: UserRow[];
  initialSearch?: string;
  initialTab?: Tab;
}) {
  const { hasEditPermission } = useAdminPermissions();
  const canEdit = hasEditPermission("/admin/users");
  const [tab, setTab] = useState<Tab>(initialTab);
  const [search, setSearch] = useState(initialSearch);
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>("ALL");
  const [modalUser, setModalUser] = useState<UserRow | null>(null);
  const [modalUserIndex, setModalUserIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const itemsPerPage = 5;

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
  }, [tab, search, roleFilter, selectedUserFilter]);

  const filtered = useMemo(() => {
    let list = users;
    if (tab === "customers") list = list.filter((u) => isCustomerRole(u.role));
    if (tab === "staff") list = list.filter((u) => u.role === "EMPLOYEE" || u.role === "SUPERADMIN");
    if (tab === "agents") list = list.filter((u) => u.role === "AGENT");
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
  }, [users, tab, search, roleFilter, selectedUserFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const scrollTable = (direction: "left" | "right") => {
    if (tableContainerRef.current) {
      const scrollAmount = direction === "left" ? -350 : 350;
      tableContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Keep the scroll buttons in sync with whether the table can actually scroll.
  // On wide screens with few columns the table fits, so there is nothing to
  // scroll — in that case the buttons are disabled instead of appearing broken.
  useEffect(() => {
    const el = tableContainerRef.current;
    if (!el) return;
    const update = () => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      setCanScrollLeft(el.scrollLeft > 1);
      setCanScrollRight(el.scrollLeft < maxScroll - 1);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [paginatedUsers, visibleColumnIds]);

  const hasActiveFilters =
    search.trim() !== "" ||
    roleFilter !== "ALL" ||
    selectedUserFilter !== "ALL" ||
    tab !== "all";

  const clearAllFilters = () => {
    setSearch("");
    setRoleFilter("ALL");
    setSelectedUserFilter("ALL");
    setTab("all");
    setCurrentPage(1);
  };

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "all", label: "All users", count: users.length },
    {
      id: "customers",
      label: "Customers",
      count: users.filter((u) => isCustomerRole(u.role)).length,
    },
    {
      id: "staff",
      label: "Staff",
      count: users.filter((u) => u.role === "EMPLOYEE" || u.role === "SUPERADMIN").length,
    },
    {
      id: "agents",
      label: "Agents",
      count: users.filter((u) => u.role === "AGENT").length,
    },
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
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-bold rounded-t-lg border-b-2 -mb-px transition ${
              tab === t.id
                ? "border-gold text-gold-dark dark:text-gold font-bold"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
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
      />

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search by User ID (e.g. USR-10001), name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-gold"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Clear All Filters */}
          <button
            type="button"
            onClick={clearAllFilters}
            disabled={!hasActiveFilters}
            title={hasActiveFilters ? "Clear all filters" : "No filters applied"}
            className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl border text-xs font-bold transition shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed ${
              hasActiveFilters
                ? "border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
                : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
            }`}
          >
            <X className="h-4 w-4 stroke-[2.5]" /> Clear All
          </button>

          {/* Quick Table Scroll Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scrollTable("left")}
              disabled={!canScrollLeft}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-900"
              title={canScrollLeft ? "Scroll Table Left" : "No more columns to the left"}
            >
              <ChevronLeft className="h-4 w-4 stroke-[2.5]" /> Left
            </button>
            <button
              type="button"
              onClick={() => scrollTable("right")}
              disabled={!canScrollRight}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-900"
              title={canScrollRight ? "Scroll Table Right" : "No more columns to the right"}
            >
              Right <ChevronRight className="h-4 w-4 stroke-[2.5]" />
            </button>
          </div>

          <div className="w-48">
            <SearchableSelect
              options={userDropdownOptions}
              value={selectedUserFilter}
              onChange={(val) => setSelectedUserFilter(val)}
              placeholder="Select User..."
              searchPlaceholder="Search User ID, name, email..."
            />
          </div>
          <div className="w-48">
            <SearchableSelect
              options={[
                { value: "ALL", label: "All Roles" },
                { value: "SUPERADMIN", label: "Super Admin" },
                { value: "PLATFORM_ADMIN", label: "Platform Admin" },
                { value: "WHITE_LABEL_ADMIN", label: "White Label Admin" },
                { value: "FRANCHISE_ADMIN", label: "Franchise Admin" },
                { value: "BRANCH_MANAGER", label: "Branch Manager" },
                { value: "DEPARTMENT_HEAD", label: "Department Head" },
                { value: "TEAM_LEADER", label: "Team Leader" },
                { value: "EXECUTIVE", label: "Executive" },
                { value: "EMPLOYEE", label: "Employee" },
                { value: "AGENT", label: "Agent" },
                { value: "SELLER", label: "Seller" },
                { value: "BUYER", label: "Buyer (Customer)" },
                { value: "DEMO", label: "Demo User" },
              ]}
              value={roleFilter}
              onChange={(val) => setRoleFilter(val)}
            />
          </div>
        </div>
      </div>

      <div ref={tableContainerRef} className="w-full overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm scrollbar-thin relative">
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
                      <Link
                        href={`/admin/users/${u.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 px-2.5 py-1 text-xs font-extrabold text-amber-950 dark:text-amber-200 hover:bg-gold hover:text-slate-900 shadow-2xs transition"
                      >
                        {canEdit ? <Pencil className="h-3 w-3" /> : null}
                        {canEdit ? "Edit profile" : "View profile"}
                      </Link>
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

      {/* Pagination & Broad Table Scroll Controls Bar */}
      <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Item Counter */}
        <div className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
          Showing {filtered.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{" "}
          {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} users
        </div>

        {/* Center: Broadened Table Scroll Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => scrollTable("left")}
            disabled={!canScrollLeft}
            title={canScrollLeft ? "Scroll Table Left" : "No more columns to the left"}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-slate-900 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:border-slate-700 text-xs font-extrabold uppercase tracking-wider transition shadow-md hover:shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 disabled:hover:bg-slate-900 dark:disabled:hover:bg-slate-800"
          >
            <ChevronLeft className="h-4 w-4 stroke-[3]" /> Scroll Left
          </button>
          <button
            type="button"
            onClick={() => scrollTable("right")}
            disabled={!canScrollRight}
            title={canScrollRight ? "Scroll Table Right" : "No more columns to the right"}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-slate-900 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:border-slate-700 text-xs font-extrabold uppercase tracking-wider transition shadow-md hover:shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 disabled:hover:bg-slate-900 dark:disabled:hover:bg-slate-800"
          >
            Scroll Right <ChevronRight className="h-4 w-4 stroke-[3]" />
          </button>
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
                  ? "bg-slate-900 text-white dark:bg-gold dark:text-slate-950 shadow-md"
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
    </div>
  );
}
