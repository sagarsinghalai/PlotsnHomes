"use client";

import { useState, useEffect, useMemo } from "react";
import {
  PERMISSIONS_SCHEMA,
  PermissionGroup,
  RolePermissionsConfig,
} from "@/lib/permissions";
import { saveRolePermissionsAction } from "./actions";
import {
  ShieldCheck,
  Search,
  Save,
  CheckCircle2,
  AlertCircle,
  Users,
  Bot,
  FileText,
  Settings,
  Sparkles,
  Zap,
  BookOpen,
  Calendar,
  Award,
  MessageSquare,
  Building2,
  FolderTree,
  FolderKanban,
  List,
  CreditCard,
  PhoneCall,
  Palette,
  ListFilter,
  Info,
  ChevronDown,
  LayoutDashboard,
  GitFork,
  Package,
  FileCheck,
  TrendingUp,
  KanbanSquare,
  CalendarCheck,
  BarChart3,
  CircleDollarSign,
  Landmark,
  LineChart,
  Workflow,
  Percent,
  MessageCircle,
  Send,
  Mail,
  Plug,
} from "lucide-react";
import Link from "next/link";

type WebUser = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
};

// Simplified 5 User Roles requested: Admin, Employee, Agent, Seller, Buyer
const SIMPLE_USER_ROLES = [
  { value: "ADMIN", label: "Admin" },
  { value: "EMPLOYEE", label: "Employee" },
  { value: "AGENT", label: "Agent" },
  { value: "SELLER", label: "Seller" },
  { value: "BUYER", label: "Buyer" },
];

function WrenchIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

// Complete sidebar menu heads tree on the left (User Info removed, Roles & Permissions at top)
const LEFT_SIDEBAR_ITEMS = [
  { id: "roles_permissions", label: "Roles & Permissions", icon: ShieldCheck, isHeader: true },
  { id: "overview_dashboard", label: "Overview", icon: LayoutDashboard },
  { id: "users_accounts", label: "Users & Accounts", icon: Users },
  { id: "team_hierarchy", label: "Team Hierarchy", icon: GitFork },
  { id: "organization_units", label: "Organizations & Franchises", icon: Building2 },
  { id: "developers", label: "Developers", icon: Package },
  { id: "kyc_verification", label: "KYC Verification", icon: FileCheck },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "properties", label: "Properties", icon: Building2 },
  { id: "price_history", label: "Price History", icon: TrendingUp },
  { id: "categories", label: "Categories", icon: FolderTree },
  { id: "all_leads", label: "All Leads", icon: List },
  { id: "pipeline", label: "Pipeline", icon: KanbanSquare },
  { id: "inquiries", label: "Inquiries", icon: MessageSquare },
  { id: "site_visits", label: "Site Visits", icon: CalendarCheck },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "pricing_shares", label: "Pricing & Shares", icon: CircleDollarSign },
  { id: "billing", label: "Billing & Subscriptions", icon: CircleDollarSign },
  { id: "transactions", label: "Transactions", icon: CreditCard },
  { id: "wallets", label: "Wallets", icon: Landmark },
  { id: "trade_history", label: "Trade History", icon: LineChart },
  { id: "payouts", label: "Payouts", icon: CircleDollarSign },
  { id: "payment_methods", label: "Payment Methods", icon: CreditCard },
  { id: "loans", label: "Loans", icon: Landmark },
  { id: "invoices", label: "Invoices", icon: Workflow },
  { id: "rates", label: "Rates", icon: Percent },
  { id: "comms_hub", label: "Communications Hub", icon: PhoneCall },
  { id: "whatsapp_hub", label: "WhatsApp Hub", icon: MessageCircle },
  { id: "send_message", label: "Send Message", icon: Send },
  { id: "meetings", label: "Meetings", icon: Calendar },
  { id: "email_log", label: "Email Log", icon: Mail },
  { id: "email_hub", label: "Email Hub", icon: Mail },
  { id: "frontend_settings", label: "Frontend Settings", icon: Palette },
  { id: "platform", label: "Platform", icon: Settings },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "dropdown_options", label: "Dropdown Options", icon: ListFilter },
  { id: "system_status", label: "System Status", icon: Settings },
  { id: "live_markets", label: "Live Markets", icon: LineChart },
];

const MODULES_WITH_ADD = new Set([
  "users_accounts",
  "organization_units",
  "developers",
  "projects",
  "properties",
  "categories",
  "all_leads",
  "pipeline",
  "send_message",
  "dropdown_options",
]);

export function RolesSettingsClient({
  initialPermissions,
}: {
  initialPermissions: RolePermissionsConfig;
}) {
  const [permissions, setPermissions] = useState<RolePermissionsConfig>(initialPermissions);
  const [selectedGroup, setSelectedGroup] = useState<PermissionGroup>("ADMIN");

  // Web users list fetched live from /api/admin/users
  const [webUsers, setWebUsers] = useState<WebUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("ALL");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("ALL");

  // Search filter
  const [topSearch, setTopSearch] = useState("");
  const [settingSearch, setSettingSearch] = useState("");
  const [activeLeftTab, setActiveLeftTab] = useState("roles_permissions");
  const [restrictDataVisibility, setRestrictDataVisibility] = useState(false);

  // Status feedback
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.users)) {
          setWebUsers(data.users);
        }
      }
    } catch (e) {
      console.error("Failed to load web users:", e);
    }
  }

  const filteredUsers = useMemo(() => {
    return webUsers.filter((u) => {
      const matchesRole = userRoleFilter === "ALL" || u.role === userRoleFilter;
      const q = topSearch.toLowerCase().trim();
      const matchesQuery =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone ?? "").includes(q) ||
        u.userId.toLowerCase().includes(q);
      return matchesRole && matchesQuery;
    });
  }, [webUsers, userRoleFilter, topSearch]);

  // Master module toggle switch state
  function isModuleEnabled(permissionKey: string): boolean {
    return permissions[selectedGroup]?.[permissionKey]?.view ?? false;
  }

  function handleToggleModule(permissionKey: string) {
    const currentlyOn = permissions[selectedGroup]?.[permissionKey]?.view ?? false;
    const nextVal = !currentlyOn;

    const moduleDef = allModules.find((m) => m.key === permissionKey);
    const subKeys = moduleDef ? moduleDef.subPermissions.map((s) => s.key) : ["view", "add", "edit", "delete"];

    const targets: PermissionGroup[] =
      selectedGroup === "ADMIN" || selectedGroup === "EMPLOYEE"
        ? ["ADMIN", "EMPLOYEE"]
        : [selectedGroup];

    setPermissions((prev) => {
      const next = { ...prev };
      targets.forEach((grp) => {
        const updatedObj: Record<string, boolean> = {};
        subKeys.forEach((k) => {
          updatedObj[k] = nextVal;
        });
        next[grp] = {
          ...next[grp],
          [permissionKey]: updatedObj as any,
        };
      });
      return next;
    });
  }

  function handleSubPermissionChange(
    permissionKey: string,
    field: string,
    value: boolean
  ) {
    const targets: PermissionGroup[] =
      selectedGroup === "ADMIN" || selectedGroup === "EMPLOYEE"
        ? ["ADMIN", "EMPLOYEE"]
        : [selectedGroup];

    setPermissions((prev) => {
      const next = { ...prev };
      targets.forEach((grp) => {
        const current = (next[grp]?.[permissionKey] as Record<string, boolean>) || {};
        const updated = { ...current, [field]: value };

        // Dependency rules:
        // 1. If checking any action -> view MUST automatically be true
        if (field !== "view" && value === true) {
          updated.view = true;
        }
        // 2. If unchecking view -> all action keys MUST automatically be false
        if (field === "view" && value === false) {
          Object.keys(updated).forEach((k) => {
            updated[k] = false;
          });
        }

        next[grp] = {
          ...next[grp],
          [permissionKey]: updated as any,
        };
      });
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setSaveSuccess(false);
    setErrorMessage("");

    const res = await saveRolePermissionsAction(permissions);
    setSaving(false);

    if (res.ok) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } else {
      setErrorMessage(res.error || "Failed to save permissions configuration.");
    }
  }

  // Modules list based on PERMISSIONS_SCHEMA
  const allModules = useMemo(() => {
    const list: Array<{
      key: string;
      label: string;
      groupLabel: string;
      subPermissions: Array<{ key: string; label: string }>;
    }> = [];

    PERMISSIONS_SCHEMA.forEach((head) => {
      head.subheads.forEach((subhead) => {
        const subPerms: Array<{ key: string; label: string }> = [
          { key: "view", label: `View ${subhead.label}` },
        ];

        if (subhead.key === "overview_dashboard") {
          // Requirement 1: Overview Dashboard ONLY has View
        } else if (subhead.key === "email_log") {
          // Requirement 2: Email log has View and "Log custom Activity"
          subPerms.push({ key: "add", label: "Log custom Activity" });
        } else if (subhead.key === "price_history") {
          // Requirement 5: Price History has View and "Log price change"
          subPerms.push({ key: "add", label: "Log price change" });
        } else if (subhead.key === "developers") {
          // Requirement 3: Developers has View, Add, Edit, Delete, Send Message, Manage Projects, Manage Tasks
          subPerms.push({ key: "add", label: `Add ${subhead.label}` });
          subPerms.push({ key: "edit", label: `Edit ${subhead.label}` });
          subPerms.push({ key: "delete", label: `Delete ${subhead.label} records` });
          subPerms.push({ key: "sendMessage", label: "Send Message" });
          subPerms.push({ key: "manageProjects", label: "Manage Projects" });
          subPerms.push({ key: "manageTasks", label: "Manage Tasks" });
        } else if (subhead.key === "pipeline") {
          // Requirement: Pipeline subheads & sub-sub toggles
          subPerms.push({ key: "edit", label: "Edit Pipeline" });
          subPerms.push({ key: "delete", label: "Delete Pipeline records" });
          subPerms.push({ key: "opportunities_tab", label: "Opportunities (Navbar Tab)" });
          subPerms.push({ key: "create_opportunities", label: "Create Opportunities (+ Opportunity button)" });
          subPerms.push({ key: "add_status", label: "Add Status (+ Add status button)" });
          subPerms.push({ key: "forecast_tab", label: "Forecast (Navbar Tab)" });
          subPerms.push({ key: "forecast_summary", label: "Summary (Forecast view toggle)" });
          subPerms.push({ key: "forecast_timeline", label: "Forecast Timeline (Forecast view toggle)" });
          subPerms.push({ key: "pipelines_tab", label: "Pipelines (Navbar Tab)" });
          subPerms.push({ key: "create_pipeline", label: "Create Pipeline (+ Create pipeline button)" });
          subPerms.push({ key: "edit_pipelines", label: "Edit Pipelines (Edit action in 3-dots)" });
          subPerms.push({ key: "delete_pipelines", label: "Delete Pipelines (Delete action in 3-dots)" });
          subPerms.push({ key: "bulk_actions_tab", label: "Bulk Actions (Navbar Tab)" });
        } else if (subhead.key === "inquiries") {
          // Requirement: Inquiries view, edit, delete, and Add to CRM
          subPerms.push({ key: "edit", label: "Edit Inquiries" });
          subPerms.push({ key: "delete", label: "Delete Inquiries records" });
          subPerms.push({ key: "add_to_crm", label: "Add to CRM (+ Add to CRM button)" });
        } else {
          if (MODULES_WITH_ADD.has(subhead.key)) {
            const addLabel = subhead.key === "all_leads" ? "Add New Lead" : `Add ${subhead.label}`;
            subPerms.push({ key: "add", label: addLabel });
          }
          subPerms.push({ key: "edit", label: `Edit ${subhead.label}` });
          subPerms.push({ key: "delete", label: `Delete ${subhead.label} records` });
        }

        list.push({
          key: subhead.key,
          label: subhead.label,
          groupLabel: head.label,
          subPermissions: subPerms,
        });
      });
    });

    return list;
  }, []);

  const filteredModules = useMemo(() => {
    const q = settingSearch.toLowerCase().trim();
    if (!q) return allModules;
    return allModules.filter(
      (m) =>
        m.label.toLowerCase().includes(q) ||
        m.groupLabel.toLowerCase().includes(q) ||
        m.key.toLowerCase().includes(q)
    );
  }, [allModules, settingSearch]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6 bg-slate-50 min-h-screen">
      {/* Top Header Bar & User Selector Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4" />
              <span>Security & Governance</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Roles & Permissions Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Control granular sidebar menu access, data visibility, and module permissions for Admin, Employee, Agent, Seller, and Buyer.
            </p>
          </div>
        </div>

        {/* Top Control Bar: Simplified User Role Selector, Select User Dropdown, Search Input */}
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4 items-center pt-1">
          {/* Filter by Role: Admin, Employee, Agent, Seller, Buyer */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase text-slate-500">User Role Filter</label>
            <select
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="ALL">All Roles (Admin, Employee, Agent, Seller, Buyer)</option>
              {SIMPLE_USER_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Select User Dropdown with website users */}
          <div className="space-y-1 sm:col-span-2">
            <label className="text-[11px] font-bold uppercase text-slate-500">Select Website User</label>
            <select
              value={selectedUser}
              onChange={(e) => {
                const uid = e.target.value;
                setSelectedUser(uid);
                if (uid !== "ALL") {
                  const found = webUsers.find((u) => u.id === uid);
                  if (found) {
                    const matchedRole = SIMPLE_USER_ROLES.find((r) => r.value === found.role);
                    if (matchedRole) setSelectedGroup(matchedRole.value as PermissionGroup);
                  }
                }
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white truncate"
            >
              <option value="ALL">All Users (Default Role Template Scope)</option>
              {filteredUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email}) — [{u.role}] (ID: {u.userId})
                </option>
              ))}
            </select>
          </div>

          {/* Search Input Box */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase text-slate-500">Search User</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="name, email, phone, ids..."
                value={topSearch}
                onChange={(e) => setTopSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-700 text-xs font-bold shadow-xs">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>Role & permission settings saved successfully! Navigation access updated live.</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-700 text-xs font-bold shadow-xs">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Complete Sidebar Menu Heads Tree (User Info Removed) */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2 sticky top-4 max-h-[calc(100vh-140px)] overflow-y-auto">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-2 border-b border-slate-100">
            Sidebar Menu Modules
          </p>

          <div className="space-y-1 pt-1">
            {LEFT_SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeLeftTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveLeftTab(item.id);
                    if (item.id !== "roles_permissions") {
                      setSettingSearch(item.label);
                    } else {
                      setSettingSearch("");
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    isActive
                      ? "bg-blue-50 text-blue-700 font-bold border border-blue-200"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.isHeader && (
                    <ChevronDown className="h-3.5 w-3.5 text-blue-600 stroke-[3]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Roles & Permissions Control Panel */}
        <div className="lg:col-span-9 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          {/* Card Header */}
          <div className="border-b border-slate-100 pb-5 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Roles and Permissions</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* User Role select dropdown: Admin, Employee, Agent, Seller, Buyer */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">User Role</label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value as PermissionGroup)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:border-blue-500 outline-none shadow-xs"
                >
                  {SIMPLE_USER_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label} ({r.value})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Checkbox: Restrict data visibility */}
            <div className="flex items-center gap-2.5 pt-2">
              <input
                type="checkbox"
                id="restrict-data"
                checked={restrictDataVisibility}
                onChange={(e) => setRestrictDataVisibility(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="restrict-data" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer">
                <span>Restrict data visibility to only assigned data</span>
                <Info className="h-3.5 w-3.5 text-slate-400" />
              </label>
            </div>

            {/* Setting Search Input */}
            <div className="relative max-w-sm pt-2">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search settings..."
                value={settingSearch}
                onChange={(e) => setSettingSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 outline-none shadow-xs"
              />
            </div>
          </div>

          {/* Module Settings Grid with Toggle Switches */}
          <div className="space-y-6">
            {filteredModules.map((module) => {
              const enabled = isModuleEnabled(module.key);
              const subPerms = (permissions[selectedGroup]?.[module.key] as Record<string, boolean>) || {};

              return (
                <div
                  key={module.key}
                  className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-2xs hover:border-slate-300 transition"
                >
                  {/* Module Header with Toggle Switch */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      {/* Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => handleToggleModule(module.key)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          enabled ? "bg-blue-600" : "bg-slate-200"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            enabled ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>

                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-bold text-slate-900">{module.label}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 border border-slate-200">
                          {module.groupLabel}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[11px] font-bold ${enabled ? "text-blue-600" : "text-slate-400"}`}>
                      {enabled ? "ENABLED" : "DISABLED"}
                    </span>
                  </div>

                  {/* Sub-permission Checkboxes */}
                  {enabled && (
                    <div className="pl-14 space-y-2 pt-1 animate-in fade-in-50 duration-150">
                      {module.subPermissions.map((sub, i) => {
                        const checked = subPerms[sub.key] ?? false;
                        return (
                          <label key={i} className="flex items-center gap-2.5 text-xs text-slate-700 font-medium cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => handleSubPermissionChange(module.key, sub.key, e.target.checked)}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>{sub.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setPermissions(initialPermissions);
                setSettingSearch("");
              }}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gold hover:bg-gold-dark text-slate-950 px-6 py-2.5 text-xs font-bold shadow-md shadow-gold/20 transition cursor-pointer"
            >
              {saving ? (
                <div className="h-4 w-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{saving ? "Saving..." : "Save"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
