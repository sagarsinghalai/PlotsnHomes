"use client";

import { useState } from "react";
import { X, Plus, Trash2, GripVertical, Info, Check, Palette, Shield, SlidersHorizontal, BarChart2, PieChart, LineChart as LineChartIcon, Filter } from "lucide-react";
import { Pipeline, PipelineStage, ReportFormat, ColorDisplayMode, DEFAULT_PIPELINE_STYLING } from "@/lib/pipeline-store";

type Props = {
  pipeline?: Pipeline | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (pipeline: Pipeline) => void;
};

const REPORT_OPTIONS: { id: ReportFormat; label: string; icon: any }[] = [
  { id: "funnel", label: "Funnel chart", icon: Filter },
  { id: "pie", label: "Pie chart", icon: PieChart },
  { id: "line", label: "Line chart", icon: LineChartIcon },
  { id: "bar", label: "Bar chart / Histogram", icon: BarChart2 },
];

const PRESET_COLORS = [
  "#b58a18", "#06b6d4", "#8b5cf6", "#ec4899", "#f97316",
  "#eab308", "#10b981", "#14b8a6", "#22c55e", "#ef4444",
  "#6366f1", "#64748b",
];

const ALL_ROLES = [
  { id: "SUPERADMIN", label: "Super Admin" },
  { id: "PLATFORM_ADMIN", label: "Platform Admin" },
  { id: "WHITE_LABEL_ADMIN", label: "White Label Admin" },
  { id: "FRANCHISE_ADMIN", label: "Franchise Admin" },
  { id: "BRANCH_MANAGER", label: "Branch Manager" },
  { id: "TEAM_LEADER", label: "Team Leader" },
  { id: "EXECUTIVE", label: "Executive / Staff" },
  { id: "AGENT", label: "Agent" },
];

export function CreatePipelineModal({ pipeline, isOpen, onClose, onSaved }: Props) {
  const [activeTab, setActiveTab] = useState<"stages" | "styling" | "permissions">("stages");
  const [name, setName] = useState(pipeline?.name || "Marketing Pipeline");
  const [useOpportunityProbability, setUseOpportunityProbability] = useState(
    pipeline?.useOpportunityProbability ?? false
  );
  const [displayColorMode, setDisplayColorMode] = useState<ColorDisplayMode>(
    pipeline?.displayColorMode || "dot"
  );
  const [stages, setStages] = useState<PipelineStage[]>(
    pipeline?.stages || [
      { id: "stg-1", name: "New Lead", key: "NEW", probability: 20, showInReports: ["funnel", "pie"], color: "#b58a18", order: 1 },
      { id: "stg-2", name: "Contacted", key: "CONTACTED", probability: 40, showInReports: ["funnel", "line"], color: "#06b6d4", order: 2 },
      { id: "stg-3", name: "Proposal Sent", key: "PROPOSAL", probability: 60, showInReports: ["funnel", "pie"], color: "#f97316", order: 3 },
      { id: "stg-4", name: "Closed", key: "WON", probability: 80, showInReports: ["funnel", "bar"], color: "#22c55e", order: 4 },
    ]
  );
  const [styling, setStyling] = useState(pipeline?.styling || { ...DEFAULT_PIPELINE_STYLING });
  const [permissions, setPermissions] = useState(
    pipeline?.permissions ||
      ALL_ROLES.map((r) => ({ role: r.id, canView: true, canEdit: true }))
  );

  const [activeReportDropdown, setActiveReportDropdown] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  function handleAddStage() {
    const newStage: PipelineStage = {
      id: `stg-${Date.now()}`,
      name: `New Stage ${stages.length + 1}`,
      key: `STAGE_${stages.length + 1}`,
      probability: Math.min(100, (stages.length + 1) * 15),
      showInReports: ["funnel"],
      color: PRESET_COLORS[stages.length % PRESET_COLORS.length],
      order: stages.length + 1,
    };
    setStages([...stages, newStage]);
  }

  function handleUpdateStage(id: string, updates: Partial<PipelineStage>) {
    setStages(stages.map((stg) => (stg.id === id ? { ...stg, ...updates } : stg)));
  }

  function handleDeleteStage(id: string) {
    if (stages.length <= 1) {
      setError("Pipeline must have at least 1 stage.");
      return;
    }
    setError("");
    setStages(stages.filter((stg) => stg.id !== id));
  }

  function handleToggleReportOption(stageId: string, format: ReportFormat) {
    const target = stages.find((s) => s.id === stageId);
    if (!target) return;

    let updated: ReportFormat[];
    if (target.showInReports.includes(format)) {
      updated = target.showInReports.filter((f) => f !== format);
    } else {
      updated = [...target.showInReports, format];
    }
    handleUpdateStage(stageId, { showInReports: updated });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Pipeline name is required.");
      return;
    }
    if (stages.length === 0) {
      setError("Please add at least one stage.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        id: pipeline?.id,
        name: name.trim(),
        useOpportunityProbability,
        displayColorMode,
        stages: stages.map((s, idx) => ({ ...s, order: idx + 1 })),
        styling,
        permissions,
      };

      const res = await fetch("/api/admin/pipelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save pipeline");

      onSaved(data.pipeline);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save pipeline.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {pipeline ? "Edit pipeline" : "Create pipeline"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure sales stages, report visualizations, probabilities, and custom styling.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Navigation Sub-Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200 px-6 bg-white text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("stages")}
            className={`inline-flex items-center gap-2 py-3 px-3 border-b-2 transition ${
              activeTab === "stages"
                ? "border-[#b58a18] text-[#b58a18] font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Stages & Reports</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("styling")}
            className={`inline-flex items-center gap-2 py-3 px-3 border-b-2 transition ${
              activeTab === "styling"
                ? "border-[#b58a18] text-[#b58a18] font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Palette className="h-4 w-4" />
            <span>Custom Fonts & Colors</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("permissions")}
            className={`inline-flex items-center gap-2 py-3 px-3 border-b-2 transition ${
              activeTab === "permissions"
                ? "border-[#b58a18] text-[#b58a18] font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>Role Permissions</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <p className="p-3 rounded-xl bg-red-50 text-red-700 font-bold text-xs border border-red-200">
              {error}
            </p>
          )}

          {activeTab === "stages" && (
            <div className="space-y-6">
              {/* Field 1: Pipeline Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Pipeline name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Marketing Pipeline"
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 outline-none focus:border-[#b58a18]"
                  required
                />
                <p className="text-xs text-slate-500">
                  Use a unique, descriptive name so you can find this pipeline later
                </p>
              </div>

              {/* Field 2: Opportunity-level probability */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Use opportunity-level probability</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    When enabled, each opportunity uses its own probability. When disabled, probability is based on the stage.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useOpportunityProbability}
                    onChange={(e) => setUseOpportunityProbability(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#b58a18]"></div>
                </label>
              </div>

              {/* Field 3: Display Colors Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Set pipeline display colors
                </label>
                <p className="text-xs text-slate-500">
                  Choose how stage colors appear across your pipeline views
                </p>
                <div className="grid grid-cols-3 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setDisplayColorMode("none")}
                    className={`p-3.5 rounded-xl border text-center transition ${
                      displayColorMode === "none"
                        ? "border-[#b58a18] bg-amber-50/60 ring-2 ring-amber-200 font-bold text-[#b58a18]"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <p className="text-xs font-bold">Stage name</p>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">Default (no color)</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDisplayColorMode("dot")}
                    className={`p-3.5 rounded-xl border text-center transition ${
                      displayColorMode === "dot"
                        ? "border-[#b58a18] bg-amber-50/60 ring-2 ring-amber-200 font-bold text-[#b58a18]"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <p className="text-xs font-bold flex items-center justify-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#b58a18]" />
                      Stage name
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">Colored dot</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDisplayColorMode("tint")}
                    className={`p-3.5 rounded-xl border text-center transition ${
                      displayColorMode === "tint"
                        ? "border-[#b58a18] bg-amber-50/60 ring-2 ring-amber-200 font-bold text-[#b58a18]"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="inline-block px-2.5 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      Stage name
                    </span>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">Background tint</p>
                  </button>
                </div>
              </div>

              {/* Field 4: Stages Table Builder */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    Pipeline stages ({stages.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddStage}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#b58a18] hover:bg-[#9e7713] text-slate-950 font-black px-3.5 py-2 text-xs transition shadow-xs"
                  >
                    <Plus className="h-3.5 w-3.5 stroke-[3]" />
                    <span>Add stage</span>
                  </button>
                </div>

                <div className="overflow-visible border border-slate-200 rounded-xl bg-white">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-50 font-extrabold uppercase text-slate-500 text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-3 w-8 text-center">::</th>
                        <th className="p-3">Stage name</th>
                        <th className="p-3 w-52">
                          <span className="flex items-center gap-1">
                            Show in reports
                            <Info className="h-3 w-3 text-slate-400" />
                          </span>
                        </th>
                        <th className="p-3 w-32">
                          <span className="flex items-center gap-1">
                            Probability (%)
                            <Info className="h-3 w-3 text-slate-400" />
                          </span>
                        </th>
                        <th className="p-3 w-12 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                      {stages.map((stg, index) => (
                        <tr key={stg.id} className="hover:bg-slate-50/80">
                          {/* Drag handle */}
                          <td className="p-3 text-center text-slate-400 cursor-grab">
                            <GripVertical className="h-4 w-4 mx-auto" />
                          </td>

                          {/* Stage name + color */}
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {/* Color selector */}
                              <input
                                type="color"
                                value={stg.color || "#b58a18"}
                                onChange={(e) => handleUpdateStage(stg.id, { color: e.target.value })}
                                className="h-6 w-6 rounded border border-slate-300 cursor-pointer shrink-0"
                              />
                              <input
                                type="text"
                                value={stg.name}
                                onChange={(e) => handleUpdateStage(stg.id, { name: e.target.value })}
                                className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-[#b58a18] font-medium"
                              />
                            </div>
                          </td>

                          {/* Show in reports multi-select */}
                          <td className="p-3 relative">
                            <button
                              type="button"
                              onClick={() => setActiveReportDropdown(activeReportDropdown === stg.id ? null : stg.id)}
                              className="flex items-center justify-between w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50"
                            >
                              <div className="flex items-center gap-1 truncate">
                                {stg.showInReports.length === 0 ? (
                                  <span className="text-slate-400">None selected</span>
                                ) : (
                                  stg.showInReports.map((r) => {
                                    const opt = REPORT_OPTIONS.find((o) => o.id === r);
                                    if (!opt) return null;
                                    const Icon = opt.icon;
                                    return (
                                      <span key={r} className="p-1 rounded bg-slate-100 text-slate-700">
                                        <Icon className="h-3.5 w-3.5" />
                                      </span>
                                    );
                                  })
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 ml-1">▼</span>
                            </button>

                            {/* Dropdown Menu */}
                            {activeReportDropdown === stg.id && (
                              <div className="absolute left-3 top-full z-50 mt-1 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl animate-in fade-in">
                                {REPORT_OPTIONS.map((opt) => {
                                  const Icon = opt.icon;
                                  const isSelected = stg.showInReports.includes(opt.id);
                                  return (
                                    <button
                                      key={opt.id}
                                      type="button"
                                      onClick={() => handleToggleReportOption(stg.id, opt.id)}
                                      className="flex items-center justify-between w-full rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                                    >
                                      <div className="flex items-center gap-2">
                                        <Icon className="h-3.5 w-3.5 text-slate-500" />
                                        <span>{opt.label}</span>
                                      </div>
                                      {isSelected && <Check className="h-3.5 w-3.5 text-[#b58a18] font-bold" />}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </td>

                          {/* Probability % */}
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={stg.probability}
                                onChange={(e) =>
                                  handleUpdateStage(stg.id, { probability: Number(e.target.value) })
                                }
                                className="w-20 rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-mono text-slate-900 outline-none focus:border-[#b58a18]"
                              />
                              <span className="text-xs text-slate-500 font-bold">%</span>
                            </div>
                          </td>

                          {/* Action Trash */}
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteStage(stg.id)}
                              className="p-1 text-slate-400 hover:text-red-600 transition"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "styling" && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Custom Styling & UI Colors
              </h3>
              <p className="text-xs text-slate-500">
                Customize typography and card background colors for this pipeline view.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Font Family</label>
                  <select
                    value={styling.fontFamily}
                    onChange={(e) => setStyling({ ...styling, fontFamily: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-medium text-slate-900 outline-none"
                  >
                    <option value="Inter">Inter (Default Modern)</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Outfit">Outfit (Display)</option>
                    <option value="system-ui">System Default</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Accent / Highlight Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={styling.accentColor}
                      onChange={(e) => setStyling({ ...styling, accentColor: e.target.value })}
                      className="h-9 w-9 rounded-xl border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={styling.accentColor}
                      onChange={(e) => setStyling({ ...styling, accentColor: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Header Background Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={styling.headerBgColor}
                      onChange={(e) => setStyling({ ...styling, headerBgColor: e.target.value })}
                      className="h-9 w-9 rounded-xl border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={styling.headerBgColor}
                      onChange={(e) => setStyling({ ...styling, headerBgColor: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Card Background Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={styling.cardBgColor}
                      onChange={(e) => setStyling({ ...styling, cardBgColor: e.target.value })}
                      className="h-9 w-9 rounded-xl border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={styling.cardBgColor}
                      onChange={(e) => setStyling({ ...styling, cardBgColor: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "permissions" && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Pipeline Access Permissions
              </h3>
              <p className="text-xs text-slate-500">
                Configure which roles are allowed to view or manage deals within this pipeline.
              </p>

              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                {permissions.map((perm, idx) => {
                  const roleObj = ALL_ROLES.find((r) => r.id === perm.role);
                  return (
                    <div key={perm.role} className="flex items-center justify-between p-3.5 bg-white hover:bg-slate-50">
                      <span className="text-xs font-bold text-slate-900">
                        {roleObj?.label || perm.role}
                      </span>
                      <div className="flex items-center gap-4 text-xs font-medium">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={perm.canView}
                            onChange={(e) => {
                              const updated = [...permissions];
                              updated[idx].canView = e.target.checked;
                              setPermissions(updated);
                            }}
                            className="rounded border-slate-300 text-[#b58a18] focus:ring-[#b58a18]"
                          />
                          <span>Can View</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={perm.canEdit}
                            onChange={(e) => {
                              const updated = [...permissions];
                              updated[idx].canEdit = e.target.checked;
                              setPermissions(updated);
                            }}
                            className="rounded border-slate-300 text-[#b58a18] focus:ring-[#b58a18]"
                          />
                          <span>Can Edit</span>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-[#b58a18] hover:bg-[#9e7713] text-slate-950 font-black px-5 py-2 text-xs shadow-md transition disabled:opacity-50"
            >
              {saving ? "Saving..." : pipeline ? "Save changes" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
