"use client";

import { useState } from "react";
import {
  Braces,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  FolderPlus,
  Globe,
  Loader2,
  Mail,
  MessageCircle,
  MoreVertical,
  Plus,
  Search,
  Sliders,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import type { GlobalCustomVariable, SystemVariable } from "@/lib/variables-store";
import type { MessageTemplate } from "@/lib/crm-template-utils";

type Props = {
  initialSystemVariables: SystemVariable[];
  initialGlobalCustomVariables: GlobalCustomVariable[];
  initialTemplates: MessageTemplate[];
};

export function VariablesTemplatesClient({
  initialSystemVariables,
  initialGlobalCustomVariables,
  initialTemplates,
}: Props) {
  const [mainTab, setMainTab] = useState<"variables" | "templates">("variables");

  // Variables Sub-Tab: system vs global
  const [varSubTab, setVarSubTab] = useState<"system" | "global">("system");

  // Templates Sub-Tab: whatsapp vs email
  const [templateSubTab, setTemplateSubTab] = useState<"whatsapp" | "email">("whatsapp");

  // State
  const [systemVariables, setSystemVariables] = useState<SystemVariable[]>(initialSystemVariables);
  const [globalVariables, setGlobalVariables] = useState<GlobalCustomVariable[]>(initialGlobalCustomVariables);
  const [templates, setTemplates] = useState<MessageTemplate[]>(initialTemplates);

  // Search filter for Global Custom Variables
  const [globalSearch, setGlobalSearch] = useState("");
  const [globalFolderFilter, setGlobalFolderFilter] = useState("all");

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Loading States
  const [saving, setSaving] = useState(false);

  // Modals State
  const [isAddSystemVarOpen, setIsAddSystemVarOpen] = useState(false);
  const [newSystemVar, setNewSystemVar] = useState({ key: "", label: "", mappedField: "", description: "" });

  const [isAddGlobalVarOpen, setIsAddGlobalVarOpen] = useState(false);
  const [editingGlobalVar, setEditingGlobalVar] = useState<GlobalCustomVariable | null>(null);
  const [globalVarForm, setGlobalVarForm] = useState({ name: "", folder: "General", key: "", value: "" });

  // Template Form State (WhatsApp / Email)
  const [waForm, setWaForm] = useState({
    id: "",
    name: "",
    templateType: "Text Template",
    body: "",
  });

  const [emailForm, setEmailForm] = useState({
    id: "",
    name: "",
    subject: "",
    body: "",
  });

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    showToast(`Copied ${text} to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  // ─── SYSTEM VARIABLES HANDLERS ─────────────────────────────────────────────

  async function handleAddSystemVar() {
    if (!newSystemVar.label || !newSystemVar.mappedField) return;
    let keyFormatted = newSystemVar.key.trim();
    if (!keyFormatted.startsWith("{{")) keyFormatted = `{{${keyFormatted}`;
    if (!keyFormatted.endsWith("}}")) keyFormatted = `${keyFormatted}}`;

    const newItem: SystemVariable = {
      key: keyFormatted,
      label: newSystemVar.label.trim(),
      mappedField: newSystemVar.mappedField.trim(),
      description: newSystemVar.description.trim(),
      isSystem: false,
    };

    const updated = [...systemVariables, newItem];
    setSystemVariables(updated);
    setIsAddSystemVarOpen(false);
    setNewSystemVar({ key: "", label: "", mappedField: "", description: "" });

    try {
      await fetch("/api/admin/variables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemVariables: updated }),
      });
      showToast("System variable mapped and synced to WhatsApp Hub!");
    } catch {
      showToast("Failed to save system variable.");
    }
  }

  // ─── GLOBAL CUSTOM VARIABLES HANDLERS ──────────────────────────────────────

  function openAddGlobalVarModal(item?: GlobalCustomVariable) {
    if (item) {
      setEditingGlobalVar(item);
      setGlobalVarForm({ name: item.name, folder: item.folder || "General", key: item.key, value: item.value });
    } else {
      setEditingGlobalVar(null);
      setGlobalVarForm({ name: "", folder: "General", key: "", value: "" });
    }
    setIsAddGlobalVarOpen(true);
  }

  async function handleSaveGlobalVar() {
    if (!globalVarForm.name) return;

    let keyFormatted = globalVarForm.key.trim();
    if (!keyFormatted) {
      const slug = globalVarForm.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
      keyFormatted = `{{custom_values.${slug}}}`;
    } else {
      if (!keyFormatted.startsWith("{{")) keyFormatted = `{{${keyFormatted}`;
      if (!keyFormatted.endsWith("}}")) keyFormatted = `${keyFormatted}}`;
    }

    let updated: GlobalCustomVariable[];
    if (editingGlobalVar) {
      updated = globalVariables.map((g) =>
        g.id === editingGlobalVar.id
          ? { ...g, name: globalVarForm.name, folder: globalVarForm.folder, key: keyFormatted, value: globalVarForm.value }
          : g
      );
    } else {
      const newItem: GlobalCustomVariable = {
        id: `gcv-${Date.now()}`,
        name: globalVarForm.name,
        folder: globalVarForm.folder || "General",
        key: keyFormatted,
        value: globalVarForm.value,
        createdAt: new Date().toISOString(),
      };
      updated = [newItem, ...globalVariables];
    }

    setGlobalVariables(updated);
    setIsAddGlobalVarOpen(false);

    try {
      await fetch("/api/admin/variables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ globalCustomVariables: updated }),
      });
      showToast("Global custom variable saved!");
    } catch {
      showToast("Failed to save global custom variable.");
    }
  }

  async function handleDeleteGlobalVar(id: string) {
    const updated = globalVariables.filter((g) => g.id !== id);
    setGlobalVariables(updated);

    try {
      await fetch("/api/admin/variables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ globalCustomVariables: updated }),
      });
      showToast("Global custom variable deleted.");
    } catch {
      showToast("Failed to delete variable.");
    }
  }

  // ─── TEMPLATES HANDLERS ──────────────────────────────────────────────────

  async function handleSaveWaTemplate() {
    if (!waForm.name || !waForm.body) {
      showToast("Please fill in template name and message body.");
      return;
    }

    setSaving(true);
    const templateObj: MessageTemplate = {
      id: waForm.id || `tpl-wa-${Date.now()}`,
      name: waForm.name,
      channel: "whatsapp",
      templateType: waForm.templateType,
      body: waForm.body,
    };

    try {
      const res = await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: templateObj }),
      });

      const data = await res.json();
      if (data.templates) setTemplates(data.templates);
      setWaForm({ id: "", name: "", templateType: "Text Template", body: "" });
      showToast("WhatsApp Template saved! Available in WhatsApp Hub.");
    } catch {
      showToast("Failed to save template.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEmailTemplate() {
    if (!emailForm.name || !emailForm.body) {
      showToast("Please fill in template name and email body.");
      return;
    }

    setSaving(true);
    const templateObj: MessageTemplate = {
      id: emailForm.id || `tpl-email-${Date.now()}`,
      name: emailForm.name,
      channel: "email",
      subject: emailForm.subject || "No Subject",
      body: emailForm.body,
    };

    try {
      const res = await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: templateObj }),
      });

      const data = await res.json();
      if (data.templates) setTemplates(data.templates);
      setEmailForm({ id: "", name: "", subject: "", body: "" });
      showToast("Email Template saved! Available in Email Compose dropdown.");
    } catch {
      showToast("Failed to save email template.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTemplate(id: string) {
    try {
      const res = await fetch(`/api/admin/templates?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.templates) setTemplates(data.templates);
      showToast("Template deleted.");
    } catch {
      showToast("Failed to delete template.");
    }
  }

  // Filtered lists
  const filteredGlobalVars = globalVariables.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
      g.key.toLowerCase().includes(globalSearch.toLowerCase()) ||
      (g.value && g.value.toLowerCase().includes(globalSearch.toLowerCase()));
    const matchesFolder = globalFolderFilter === "all" || g.folder === globalFolderFilter;
    return matchesSearch && matchesFolder;
  });

  const availableFolders = Array.from(new Set(globalVariables.map((g) => g.folder || "General")));

  const waTemplates = templates.filter((t) => t.channel === "whatsapp");
  const emailTemplates = templates.filter((t) => t.channel === "email");

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-white pb-16">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-3 shadow-2xl text-xs font-semibold border border-brand/40 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="h-4 w-4 text-brand" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1
            className="text-3xl sm:text-4xl text-slate-950 dark:text-white tracking-tight leading-tight"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontWeight: 400,
              textTransform: "none",
            }}
          >
            System Variables &amp; Templates
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage mapped software system variables, global custom variables, WhatsApp templates, and Email templates.
          </p>
        </div>

        {/* PRIMARY TAB SELECTOR */}
        <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 text-xs font-bold self-start sm:self-auto">
          <button
            onClick={() => setMainTab("variables")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              mainTab === "variables"
                ? "bg-brand text-white shadow-md font-extrabold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Braces className="h-4 w-4" />
            <span>1. Variables</span>
          </button>
          <button
            onClick={() => setMainTab("templates")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              mainTab === "templates"
                ? "bg-brand text-white shadow-md font-extrabold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Mail className="h-4 w-4" />
            <span>2. Templates</span>
          </button>
        </div>
      </div>

      {/* ─── TAB 1: VARIABLES MANAGEMENT ────────────────────────────────────────── */}
      {mainTab === "variables" && (
        <div className="space-y-6">
          {/* Sub-Tab Selector: System Variables vs Global Custom Variables */}
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <button
              onClick={() => setVarSubTab("system")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                varSubTab === "system"
                  ? "bg-slate-950 text-white dark:bg-slate-800 border border-slate-700 shadow"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-brand" />
              <span>Section 1: System Variables</span>
            </button>

            <button
              onClick={() => setVarSubTab("global")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                varSubTab === "global"
                  ? "bg-slate-950 text-white dark:bg-slate-800 border border-slate-700 shadow"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              <Globe className="h-3.5 w-3.5 text-brand" />
              <span>Section 2: Global Custom Variables</span>
            </button>
          </div>

          {/* SUB-SECTION 1.1: SYSTEM VARIABLES (SCREENSHOT 1 MATCHING) */}
          {varSubTab === "system" && (
            <div className="space-y-6 max-w-4xl">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">System Variables</h2>
                    <Sparkles className="h-4 w-4 text-brand" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Click any variable to copy to clipboard, then paste it in your template body text.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddSystemVarOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-extrabold shadow transition cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Map New Field</span>
                </button>
              </div>

              {/* GRID OF SYSTEM VARIABLE CARDS (EXACT MATCHING SS 1) */}
              <div className="grid gap-3 sm:grid-cols-2">
                {systemVariables.map((v) => (
                  <div
                    key={v.key}
                    onClick={() => handleCopy(v.key)}
                    className="group relative flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/60 p-4 hover:border-brand/50 hover:bg-white dark:hover:bg-slate-900 transition-all cursor-pointer shadow-xs"
                  >
                    <div>
                      <div className="font-mono text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand transition-colors">
                        {v.key}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                        {v.label}
                      </div>
                      {v.mappedField && (
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                          <span className="font-semibold text-brand">Mapped to:</span> {v.mappedField}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Copy variable key"
                    >
                      {copiedKey === v.key ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUB-SECTION 1.2: GLOBAL CUSTOM VARIABLES */}
          {varSubTab === "global" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Custom values</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Add, edit and delete your custom values.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openAddGlobalVarModal()}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-extrabold shadow-md transition cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>+ Add custom value</span>
                  </button>
                </div>
              </div>

              {/* SEARCH BAR */}
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="text-sm font-extrabold text-brand font-mono tracking-wide">
                  General
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    placeholder="Search values or keys..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-10 pr-4 py-2 text-xs outline-none focus:border-brand font-medium"
                  />
                </div>
              </div>

              {/* TABLE MATCHING SCREENSHOT 2 */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="p-3.5 w-10 text-center">
                          <input type="checkbox" className="rounded border-slate-300" />
                        </th>
                        <th className="p-3.5">🏷️ Name</th>
                        <th className="p-3.5">📁 Folder</th>
                        <th className="p-3.5">🔑 Key</th>
                        <th className="p-3.5">T Value</th>
                        <th className="p-3.5 w-16 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                      {filteredGlobalVars.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            No custom variables found.
                          </td>
                        </tr>
                      ) : (
                        filteredGlobalVars.map((row) => (
                          <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition">
                            <td className="p-3.5 text-center">
                              <input type="checkbox" className="rounded border-slate-300" />
                            </td>
                            <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                              {row.name}
                            </td>
                            <td className="p-3.5 text-slate-500">
                              {row.folder || "—"}
                            </td>
                            <td className="p-3.5 font-mono text-slate-800 dark:text-slate-200">
                              <div className="flex items-center gap-1.5">
                                <span>{row.key}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(row.key)}
                                  className="p-1 text-slate-400 hover:text-brand"
                                  title="Copy key"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                              </div>
                            </td>
                            <td className="p-3.5 text-slate-600 dark:text-slate-300">
                              {row.value || "—"}
                            </td>
                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => openAddGlobalVarModal(row)}
                                  className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteGlobalVar(row.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span>Showing {filteredGlobalVars.length} values</span>
                  <div className="flex items-center gap-2">
                    <span>Rows per page 20</span>
                    <span className="font-bold text-slate-900 dark:text-white">1</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: TEMPLATES MANAGEMENT ────────────────────────────────────────── */}
      {mainTab === "templates" && (
        <div className="space-y-6">
          {/* Sub-Tab Selector: WhatsApp Templates vs Email Templates */}
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <button
              onClick={() => setTemplateSubTab("whatsapp")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                templateSubTab === "whatsapp"
                  ? "bg-slate-950 text-white dark:bg-slate-800 border border-slate-700 shadow"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
              <span>WhatsApp Templates ({waTemplates.length})</span>
            </button>

            <button
              onClick={() => setTemplateSubTab("email")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                templateSubTab === "email"
                  ? "bg-slate-950 text-white dark:bg-slate-800 border border-slate-700 shadow"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              <Mail className="h-3.5 w-3.5 text-sky-500" />
              <span>Email Templates ({emailTemplates.length})</span>
            </button>
          </div>

          {/* SUB-HEAD 2.1: WHATSAPP TEMPLATES BUILDER (SCREENSHOT 3 MATCHING) */}
          {templateSubTab === "whatsapp" && (
            <div className="grid gap-8 lg:grid-cols-12 items-start">
              {/* Left Form: Matching Screenshot 3 */}
              <div className="lg:col-span-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-xl space-y-5">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Template Config</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Template Name *
                    </label>
                    <input
                      type="text"
                      value={waForm.name}
                      onChange={(e) => setWaForm({ ...waForm, name: e.target.value })}
                      placeholder="Welcome — new lead"
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-xs outline-none focus:border-brand font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Template Type *
                    </label>
                    <select
                      value={waForm.templateType}
                      onChange={(e) => setWaForm({ ...waForm, templateType: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-xs outline-none focus:border-brand font-medium cursor-pointer"
                    >
                      <option value="Text Template">Text Template</option>
                      <option value="Header + Media Template">Header + Media Template</option>
                      <option value="Button CTA Template">Button CTA Template</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Message Body Text
                      </label>
                      <span className="text-[10px] text-slate-400">Click variable to insert</span>
                    </div>

                    {/* VARIABLE QUICK INSERT PILLS */}
                    <div className="space-y-2.5 mb-3">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                          System Variables:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {systemVariables.map((v) => (
                            <button
                              key={v.key}
                              type="button"
                              onClick={() => setWaForm({ ...waForm, body: `${waForm.body} ${v.key}` })}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 text-[10px] font-mono text-brand border border-brand/30 hover:bg-brand/15 transition cursor-pointer"
                            >
                              + {v.key}
                            </button>
                          ))}
                        </div>
                      </div>

                      {globalVariables.length > 0 && (
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                            Global Custom Variables:
                          </span>
                          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                            {globalVariables.map((g) => (
                              <button
                                key={g.id}
                                type="button"
                                onClick={() => setWaForm({ ...waForm, body: `${waForm.body} ${g.key}` })}
                                className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-slate-900 text-[10px] font-mono text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/15 transition cursor-pointer"
                              >
                                + {g.key}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <textarea
                      rows={5}
                      value={waForm.body}
                      onChange={(e) => setWaForm({ ...waForm, body: e.target.value })}
                      placeholder="Hi {{name}}, thanks for your interest in {{property}}. I'm your BrickVest advisor — when is a good time for a quick call?"
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4 text-xs outline-none focus:border-brand font-medium leading-relaxed"
                    />
                  </div>

                  {/* SAVE BUTTON MATCHING SS 3 GOLD/AMBER PILL */}
                  <button
                    onClick={handleSaveWaTemplate}
                    disabled={saving}
                    className="w-full py-3.5 rounded-2xl bg-brand hover:bg-brand-hover text-white font-extrabold text-sm shadow-lg shadow-brand/20 transition cursor-pointer disabled:opacity-50"
                  >
                    {saving ? "Saving Template..." : "Save Templates"}
                  </button>
                </div>
              </div>

              {/* Right Side: List of Saved WhatsApp Templates */}
              <div className="lg:col-span-7 space-y-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Saved WhatsApp Templates ({waTemplates.length})
                </h4>

                <div className="space-y-3">
                  {waTemplates.map((t) => (
                    <div
                      key={t.id}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 p-4 space-y-2 hover:border-brand/50 transition shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4 text-emerald-500" />
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {t.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setWaForm({
                                id: t.id,
                                name: t.name,
                                templateType: t.templateType || "Text Template",
                                body: t.body,
                              })
                            }
                            className="text-xs text-brand font-bold hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(t.id)}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
                        {t.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SUB-HEAD 2.2: EMAIL TEMPLATES BUILDER (SCREENSHOT 4 SYNC MATCHING) */}
          {templateSubTab === "email" && (
            <div className="grid gap-8 lg:grid-cols-12 items-start">
              {/* Left Form: Email Template Builder */}
              <div className="lg:col-span-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-xl space-y-5">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Email Template Config</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Template Name *
                    </label>
                    <input
                      type="text"
                      value={emailForm.name}
                      onChange={(e) => setEmailForm({ ...emailForm, name: e.target.value })}
                      placeholder="Property Brochure & Investment Details"
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-xs outline-none focus:border-brand font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Subject Line *
                    </label>
                    <input
                      type="text"
                      value={emailForm.subject}
                      onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                      placeholder="Exclusive Opportunity: {{property}} for {{name}}"
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-xs outline-none focus:border-brand font-medium"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Email Body Text / HTML
                      </label>
                      <span className="text-[10px] text-slate-400">Click variable to insert</span>
                    </div>

                    {/* VARIABLE QUICK INSERT PILLS */}
                    <div className="space-y-2.5 mb-3">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                          System Variables:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {systemVariables.map((v) => (
                            <button
                              key={v.key}
                              type="button"
                              onClick={() => setEmailForm({ ...emailForm, body: `${emailForm.body} ${v.key}` })}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 text-[10px] font-mono text-brand border border-brand/30 hover:bg-brand/15 transition cursor-pointer"
                            >
                              + {v.key}
                            </button>
                          ))}
                        </div>
                      </div>

                      {globalVariables.length > 0 && (
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                            Global Custom Variables:
                          </span>
                          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                            {globalVariables.map((g) => (
                              <button
                                key={g.id}
                                type="button"
                                onClick={() => setEmailForm({ ...emailForm, body: `${emailForm.body} ${g.key}` })}
                                className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-slate-900 text-[10px] font-mono text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/15 transition cursor-pointer"
                              >
                                + {g.key}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <textarea
                      rows={6}
                      value={emailForm.body}
                      onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
                      placeholder={"Hi {{name}},\n\nThank you for exploring {{property}}. Attached is the project prospectus and ROI layout details.\n\nBest regards,\nPlotsnHomes Team"}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4 text-xs outline-none focus:border-brand font-medium leading-relaxed"
                    />
                  </div>

                  <button
                    onClick={handleSaveEmailTemplate}
                    disabled={saving}
                    className="w-full py-3.5 rounded-2xl bg-brand hover:bg-brand-hover text-white font-extrabold text-sm shadow-lg shadow-brand/20 transition cursor-pointer disabled:opacity-50"
                  >
                    {saving ? "Saving Email Template..." : "Save Email Template"}
                  </button>
                </div>
              </div>

              {/* Right Side: List of Saved Email Templates */}
              <div className="lg:col-span-7 space-y-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Saved Email Templates ({emailTemplates.length})
                </h4>

                <div className="space-y-3">
                  {emailTemplates.map((t) => (
                    <div
                      key={t.id}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 p-4 space-y-2 hover:border-brand/50 transition shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-sky-500" />
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {t.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setEmailForm({
                                id: t.id,
                                name: t.name,
                                subject: t.subject || "",
                                body: t.body,
                              })
                            }
                            className="text-xs text-brand font-bold hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(t.id)}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {t.subject && (
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Subject: {t.subject}
                        </div>
                      )}

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 whitespace-pre-line">
                        {t.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL 1: ADD SYSTEM VARIABLE MAPPING ──────────────────────────────── */}
      {isAddSystemVarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 sm:p-8 shadow-2xl space-y-5 text-slate-900 dark:text-white">
            <div>
              <h3 className="text-xl font-extrabold text-slate-950 dark:text-white">Map New System Variable</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Assign a database field to a reusable system variable (e.g. {"{{user_role}}"}).
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1.5">Variable Tag Key *</label>
                <input
                  type="text"
                  value={newSystemVar.key}
                  onChange={(e) => setNewSystemVar({ ...newSystemVar, key: e.target.value })}
                  placeholder="{{user_role}}"
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 outline-none focus:border-brand font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1.5">Display Label *</label>
                <input
                  type="text"
                  value={newSystemVar.label}
                  onChange={(e) => setNewSystemVar({ ...newSystemVar, label: e.target.value })}
                  placeholder="User Role"
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 outline-none focus:border-brand text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1.5">Map to Software Field *</label>
                <select
                  value={newSystemVar.mappedField}
                  onChange={(e) => setNewSystemVar({ ...newSystemVar, mappedField: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 outline-none focus:border-brand font-medium cursor-pointer text-slate-900 dark:text-white"
                >
                  <option value="">-- Select Field --</option>
                  <option value="User.name">User.name (Account Name)</option>
                  <option value="User.phone">User.phone (Mobile Number)</option>
                  <option value="User.email">User.email (Email Address)</option>
                  <option value="Property.title">Property.title (Property Name)</option>
                  <option value="Property.price">Property.price (Property Cost)</option>
                  <option value="Property.city">Property.city (City / Location)</option>
                  <option value="Inquiry.message">Inquiry.message (Client Inquiry)</option>
                  <option value="Showing.date">Showing.date (Site Visit Date)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1.5">Description</label>
                <input
                  type="text"
                  value={newSystemVar.description}
                  onChange={(e) => setNewSystemVar({ ...newSystemVar, description: e.target.value })}
                  placeholder="Optional explanatory note"
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 outline-none focus:border-brand text-slate-900 dark:text-white font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsAddSystemVarOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSystemVar}
                className="px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-extrabold shadow-md shadow-brand/20 transition cursor-pointer"
              >
                Save Variable
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: ADD/EDIT GLOBAL CUSTOM VARIABLE (SCREENSHOT 2 MATCHING) ─── */}
      {isAddGlobalVarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 sm:p-8 shadow-2xl space-y-5 text-slate-900 dark:text-white">
            <div>
              <h3 className="text-xl font-extrabold text-slate-950 dark:text-white">
                {editingGlobalVar ? "Edit Custom Value" : "Add Custom Value"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Create or edit a custom variable tag and assign its value.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1.5">Name *</label>
                <input
                  type="text"
                  value={globalVarForm.name}
                  onChange={(e) => setGlobalVarForm({ ...globalVarForm, name: e.target.value })}
                  placeholder="Office Working Hours"
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 outline-none focus:border-brand text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1.5">Folder</label>
                <input
                  type="text"
                  value={globalVarForm.folder}
                  onChange={(e) => setGlobalVarForm({ ...globalVarForm, folder: e.target.value })}
                  placeholder="General"
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 outline-none focus:border-brand text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1.5">
                  Key (Auto-generated if left blank)
                </label>
                <input
                  type="text"
                  value={globalVarForm.key}
                  onChange={(e) => setGlobalVarForm({ ...globalVarForm, key: e.target.value })}
                  placeholder="{{custom_values.office_working_hours}}"
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 outline-none focus:border-brand font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1.5">Value</label>
                <textarea
                  rows={3}
                  value={globalVarForm.value}
                  onChange={(e) => setGlobalVarForm({ ...globalVarForm, value: e.target.value })}
                  placeholder="9:30 AM - 6:30 PM (Mon-Sat)"
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4 outline-none focus:border-brand text-slate-900 dark:text-white font-medium leading-relaxed"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsAddGlobalVarOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGlobalVar}
                className="px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-extrabold shadow-md shadow-brand/20 transition cursor-pointer"
              >
                Save Value
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
