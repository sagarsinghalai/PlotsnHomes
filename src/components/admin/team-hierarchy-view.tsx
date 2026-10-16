"use client";

import { Role } from "@prisma/client";
import {
  ChevronDown,
  ChevronRight,
  GitFork,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  X,
  Eye,
  EyeOff,
  Building2,
  Building,
  MapPin,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminPermissions } from "@/components/admin/admin-permissions-context";
import { useMemo, useState, useEffect } from "react";
import { roleLabel, roleHierarchyLevel, roleDataScope } from "@/lib/roles";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  DEFAULT_FIELD_PRIVACY_MATRIX,
  FieldPrivacyMatrix,
  HIERARCHY_LEVEL_LIST,
  HierarchyLevelKey,
  SENSITIVE_FIELDS,
  FieldKey,
} from "@/lib/field-privacy";

export type HierarchyUser = {
  id: string;
  userId?: string | null;
  name: string;
  email: string;
  phone: string | null;
  dob?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  role: Role;
  hierarchyLevel?: string | null;
  dataScope?: string | null;
  active: boolean;
  managerId: string | null;
  createdAt: string;
};

export type TreeNode = HierarchyUser & {
  children: TreeNode[];
  directSubordinatesCount: number;
  totalSubordinatesCount: number;
};

export function TeamHierarchyView({
  currentUser,
  users,
  initialPrivacyConfig,
}: {
  currentUser: { id: string; email: string; role: Role; name: string };
  users: HierarchyUser[];
  initialPrivacyConfig?: FieldPrivacyMatrix;
}) {
  const router = useRouter();
  const { hasEditPermission } = useAdminPermissions();
  const canEdit = hasEditPermission("/admin/hierarchy");
  const [search, setSearch] = useState("");
  const [selectedUserIdFilter, setSelectedUserIdFilter] = useState("");
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  // Inspector Drawer State
  const [inspectUser, setInspectUser] = useState<HierarchyUser | null>(null);

  // Privacy Control Matrix Modal State
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [privacyConfig, setPrivacyConfig] = useState<FieldPrivacyMatrix>(
    initialPrivacyConfig || DEFAULT_FIELD_PRIVACY_MATRIX
  );
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [privacyMsg, setPrivacyMsg] = useState("");

  // Manager Assignment Modal state
  const [targetUser, setTargetUser] = useState<HierarchyUser | null>(null);
  const [selectedManagerId, setSelectedManagerId] = useState<string>("");
  const [savingManager, setSavingManager] = useState(false);
  const [managerError, setManagerError] = useState("");

  const toggleCollapse = (id: string) => {
    setCollapsedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenAssignModal = (u: HierarchyUser, e: React.MouseEvent) => {
    e.stopPropagation();
    setTargetUser(u);
    setSelectedManagerId(u.managerId ?? "");
    setManagerError("");
  };

  const handleSaveManager = async () => {
    if (!targetUser) return;
    setSavingManager(true);
    setManagerError("");

    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          managerId: selectedManagerId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setManagerError(data.error ?? "Failed to update hierarchy");
        return;
      }

      setTargetUser(null);
      router.refresh();
    } catch {
      setManagerError("An error occurred while updating hierarchy.");
    } finally {
      setSavingManager(false);
    }
  };

  const handleSavePrivacyMatrix = async () => {
    setSavingPrivacy(true);
    setPrivacyMsg("");
    try {
      const res = await fetch("/api/admin/organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType: "PRIVACY_MATRIX",
          data: privacyConfig,
        }),
      });
      if (res.ok) {
        setPrivacyMsg("✓ Privacy visibility matrix successfully updated.");
        setTimeout(() => setIsPrivacyModalOpen(false), 1200);
      } else {
        setPrivacyMsg("Failed to save privacy matrix.");
      }
    } catch {
      setPrivacyMsg("An error occurred while saving privacy matrix.");
    } finally {
      setSavingPrivacy(false);
    }
  };

  const togglePrivacyField = (levelKey: HierarchyLevelKey, fieldKey: FieldKey) => {
    setPrivacyConfig((prev) => ({
      ...prev,
      [levelKey]: {
        ...prev[levelKey],
        [fieldKey]: !prev[levelKey]?.[fieldKey],
      },
    }));
  };

  // Build tree hierarchy
  const { rootNodes, totalMembersCount } = useMemo(() => {
    const map = new Map<string, TreeNode>();

    users.forEach((u) => {
      map.set(u.id, {
        ...u,
        children: [],
        directSubordinatesCount: 0,
        totalSubordinatesCount: 0,
      });
    });

    const roots: TreeNode[] = [];
    users.forEach((u) => {
      const node = map.get(u.id)!;
      if (u.managerId && map.has(u.managerId)) {
        const parent = map.get(u.managerId)!;
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    function computeSubordinatesCount(node: TreeNode): number {
      node.directSubordinatesCount = node.children.length;
      let total = node.children.length;
      for (const child of node.children) {
        total += computeSubordinatesCount(child);
      }
      node.totalSubordinatesCount = total;
      return total;
    }

    roots.forEach(computeSubordinatesCount);

    const isFullAccess =
      (currentUser.role as string) === "SUPERADMIN" ||
      (currentUser.role as string) === "PLATFORM_ADMIN" ||
      (currentUser.role as string) === "WHITE_LABEL_ADMIN";
    let scopedRoots: TreeNode[] = roots;

    if (!isFullAccess) {
      const userNode = map.get(currentUser.id);
      scopedRoots = userNode ? [userNode] : [];
    }

    return {
      rootNodes: scopedRoots,
      totalMembersCount: users.length,
    };
  }, [users, currentUser]);

  const searchOptions = useMemo(() => {
    return [
      { value: "", label: "All Users in Hierarchy Tree" },
      ...users.map((u) => ({
        value: u.id,
        label: `${u.name} (${roleLabel(u.role)})`,
        sublabel: `${u.userId || "USR-XXXXX"} · ${u.email}`,
      })),
    ];
  }, [users]);

  // Search filter matching
  const matchesSearch = (node: TreeNode): boolean => {
    if (selectedUserIdFilter) {
      return node.id === selectedUserIdFilter || node.children.some(matchesSearch);
    }
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const selfMatch =
      (node.userId ?? "").toLowerCase().includes(q) ||
      node.name.toLowerCase().includes(q) ||
      node.email.toLowerCase().includes(q) ||
      node.role.toLowerCase().includes(q);
    if (selfMatch) return true;
    return node.children.some(matchesSearch);
  };

  const getAvatarGradient = (role: Role) => {
    switch (role as string) {
      case "SUPERADMIN":
        return "bg-amber-500 text-slate-950 font-black";
      case "PLATFORM_ADMIN":
        return "bg-sky-600 text-white font-bold";
      case "WHITE_LABEL_ADMIN":
        return "bg-purple-600 text-white font-bold";
      case "FRANCHISE_ADMIN":
        return "bg-emerald-600 text-white font-bold";
      case "BRANCH_MANAGER":
        return "bg-teal-600 text-white font-bold";
      case "DEPARTMENT_HEAD":
        return "bg-blue-600 text-white font-bold";
      case "TEAM_LEADER":
        return "bg-indigo-600 text-white font-bold";
      case "EXECUTIVE":
      case "EMPLOYEE":
      case "AGENT":
        return "bg-violet-600 text-white font-bold";
      case "SELLER":
        return "bg-orange-600 text-white font-bold";
      case "BUYER":
        return "bg-emerald-700 text-white font-bold";
      case "DEMO":
        return "bg-rose-600 text-white font-bold";
      default:
        return "bg-slate-700 text-white font-bold";
    }
  };

  function renderTreeNode(node: TreeNode, depth: number = 0) {
    if (!matchesSearch(node)) return null;

    const isCollapsed = !!collapsedNodes[node.id];
    const hasChildren = node.children.length > 0;
    const isRoot = depth === 0;
    const levelName = roleHierarchyLevel(node.role);

    return (
      <div key={node.id} className={`relative ${!isRoot ? "pl-5 sm:pl-8 my-3" : "my-4"}`}>
        {!isRoot && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-slate-300" />
            <div className="absolute left-0 top-7 w-4 sm:w-7 h-0.5 bg-slate-300 rounded-r" />
          </>
        )}

        <div
          onClick={() => setInspectUser(node)}
          className={`group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-xs transition hover:border-slate-300 hover:shadow-md cursor-pointer`}
        >
          <div className="flex items-center gap-3.5">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCollapse(node.id);
                }}
                className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-900 transition shrink-0 shadow-xs"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-slate-900" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-900" />
                )}
              </button>
            ) : (
              <div className="w-[32px] h-[32px] shrink-0" />
            )}

            <div
              className={`h-11 w-11 rounded-2xl flex items-center justify-center text-sm shadow-xs shrink-0 ${getAvatarGradient(
                node.role
              )}`}
            >
              {node.name.slice(0, 2).toUpperCase()}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 px-2.5 py-0.5 rounded shadow-2xs whitespace-nowrap">
                  {node.userId || "USR-XXXXX"}
                </span>
                <p className="font-bold text-slate-900 text-base leading-snug">
                  {node.name}
                </p>

                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-slate-900 shadow-2xs">
                  {roleLabel(node.role)}
                </span>

                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300 uppercase tracking-wider">
                  Level: {levelName}
                </span>

                {!node.active && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">
                    Disabled
                  </span>
                )}
              </div>

              <p className="text-xs font-medium text-slate-500 mt-1">
                {node.email} {node.phone ? `· ${node.phone}` : ""}
              </p>
            </div>
          </div>

          {canEdit && (
            <div className="flex items-center gap-2.5 flex-wrap self-end sm:self-auto">
              {node.totalSubordinatesCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-900 text-xs font-bold border border-slate-300 shadow-2xs">
                  <Users className="h-3.5 w-3.5 text-amber-600" />
                  {node.directSubordinatesCount} Direct ({node.totalSubordinatesCount} Total)
                </span>
              )}

              <button
                type="button"
                onClick={(e) => handleOpenAssignModal(node, e)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold px-3.5 py-2 text-xs border border-slate-300 transition shadow-2xs"
              >
                <UserPlus className="h-3.5 w-3.5 text-slate-900" />
                <span>Assign Manager</span>
              </button>

              <Link
                href={`/admin/users/${node.id}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold px-4 py-2 text-xs transition border border-slate-300 shadow-2xs"
              >
                <Pencil className="h-3.5 w-3.5 text-slate-900" />
                <span>Edit</span>
              </Link>
            </div>
          )}
        </div>

        {hasChildren && !isCollapsed && (
          <div className="mt-1 space-y-1">
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats & Privacy Button */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3 text-amber-600">
            <GitFork className="h-5 w-5" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Hierarchy Scope
            </p>
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {(currentUser.role as string) === "SUPERADMIN" ||
            (currentUser.role as string) === "PLATFORM_ADMIN"
              ? "Organization-Wide"
              : `${currentUser.name}'s Hierarchy`}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3 text-blue-600">
            <UserCheck className="h-5 w-5" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Top Level Leaders
            </p>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {rootNodes.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3 text-purple-600">
            <Users className="h-5 w-5" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Managed Users
            </p>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {rootNodes.reduce((acc, r) => acc + 1 + r.totalSubordinatesCount, 0)}
          </p>
        </div>

        {/* Super Admin Field Privacy Control Button */}
        {(currentUser.role as string) === "SUPERADMIN" && (
          <button
            type="button"
            onClick={() => setIsPrivacyModalOpen(true)}
            className="rounded-2xl border border-purple-300 bg-purple-50 p-5 shadow-xs text-left hover:bg-purple-100 transition group"
          >
            <div className="flex items-center gap-3 text-purple-700">
              <ShieldCheck className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-bold uppercase tracking-wider text-purple-900">
                Privacy Matrix
              </p>
            </div>
            <p className="text-sm font-extrabold text-purple-950 mt-1">
              Field Show/Hide Controls →
            </p>
          </button>
        )}
      </div>

      {/* Search Bar & Autocomplete */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search member name, ID, email or role..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedUserIdFilter("");
            }}
            className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400 shadow-2xs"
          />
        </div>

        <div className="w-full sm:w-72">
          <SearchableSelect
            options={searchOptions}
            value={selectedUserIdFilter}
            onChange={(val) => {
              setSelectedUserIdFilter(val);
              if (val) setSearch("");
            }}
            placeholder="Select user to focus in tree..."
            searchPlaceholder="Search user..."
          />
        </div>
      </div>

      {/* Tree Diagram Container */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm min-h-[400px]">
        {rootNodes.length > 0 ? (
          <div className="space-y-3">
            {rootNodes.map((root) => renderTreeNode(root))}
          </div>
        ) : (
          <div className="text-center py-20">
            <ShieldAlert className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-3 text-base font-bold text-slate-900">
              No Hierarchy Tree Available
            </h3>
            <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto font-medium">
              {search || selectedUserIdFilter
                ? "No team member matches your search filter."
                : "No subordinate members are currently assigned under your account hierarchy."}
            </p>
          </div>
        )}
      </div>

      {/* User Profile Inspection Drawer/Modal */}
      {inspectUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center text-xs shadow-2xs ${getAvatarGradient(
                    inspectUser.role
                  )}`}
                >
                  {inspectUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{inspectUser.name}</h3>
                  <p className="text-xs text-slate-500">{roleLabel(inspectUser.role)} · Level: {roleHierarchyLevel(inspectUser.role)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectUser(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="font-semibold text-slate-500">User ID</p>
                  <p className="font-mono font-bold text-slate-900">{inspectUser.userId || inspectUser.id}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-500">Account Status</p>
                  <p className="font-bold text-emerald-600">{inspectUser.active ? "Active" : "Disabled"}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-500">Email Address</p>
                  <p className="font-bold text-slate-900">{inspectUser.email}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-500">Phone Number</p>
                  <p className="font-bold text-slate-900">{inspectUser.phone || "—"}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-500">Hierarchy Level</p>
                  <p className="font-bold text-slate-900">{roleHierarchyLevel(inspectUser.role)}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-500">Data Scope</p>
                  <p className="font-bold text-slate-900">{roleDataScope(inspectUser.role)}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setInspectUser(null)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Close Inspector
              </button>
              <Link
                href={`/admin/users/${inspectUser.id}`}
                className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-xs font-bold transition shadow-2xs"
              >
                Edit Full Profile
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Field Privacy Control Matrix Modal */}
      {isPrivacyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-purple-600" />
                  Field-Level Privacy & Information Visibility Matrix
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Control which user information fields (email, phone, DOB, PAN, Aadhaar, KYC) are shown or hidden per hierarchy level across departments (IT, Finance, Operations).
                </p>
              </div>
              <button type="button" onClick={() => setIsPrivacyModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {privacyMsg && (
              <p className="text-xs font-bold p-2.5 rounded-xl border bg-emerald-50 text-emerald-700 border-emerald-200">
                {privacyMsg}
              </p>
            )}

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100 text-[11px] font-extrabold uppercase text-slate-700">
                  <tr>
                    <th className="p-3 border-r border-slate-200">Hierarchy Level</th>
                    {SENSITIVE_FIELDS.map((f) => (
                      <th key={f.key} className="p-3 border-r border-slate-200 text-center whitespace-nowrap" title={f.description}>
                        {f.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {HIERARCHY_LEVEL_LIST.map((lvl) => (
                    <tr key={lvl.key} className="hover:bg-slate-50">
                      <td className="p-3 border-r border-slate-200 font-bold text-slate-900 whitespace-nowrap">
                        {lvl.label}
                      </td>
                      {SENSITIVE_FIELDS.map((f) => {
                        const isVisible = Boolean(privacyConfig[lvl.key]?.[f.key]);
                        return (
                          <td key={f.key} className="p-3 border-r border-slate-200 text-center align-middle">
                            <button
                              type="button"
                              onClick={() => togglePrivacyField(lvl.key, f.key)}
                              className={`p-1.5 rounded-lg border transition ${
                                isVisible
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                                  : "bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
                              }`}
                              title={isVisible ? `Visible at ${lvl.key} level` : `Hidden / Masked at ${lvl.key} level`}
                            >
                              {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <p className="text-[11px] text-slate-500 font-medium">
                Note: Super Admins and Direct Managers always retain full authorized access to subordinate profiles.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPrivacyModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePrivacyMatrix}
                  disabled={savingPrivacy}
                  className="rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 text-xs font-bold transition shadow-2xs disabled:opacity-50"
                >
                  {savingPrivacy ? "Saving..." : "Save Visibility Settings"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Manager Quick Modal */}
      {targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-amber-600" />
                Assign Manager for {targetUser.name}
              </h3>
              <button type="button" onClick={() => setTargetUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {managerError && (
              <p className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                {managerError}
              </p>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Select Reporting Manager / Supervisor
              </label>
              <SearchableSelect
                options={[
                  { value: "", label: "No Manager (Independent / Top Level)" },
                  ...users
                    .filter((u) => u.id !== targetUser.id)
                    .map((m) => ({
                      value: m.id,
                      label: `${m.name} (${roleLabel(m.role)})`,
                      sublabel: `${m.userId ? `${m.userId} · ` : ""}${m.email}`,
                    })),
                ]}
                value={selectedManagerId}
                onChange={(val) => setSelectedManagerId(val)}
                placeholder="Select manager..."
                searchPlaceholder="Search manager by User ID, name, or email..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setTargetUser(null)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveManager}
                disabled={savingManager}
                className="rounded-xl bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 text-xs font-bold transition shadow-2xs disabled:opacity-50"
              >
                {savingManager ? "Saving..." : "Save Hierarchy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
