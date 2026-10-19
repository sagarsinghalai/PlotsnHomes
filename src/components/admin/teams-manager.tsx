"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit3, Trash2, X, Loader2, Check, Users2, Building2, UserCog } from "lucide-react";
import { ViewToggle, useViewMode, viewContainerClass } from "@/components/admin/view-toggle";
import { useAdminPermissions } from "@/components/admin/admin-permissions-context";

export type TeamRow = {
  id: string;
  name: string;
  code: string;
  status: string;
  departmentId: string | null;
  teamLeaderId: string | null;
  department: { id: string; name: string } | null;
  teamLeader: { id: string; name: string; email: string } | null;
  _count: { users: number };
};

type Option = { id: string; name: string; email?: string };

export function TeamsManager({
  initialTeams,
  departments,
  leaders,
}: {
  initialTeams: TeamRow[];
  departments: Option[];
  leaders: Option[];
}) {
  const router = useRouter();
  const { hasAddPermission, hasEditPermission, hasDeletePermission } = useAdminPermissions();
  const canAdd = hasAddPermission("/admin/teams");
  const canEdit = hasEditPermission("/admin/teams");
  const canDelete = hasDeletePermission("/admin/teams");

  const [teams, setTeams] = useState<TeamRow[]>(initialTeams);
  const [viewMode, setViewMode] = useViewMode("admin-teams", "list");

  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<TeamRow | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [teamLeaderId, setTeamLeaderId] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function showSuccess(msg: string) {
    setSuccess(msg);
    setError("");
    setTimeout(() => setSuccess(""), 3000);
  }

  function openCreate() {
    setSelected(null);
    setName("");
    setCode(`TEAM-${Math.floor(1000 + Math.random() * 9000)}`);
    setDepartmentId("");
    setTeamLeaderId("");
    setStatus("ACTIVE");
    setError("");
    setIsOpen(true);
  }

  function openEdit(t: TeamRow) {
    setSelected(t);
    setName(t.name);
    setCode(t.code);
    setDepartmentId(t.departmentId || "");
    setTeamLeaderId(t.teamLeaderId || "");
    setStatus(t.status || "ACTIVE");
    setError("");
    setIsOpen(true);
  }

  async function handleSave() {
    if (!name.trim() || !code.trim()) {
      setError("Team Name and Code are required.");
      return;
    }
    setLoading(true);
    setError("");
    const payload = {
      name: name.trim(),
      code: code.trim(),
      departmentId: departmentId || null,
      teamLeaderId: teamLeaderId || null,
      status,
    };
    try {
      const url = selected ? `/api/admin/teams/${selected.id}` : "/api/admin/teams";
      const res = await fetch(url, {
        method: selected ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to save team");

      if (selected) {
        setTeams((prev) => prev.map((t) => (t.id === selected.id ? data.team : t)).sort((a, b) => a.name.localeCompare(b.name)));
        showSuccess("Team updated successfully!");
      } else {
        setTeams((prev) => [...prev, data.team].sort((a, b) => a.name.localeCompare(b.name)));
        showSuccess("Team created successfully!");
      }
      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(t: TeamRow) {
    if (!confirm(`Delete team "${t.name}"? This cannot be undone.`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/teams/${t.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete team");
      setTeams((prev) => prev.filter((x) => x.id !== t.id));
      showSuccess("Team deleted successfully!");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const statusBadge = (s: string) =>
    s === "ACTIVE"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users2 className="h-6 w-6 text-brand" />
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Teams</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Create and manage sales &amp; operations teams used across lead routing.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle mode={viewMode} onChange={setViewMode} />
          {canAdd && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold px-4 py-2.5 text-sm transition shadow-sm"
            >
              <Plus className="h-4 w-4" /> Add Team
            </button>
          )}
        </div>
      </div>

      {success && (
        <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700 border border-emerald-100 flex items-center gap-2">
          <Check className="h-4.5 w-4.5 text-emerald-600" />
          <span className="font-medium">{success}</span>
        </div>
      )}
      {error && !isOpen && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-100 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-500 hover:text-red-700"><X className="h-4 w-4" /></button>
        </div>
      )}

      {viewMode !== "list" ? (
        teams.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-sm text-slate-500">
            No teams yet. Click &quot;Add Team&quot; to create one.
          </div>
        ) : (
          <div className={viewContainerClass(viewMode)}>
            {teams.map((t) => (
              <div key={t.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md transition flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">{t.name}</h3>
                    <span className="font-mono text-[11px] text-slate-500">{t.code}</span>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusBadge(t.status)}`}>{t.status}</span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 border-t border-slate-100 dark:border-slate-800 pt-2">
                  <p className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-slate-400" /> {t.department?.name ?? "—"}</p>
                  <p className="flex items-center gap-1.5"><UserCog className="h-3.5 w-3.5 text-slate-400" /> {t.teamLeader?.name ?? "Unassigned"}</p>
                  <p>Members: <strong className="text-slate-900 dark:text-white">{t._count.users}</strong></p>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 mt-auto">
                  {canEdit && (
                    <button onClick={() => openEdit(t)} className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
                      <Edit3 className="h-3.5 w-3.5" /> Edit
                    </button>
                  )}
                  {canDelete && (
                    <button onClick={() => handleDelete(t)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-left text-slate-500 font-medium border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Team</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Team Leader</th>
                <th className="px-6 py-4">Members</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {teams.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-900 dark:text-white block">{t.name}</span>
                    <span className="font-mono text-[11px] text-slate-500">{t.code}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{t.department?.name ?? "—"}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{t.teamLeader?.name ?? "Unassigned"}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{t._count.users}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${statusBadge(t.status)}`}>{t.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {canEdit && (
                        <button onClick={() => openEdit(t)} title="Edit" className="p-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><Edit3 className="h-4 w-4" /></button>
                      )}
                      {canDelete && (
                        <button onClick={() => handleDelete(t)} title="Delete" className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {teams.length === 0 && (
                <tr><td colSpan={6} className="p-12 text-center text-slate-500">No teams yet. Click &quot;Add Team&quot; to create one.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto backdrop-blur-sm">
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selected ? `Edit ${selected.name}` : "Create Team"}</h3>
              <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
            </div>
            {error && <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700">{error}</div>}
            <div className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block text-sm">
                  <span className="text-slate-700 dark:text-slate-200 font-semibold">Team Name *</span>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Residential Sales Alpha" className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-brand" />
                </label>
                <label className="block text-sm">
                  <span className="text-slate-700 dark:text-slate-200 font-semibold">Team Code *</span>
                  <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="TEAM-1234" className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-brand" />
                </label>
                <label className="block text-sm">
                  <span className="text-slate-700 dark:text-slate-200 font-semibold">Department</span>
                  <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-brand">
                    <option value="">— None —</option>
                    {departments.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="text-slate-700 dark:text-slate-200 font-semibold">Team Leader</span>
                  <select value={teamLeaderId} onChange={(e) => setTeamLeaderId(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-brand">
                    <option value="">— Unassigned —</option>
                    {leaders.map((l) => (<option key={l.id} value={l.id}>{l.name}{l.email ? ` (${l.email})` : ""}</option>))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="text-slate-700 dark:text-slate-200 font-semibold">Status</span>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-brand">
                    {["ACTIVE", "INACTIVE"].map((s) => (<option key={s} value={s}>{s}</option>))}
                  </select>
                </label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex justify-end gap-3">
              <button type="button" onClick={() => setIsOpen(false)} disabled={loading} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200">Cancel</button>
              <button type="button" onClick={handleSave} disabled={loading || !name.trim() || !code.trim()} className="flex items-center gap-2 rounded-xl bg-brand hover:bg-brand-hover text-white px-5 py-2 text-sm font-semibold disabled:opacity-50">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {selected ? "Save Changes" : "Create Team"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
