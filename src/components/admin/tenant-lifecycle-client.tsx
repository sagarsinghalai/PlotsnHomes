"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Building2, Search, ShieldAlert, Play, Pause, Ban, AlertTriangle } from "lucide-react";

type Org = {
  id: string;
  name: string;
  code: string;
  status: string;
  domain: string | null;
  createdAt: string;
  whiteLabelAdmin: { id: string; name: string; email: string } | null;
  _count: { users: number; franchises: number };
};

const LABELS: Record<string, string> = {
  PENDING: "Pending",
  ACTIVE: "Active",
  PAST_DUE: "Past due",
  SUSPENDED: "Suspended",
  CANCELLED: "Cancelled",
  DELETED: "Deleted",
};

// Mirror of src/lib/tenant-lifecycle.ts (server is the source of truth + validates).
const TRANSITIONS: Record<string, string[]> = {
  PENDING: ["ACTIVE", "CANCELLED"],
  ACTIVE: ["PAST_DUE", "SUSPENDED", "CANCELLED"],
  PAST_DUE: ["ACTIVE", "SUSPENDED", "CANCELLED"],
  SUSPENDED: ["ACTIVE", "CANCELLED"],
  CANCELLED: ["ACTIVE", "DELETED"],
  DELETED: [],
};

const BADGE: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  PAST_DUE: "bg-amber-100 text-amber-700",
  SUSPENDED: "bg-rose-100 text-rose-700",
  PENDING: "bg-slate-100 text-slate-600",
  CANCELLED: "bg-slate-200 text-slate-700",
  DELETED: "bg-slate-200 text-slate-500",
};

const ACTION_ICON: Record<string, any> = {
  ACTIVE: Play,
  PAST_DUE: AlertTriangle,
  SUSPENDED: Pause,
  CANCELLED: Ban,
  DELETED: Ban,
};

const DESTRUCTIVE = new Set(["SUSPENDED", "CANCELLED", "DELETED"]);

export function TenantLifecycleClient() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [primaryId, setPrimaryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState("");
  const [confirm, setConfirm] = useState<{ org: Org; to: string } | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/platform/tenants");
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to load");
      setOrgs(data.organizations);
      setPrimaryId(data.primaryTenantId || "");
    } catch (e: any) {
      setError(e.message || "Failed to load tenants");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function transition(org: Org, to: string) {
    setBusyId(org.id);
    setError("");
    try {
      const res = await fetch("/api/admin/platform/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: org.id, toStatus: to }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Transition failed");
      setOrgs((prev) => prev.map((o) => (o.id === org.id ? { ...o, status: to } : o)));
    } catch (e: any) {
      setError(e.message || "Transition failed");
    } finally {
      setBusyId("");
      setConfirm(null);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orgs;
    return orgs.filter((o) => [o.name, o.code, o.domain, LABELS[o.status]].some((v) => (v || "").toLowerCase().includes(q)));
  }, [orgs, search]);

  function onAction(org: Org, to: string) {
    if (DESTRUCTIVE.has(to)) setConfirm({ org, to });
    else transition(org, to);
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="h-5 w-5 text-slate-500" />
        <h1 className="font-display text-2xl font-bold text-slate-900">Tenants</h1>
      </div>
      <p className="text-slate-600 mb-6 max-w-2xl">
        Manage each white-label tenant's lifecycle. Suspending a tenant blocks login and API access for all of its
        users while <strong>preserving every record</strong> — reactivate any time. Changes are audited.
      </p>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tenants…"
          className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
        />
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <ShieldAlert className="h-4 w-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading tenants…</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Tenant</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Users</th>
                <th className="px-4 py-3">Admin</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((o) => {
                const isPrimary = o.id === primaryId;
                const options = (TRANSITIONS[o.status] || []).filter((to) => !(isPrimary && to !== "ACTIVE"));
                return (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{o.name}{isPrimary && <span className="ml-2 rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">PRIMARY</span>}</div>
                      <div className="text-xs text-slate-500">{o.code}{o.domain ? ` · ${o.domain}` : ""}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${BADGE[o.status] || "bg-slate-100 text-slate-600"}`}>
                        {LABELS[o.status] || o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{o._count.users}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {o.whiteLabelAdmin ? (
                        <span title={o.whiteLabelAdmin.email}>{o.whiteLabelAdmin.name}</span>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {busyId === o.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                        ) : options.length === 0 ? (
                          <span className="text-xs text-slate-400">No actions</span>
                        ) : options.map((to) => {
                          const Icon = ACTION_ICON[to] || Play;
                          const danger = DESTRUCTIVE.has(to);
                          return (
                            <button
                              key={to}
                              onClick={() => onAction(o, to)}
                              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium ${
                                danger ? "bg-rose-50 text-rose-700 hover:bg-rose-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                            >
                              <Icon className="h-3.5 w-3.5" /> {LABELS[to]}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No tenants match your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirm(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <AlertTriangle className="h-5 w-5 text-rose-600" /> {LABELS[confirm.to]} “{confirm.org.name}”?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {confirm.to === "SUSPENDED"
                ? "All of this tenant's users will be signed out and blocked from logging in or using the API. No data is deleted; you can reactivate at any time."
                : confirm.to === "CANCELLED"
                  ? "This tenant will be cancelled. Its users lose access immediately; data is preserved for retention."
                  : "This tenant will be marked deleted and lose all access. Data is retained until purged."}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConfirm(null)} className="rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
              <button
                onClick={() => transition(confirm.org, confirm.to)}
                className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700"
              >
                {LABELS[confirm.to]}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
