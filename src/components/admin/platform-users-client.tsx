"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, LogIn, KeyRound, Search, Building2, ShieldCheck, Copy, Check } from "lucide-react";

type NamedRef = { id: string; name: string } | null;
type PlatformUser = {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  active: boolean;
  lastActiveAt: string | null;
  createdAt: string;
  tenantId: string | null;
  organizationRel: { id: string; name: string; code: string } | null;
  franchiseRel: NamedRef;
  branchRel: NamedRef;
  departmentRel: NamedRef;
  teamRel: NamedRef;
};
type Org = {
  id: string;
  name: string;
  code: string;
  status: string;
  domain: string | null;
  whiteLabelAdmin: { id: string; name: string; email: string } | null;
  _count: { users: number; franchises: number };
};

const PLATFORM_ROLES = new Set(["SUPERADMIN", "PLATFORM_ADMIN"]);
const NO_ORG = "__no_org__";

export function PlatformUsersClient() {
  const { update } = useSession();
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState("");
  const [resetFor, setResetFor] = useState<PlatformUser | null>(null);
  const [resetValue, setResetValue] = useState("");
  const [resetResult, setResetResult] = useState("");
  const [resetErr, setResetErr] = useState("");
  const [copied, setCopied] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/platform/users");
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to load");
      setUsers(data.users);
      setOrgs(data.organizations);
    } catch (e: any) {
      setError(e.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.name, u.email, u.userId, u.role, u.organizationRel?.name, u.franchiseRel?.name, u.branchRel?.name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [users, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, PlatformUser[]>();
    for (const u of filtered) {
      const key = u.tenantId || NO_ORG;
      (map.get(key) ?? map.set(key, []).get(key)!).push(u);
    }
    return map;
  }, [filtered]);

  async function loginAs(u: PlatformUser) {
    if (PLATFORM_ROLES.has(u.role)) {
      alert("You cannot log in as another platform admin.");
      return;
    }
    if (!confirm(`Log in as ${u.name || u.email}? You will browse the platform as this user until you click Exit in the banner. This is recorded in the audit log.`)) return;
    setBusyId(u.id);
    try {
      await update({ impersonateUserId: u.id });
      window.location.href = "/dashboard";
    } catch {
      setBusyId("");
      alert("Could not start impersonation.");
    }
  }

  function openReset(u: PlatformUser) {
    setResetFor(u);
    setResetValue(Math.random().toString(36).slice(-10) + "A1!");
    setResetResult("");
    setResetErr("");
    setCopied(false);
  }

  async function submitReset() {
    if (!resetFor) return;
    if (!resetValue || resetValue.trim().length < 6) {
      setResetErr("Password must be at least 6 characters.");
      return;
    }
    setBusyId(resetFor.id);
    setResetErr("");
    try {
      const res = await fetch(`/api/admin/users/${resetFor.id}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: resetValue.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Reset failed");
      setResetResult(data.temporaryPassword || resetValue.trim());
    } catch (e: any) {
      setResetErr(e.message || "Reset failed");
    } finally {
      setBusyId("");
    }
  }

  const orgById = useMemo(() => new Map(orgs.map((o) => [o.id, o])), [orgs]);
  const orderedKeys = useMemo(() => {
    const keys = Array.from(grouped.keys());
    keys.sort((a, b) => {
      if (a === NO_ORG) return 1;
      if (b === NO_ORG) return -1;
      return (orgById.get(a)?.name || "").localeCompare(orgById.get(b)?.name || "");
    });
    return keys;
  }, [grouped, orgById]);

  if (loading) {
    return <div className="flex items-center gap-2 p-8 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading platform users…</div>;
  }
  if (error) {
    return <div className="m-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Platform users</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Every user across all white-labels, franchises and sub-accounts. You can log in as any user (recorded in the audit log) or reset a password. Passwords are never shown — they are stored only as one-way hashes.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, role, white-label…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        <span className="text-sm text-slate-500">{filtered.length} user{filtered.length === 1 ? "" : "s"}</span>
      </div>

      {orderedKeys.map((key) => {
        const org = key === NO_ORG ? null : orgById.get(key);
        const rows = grouped.get(key) || [];
        return (
          <div key={key} className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
              <Building2 className="h-4 w-4 text-brand" />
              <span className="font-bold text-slate-900 dark:text-white">
                {org ? org.name : "Direct / platform users (no white-label)"}
              </span>
              {org && <span className="rounded-md bg-slate-200 px-1.5 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">{org.code}</span>}
              {org && <span className={`rounded-md px-1.5 py-0.5 text-xs ${org.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{org.status}</span>}
              {org?.domain && <span className="text-xs text-slate-500">{org.domain}</span>}
              {org?.whiteLabelAdmin && <span className="text-xs text-slate-500">· admin: {org.whiteLabelAdmin.email}</span>}
              <span className="ml-auto text-xs text-slate-500">{rows.length} shown</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700">
                    <th className="px-4 py-2 font-semibold">User</th>
                    <th className="px-4 py-2 font-semibold">Role</th>
                    <th className="px-4 py-2 font-semibold">Franchise / Branch / Dept / Team</th>
                    <th className="px-4 py-2 font-semibold">Status</th>
                    <th className="px-4 py-2 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((u) => (
                    <tr key={u.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-slate-900 dark:text-white">{u.name || "—"}</div>
                        <div className="text-xs text-slate-500">{u.email}{u.userId ? ` · ${u.userId}` : ""}</div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium ${PLATFORM_ROLES.has(u.role) ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200"}`}>
                          {PLATFORM_ROLES.has(u.role) && <ShieldCheck className="h-3 w-3" />}{u.role}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-500">
                        {[u.franchiseRel?.name, u.branchRel?.name, u.departmentRel?.name, u.teamRel?.name].filter(Boolean).join(" / ") || "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`rounded-md px-1.5 py-0.5 text-xs ${u.active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{u.active ? "Active" : "Disabled"}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => loginAs(u)}
                            disabled={busyId === u.id || PLATFORM_ROLES.has(u.role)}
                            title={PLATFORM_ROLES.has(u.role) ? "Cannot log in as another platform admin" : "Log in as this user"}
                            className="inline-flex items-center gap-1 rounded-lg bg-brand px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover disabled:opacity-40"
                          >
                            {busyId === u.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogIn className="h-3.5 w-3.5" />} Login as
                          </button>
                          <button
                            onClick={() => openReset(u)}
                            disabled={busyId === u.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"
                          >
                            <KeyRound className="h-3.5 w-3.5" /> Reset
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {resetFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setResetFor(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Reset password — {resetFor.name || resetFor.email}</h3>
            {!resetResult ? (
              <>
                <p className="mt-1 text-xs text-slate-500">Set a temporary password. It is shown once here so you can share it, then stored only as a hash. Ask the user to change it after logging in.</p>
                <input
                  value={resetValue}
                  onChange={(e) => setResetValue(e.target.value)}
                  className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
                {resetErr && <div className="mt-2 text-xs text-red-600">{resetErr}</div>}
                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={() => setResetFor(null)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">Cancel</button>
                  <button onClick={submitReset} disabled={busyId === resetFor.id} className="inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50">
                    {busyId === resetFor.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Reset password
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">Password reset. Share this once — it will not be shown again:</p>
                <div className="mt-2 flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 font-mono text-sm dark:bg-slate-800">
                  <span className="flex-1">{resetResult}</span>
                  <button onClick={() => { navigator.clipboard?.writeText(resetResult); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="text-slate-500 hover:text-slate-800">
                    {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <div className="mt-4 flex justify-end">
                  <button onClick={() => setResetFor(null)} className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-hover">Done</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
