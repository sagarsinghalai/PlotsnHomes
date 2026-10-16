"use client";

import { useState } from "react";
import {
  SectionDropdownConfig,
  DropdownOptionItem,
  DEFAULT_USERS_ACCOUNTS_DROPDOWNS,
} from "@/lib/site-settings";
import { updateDropdownOptionsAction } from "./actions";
import {
  ListFilter,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Search,
  Sparkles,
  UserCheck,
  ShieldCheck,
  FileCheck,
  Landmark,
  Briefcase,
  Home,
  Tag,
  Layers,
  Edit2,
  Check,
  X,
  Building2
} from "lucide-react";

export function DropdownSettingsClient({
  initialSections = [],
}: {
  initialSections?: SectionDropdownConfig[];
}) {
  // Ensure permanent default section tabs (Projects, Properties) are loaded
  const mergedSections = initialSections && initialSections.length > 0
    ? initialSections
    : DEFAULT_USERS_ACCOUNTS_DROPDOWNS;

  const [sections, setSections] = useState<SectionDropdownConfig[]>(mergedSections);
  const [activeSectionKey, setActiveSectionKey] = useState<string>(
    mergedSections.length > 0 ? mergedSections[0].sectionKey : "projects"
  );
  const [searchQuery, setSearchQuery] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Quick Add Option input state per field key
  const [quickOptionInput, setQuickOptionInput] = useState<Record<string, string>>({});

  // Inline editing state for option items
  const [editingOptionKey, setEditingOptionKey] = useState<string | null>(null); // "fieldKey:optionId"
  const [editingOptionLabel, setEditingOptionLabel] = useState<string>("");

  const activeSection = sections.find((s) => s.sectionKey === activeSectionKey);

  const filteredFields = (activeSection?.fields || []).filter(
    (field) =>
      field.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      field.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      field.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function handleSave() {
    setSaving(true);
    setSaveSuccess(false);
    setErrorMessage("");

    const res = await updateDropdownOptionsAction(sections);

    setSaving(false);
    if (res.ok) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } else {
      setErrorMessage(res.error || "Failed to save dropdown options");
    }
  }

  // Quick Add Option to Field
  function handleQuickAddOption(fieldKey: string) {
    const rawInput = quickOptionInput[fieldKey];
    if (!rawInput || !rawInput.trim()) return;

    const label = rawInput.trim();
    const value = label;

    setSections((prevSections) =>
      prevSections.map((sec) => {
        if (sec.sectionKey !== activeSectionKey) return sec;
        return {
          ...sec,
          fields: sec.fields.map((f) => {
            if (f.key !== fieldKey) return f;
            const newOpt: DropdownOptionItem = {
              id: Date.now().toString(),
              label: label,
              value: value,
              enabled: true,
            };
            return { ...f, options: [...f.options, newOpt] };
          }),
        };
      })
    );

    setQuickOptionInput((prev) => ({ ...prev, [fieldKey]: "" }));
  }

  // Start Inline Editing for Option Item
  function handleStartEditOption(fieldKey: string, opt: DropdownOptionItem) {
    setEditingOptionKey(`${fieldKey}:${opt.id}`);
    setEditingOptionLabel(opt.label);
  }

  // Save Inline Edit for Option Item
  function handleSaveEditOption(fieldKey: string, optionId: string) {
    if (!editingOptionLabel.trim()) return;

    setSections((prevSections) =>
      prevSections.map((sec) => {
        if (sec.sectionKey !== activeSectionKey) return sec;
        return {
          ...sec,
          fields: sec.fields.map((f) => {
            if (f.key !== fieldKey) return f;
            return {
              ...f,
              options: f.options.map((opt) =>
                opt.id === optionId
                  ? { ...opt, label: editingOptionLabel.trim(), value: editingOptionLabel.trim() }
                  : opt
              ),
            };
          }),
        };
      })
    );

    setEditingOptionKey(null);
    setEditingOptionLabel("");
  }

  // Delete Option Item
  function handleDeleteOption(fieldKey: string, optionId: string) {
    setSections((prevSections) =>
      prevSections.map((sec) => {
        if (sec.sectionKey !== activeSectionKey) return sec;
        return {
          ...sec,
          fields: sec.fields.map((f) => {
            if (f.key !== fieldKey) return f;
            return {
              ...f,
              options: f.options.filter((opt) => opt.id !== optionId),
            };
          }),
        };
      })
    );
  }

  // Icon Helper for Field Cards
  function getFieldIcon(key: string) {
    switch (key) {
      case "project_type":
      case "project_category":
      case "project_status":
        return Building2;
      case "user_roles":
        return UserCheck;
      case "account_statuses":
        return ShieldCheck;
      case "kyc_id_types":
        return FileCheck;
      case "loan_types":
        return Landmark;
      case "employment_statuses":
        return Briefcase;
      case "loan_property_types":
        return Home;
      case "user_tiers":
        return Tag;
      default:
        return ListFilter;
    }
  }

  return (
    <div className="space-y-5">
      {/* Sleek & Readable Header bar with save button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 px-6 rounded-xl border border-slate-200 text-slate-900 shadow-2xs">
        <div>
          <div className="flex items-center gap-1.5 text-gold-dark text-xs font-bold uppercase tracking-widest">
            <Sparkles className="h-4 w-4" />
            <span>Website Customization</span>
          </div>
          <h2 className="font-display text-lg font-bold mt-1 text-slate-900">Dropdown Options Configuration</h2>
          <p className="text-slate-600 text-xs font-medium mt-0.5">
            Full control to manage, edit, add, and reorder dropdown select choices across website features.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold hover:bg-gold-dark px-5 py-2.5 text-xs font-bold text-slate-950 shadow-2xs transition-all cursor-pointer shrink-0"
        >
          {saving ? (
            <div className="h-4 w-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>{saving ? "Saving..." : "Save Dropdown Options"}</span>
        </button>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 px-4 text-emerald-700 text-xs font-semibold shadow-2xs">
          <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-600" />
          <span>Dropdown options updated successfully! Website select menus are live.</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 px-4 text-rose-700 text-xs font-semibold shadow-2xs">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Section Tab Navigation (Clean tabs without number badges) */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs overflow-x-auto">
        <div className="flex items-center gap-2 overflow-x-auto w-full">
          {sections.map((sec) => {
            const isActive = sec.sectionKey === activeSectionKey;
            return (
              <button
                key={sec.sectionKey}
                type="button"
                onClick={() => setActiveSectionKey(sec.sectionKey)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-gold text-slate-950 shadow-2xs font-extrabold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Layers className="h-4 w-4" />
                <span>{sec.sectionTitle}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Bar for Dropdown Fields */}
      {activeSectionKey && (
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search dropdown fields..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-gold outline-none shadow-2xs"
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="space-y-4">
        {filteredFields.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 space-y-2">
            <ListFilter className="h-8 w-8 mx-auto text-slate-300" />
            <h3 className="font-bold text-sm text-slate-800">No Dropdown Fields match your search filter</h3>
          </div>
        ) : (
          filteredFields.map((field) => {
            const Icon = getFieldIcon(field.key);
            const quickInputVal = quickOptionInput[field.key] || "";

            return (
              <div
                key={field.key}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4"
              >
                {/* Field Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-gold/15 flex items-center justify-center text-gold-dark shrink-0">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <span>{field.name}</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-mono text-slate-600 border border-slate-200">
                          {field.key}
                        </span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">{field.description}</p>
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg self-start sm:self-auto">
                    {field.options.length} Options Total
                  </span>
                </div>

                {/* Add New Option Input Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <input
                    type="text"
                    placeholder="e.g. RESIDENTIAL, COMMERCIAL, LAND..."
                    value={quickInputVal}
                    onChange={(e) =>
                      setQuickOptionInput((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleQuickAddOption(field.key);
                      }
                    }}
                    className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-gold outline-none shadow-2xs"
                  />

                  <button
                    type="button"
                    onClick={() => handleQuickAddOption(field.key)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gold hover:bg-gold-dark text-slate-950 px-4 py-2 text-xs font-bold shadow-2xs transition cursor-pointer shrink-0"
                  >
                    <Plus className="h-4 w-4 stroke-[3]" />
                    <span>Add {field.name}</span>
                  </button>
                </div>

                {/* Configured Options Pill Cards Grid */}
                <div className="space-y-2 pt-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Configured Options</label>
                  {field.options.length === 0 ? (
                    <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                      No options added yet for this dropdown. Enter a name in the input box above and click "+ Add {field.name}".
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                      {field.options.map((opt) => {
                        const isEditing = editingOptionKey === `${field.key}:${opt.id}`;

                        return (
                          <div
                            key={opt.id}
                            className="rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white p-2.5 px-3.5 flex items-center justify-between shadow-2xs hover:border-slate-300 transition"
                          >
                            {isEditing ? (
                              <div className="flex items-center gap-1.5 w-full">
                                <input
                                  type="text"
                                  value={editingOptionLabel}
                                  onChange={(e) => setEditingOptionLabel(e.target.value)}
                                  className="flex-1 rounded-lg border border-amber-500 px-2 py-1 text-xs font-bold text-slate-900 outline-none uppercase"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSaveEditOption(field.key, opt.id);
                                    if (e.key === "Escape") setEditingOptionKey(null);
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditOption(field.key, opt.id)}
                                  className="p-1 text-emerald-600 hover:text-emerald-700"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingOptionKey(null)}
                                  className="p-1 text-slate-400 hover:text-slate-600"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="font-bold text-xs uppercase tracking-wide text-slate-900 truncate pr-1">
                                  {opt.label}
                                </span>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditOption(field.key, opt)}
                                    className="p-1 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                                    title="Edit Option Label"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteOption(field.key, opt.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                    title="Delete Option"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
