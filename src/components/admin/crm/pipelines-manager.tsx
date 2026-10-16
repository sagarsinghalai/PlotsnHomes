"use client";

import { useState } from "react";
import { Plus, Search, MoreVertical, Edit, Copy, Shield, Link as LinkIcon, MoveUp, MoveDown, Trash2, GripVertical, KanbanSquare } from "lucide-react";
import { Pipeline } from "@/lib/pipeline-store";
import { CreatePipelineModal } from "@/components/admin/crm/create-pipeline-modal";
import { useRouter } from "next/navigation";

import { useAdminPermissions } from "@/components/admin/admin-permissions-context";

type Props = {
  initialPipelines: Pipeline[];
};

export function PipelinesManager({ initialPipelines }: Props) {
  const router = useRouter();
  
  let hasSubPermission: ((permissionKey: string, subKey: string) => boolean) | null = null;
  try {
    const perms = useAdminPermissions();
    hasSubPermission = perms.hasSubPermission;
  } catch (e) {
    // If rendered outside AdminPermissionsProvider, default to true
  }

  const [pipelines, setPipelines] = useState<Pipeline[]>(initialPipelines);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const filtered = pipelines.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase().trim())
  );

  function formatDate(iso: string) {
    try {
      const d = new Date(iso);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      return `${dateStr} / ${timeStr}`;
    } catch {
      return iso;
    }
  }

  function handleOpenCreate() {
    setEditingPipeline(null);
    setIsModalOpen(true);
  }

  function handleOpenEdit(p: Pipeline) {
    setEditingPipeline(p);
    setActiveMenuId(null);
    setIsModalOpen(true);
  }

  async function handleDuplicate(p: Pipeline) {
    setActiveMenuId(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/pipelines", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "duplicate", id: p.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPipelines([...pipelines, data.pipeline]);
      setToast(`✓ Duplicated "${p.name}" successfully.`);
      setTimeout(() => setToast(""), 4000);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to duplicate");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(p: Pipeline) {
    setActiveMenuId(null);
    if (!confirm(`Are you sure you want to delete "${p.name}"?`)) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/admin/pipelines?id=${p.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPipelines(pipelines.filter((item) => item.id !== p.id));
      setToast(`✓ Deleted "${p.name}".`);
      setTimeout(() => setToast(""), 4000);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to delete");
    } finally {
      setBusy(false);
    }
  }

  function handleCopyLink(p: Pipeline) {
    setActiveMenuId(null);
    const url = `${window.location.origin}/admin/crm?pipelineId=${p.id}`;
    navigator.clipboard.writeText(url);
    setToast("✓ Pipeline link copied to clipboard.");
    setTimeout(() => setToast(""), 4000);
  }

  async function handleMovePosition(index: number, direction: "up" | "down") {
    setActiveMenuId(null);
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= pipelines.length) return;

    const copy = [...pipelines];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;

    setPipelines(copy);

    try {
      await fetch("/api/admin/pipelines", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reorder", order: copy.map((p) => p.id) }),
      });
    } catch (err) {
      console.error(err);
    }
  }

  const canCreatePipeline = !hasSubPermission || hasSubPermission("pipeline", "create_pipeline");
  const canEditPipelines = !hasSubPermission || hasSubPermission("pipeline", "edit_pipelines");
  const canDeletePipelines = !hasSubPermission || hasSubPermission("pipeline", "delete_pipelines");

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      {toast && (
        <p className="p-3 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200 animate-in fade-in">
          {toast}
        </p>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 flex items-center gap-2">
            <KanbanSquare className="h-6 w-6 text-[#b58a18]" />
            <span>Pipelines</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Use pipelines to track opportunities and sales progress across stages.
          </p>
        </div>

        {canCreatePipeline && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#b58a18] hover:bg-[#9e7713] text-slate-950 font-black px-5 py-2.5 text-xs shadow-md transition shrink-0"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Create pipeline</span>
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs">
        {/* Search Bar Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search pipelines..."
              className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#b58a18]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 border-b border-slate-200">
              <tr>
                <th className="p-3.5 w-10 text-center">#</th>
                <th className="p-3.5 w-12 text-center">#</th>
                <th className="p-3.5">Pipeline name</th>
                <th className="p-3.5 text-center">Total stages</th>
                <th className="p-3.5">Updated on</th>
                <th className="p-3.5 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 italic">
                    No pipelines found. Click "+ Create pipeline" to add your first sales pipeline.
                  </td>
                </tr>
              ) : (
                filtered.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    {/* Drag Handle */}
                    <td className="p-3.5 text-center text-slate-400 cursor-grab">
                      <GripVertical className="h-4 w-4 mx-auto" />
                    </td>

                    {/* Row Index */}
                    <td className="p-3.5 text-center font-bold text-slate-500">
                      {idx + 1}
                    </td>

                    {/* Pipeline Name */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm hover:text-[#b58a18] cursor-pointer" onClick={() => handleOpenEdit(p)}>
                          {p.name}
                        </span>
                        {p.useOpportunityProbability && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                            Opp-Probability
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Total stages */}
                    <td className="p-3.5 text-center font-bold text-slate-700">
                      {p.stages.length}
                    </td>

                    {/* Updated on */}
                    <td className="p-3.5 text-slate-600 font-medium">
                      {formatDate(p.updatedAt)}
                    </td>

                    {/* Actions Menu */}
                    <td className="p-3.5 text-right pr-6 relative">
                      <button
                        type="button"
                        onClick={() => setActiveMenuId(activeMenuId === p.id ? null : p.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition cursor-pointer"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {/* 3-Dot Actions Dropdown */}
                      {activeMenuId === p.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setActiveMenuId(null)} />
                          <div
                            className={`absolute right-6 z-50 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl animate-in fade-in ${
                              idx >= Math.max(1, filtered.length - 2) ? "bottom-8" : "top-10"
                            }`}
                          >
                            {canEditPipelines && (
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(p)}
                                className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                              >
                                <Edit className="h-3.5 w-3.5 text-slate-500" />
                                <span>Edit</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDuplicate(p)}
                              className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                            >
                              <Copy className="h-3.5 w-3.5 text-slate-500" />
                              <span>Duplicate</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEdit(p)}
                              className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                            >
                              <Shield className="h-3.5 w-3.5 text-slate-500" />
                              <span>Manage permissions</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyLink(p)}
                              className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                            >
                              <LinkIcon className="h-3.5 w-3.5 text-slate-500" />
                              <span>Copy link</span>
                            </button>

                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => handleMovePosition(idx, "up")}
                                className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                              >
                                <MoveUp className="h-3.5 w-3.5 text-slate-500" />
                                <span>Move up</span>
                              </button>
                            )}

                            {idx < filtered.length - 1 && (
                              <button
                                type="button"
                                onClick={() => handleMovePosition(idx, "down")}
                                className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                              >
                                <MoveDown className="h-3.5 w-3.5 text-slate-500" />
                                <span>Move down</span>
                              </button>
                            )}

                            {canDeletePipelines && (
                              <>
                                <div className="my-1 border-t border-slate-200" />

                                <button
                                  type="button"
                                  onClick={() => handleDelete(p)}
                                  className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-red-600" />
                                  <span>Delete</span>
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Stats Bar */}
        <div className="flex items-center justify-between p-3.5 bg-slate-50/80 border-t border-slate-200 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <select className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-bold text-slate-700">
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>

          <div>
            1 - {filtered.length} of {filtered.length}
          </div>
        </div>
      </div>

      {/* Modal */}
      <CreatePipelineModal
        pipeline={editingPipeline}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={(saved) => {
          setPipelines((prev) => {
            const idx = prev.findIndex((item) => item.id === saved.id);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = saved;
              return updated;
            }
            return [...prev, saved];
          });
          setToast(`✓ Saved pipeline "${saved.name}".`);
          setTimeout(() => setToast(""), 4000);
          router.refresh();
        }}
      />
    </div>
  );
}
