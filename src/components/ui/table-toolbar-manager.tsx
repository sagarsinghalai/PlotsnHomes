"use client";

import React, { useState, useMemo } from "react";
import { ChevronDown, Columns, Lock, Pencil, Plus, RotateCcw, Search, SlidersHorizontal, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColumnDef, HubSpotFieldType } from "@/hooks/use-table-columns";

export type HubSpotFieldTypeOption = {
  key: HubSpotFieldType;
  label: string;
  icon: string;
  description: string;
  category: "Text" | "Select" | "Numeric" | "Date & Time" | "Other";
};

export const HUBSPOT_FIELD_TYPES: HubSpotFieldTypeOption[] = [
  { key: "text",        label: "Single-line text",      icon: "Abc", description: "Short text string for names, titles, or tags", category: "Text" },
  { key: "textarea",    label: "Multi-line text",       icon: "📝",  description: "Long form text for notes, descriptions, or comments", category: "Text" },
  { key: "number",      label: "Number",                icon: "#",   description: "Numeric values, amounts, or counts", category: "Numeric" },
  { key: "boolean",     label: "Single checkbox",       icon: "☑️",  description: "Yes/No or true/false toggle status", category: "Select" },
  { key: "multiselect", label: "Multiple checkboxes",   icon: "☑️",  description: "Select multiple options from a set", category: "Select" },
  { key: "radio",       label: "Radio select",          icon: "🔘",  description: "Select one option from a radio list", category: "Select" },
  { key: "select",      label: "Dropdown select",       icon: "📋",  description: "Select one option from a dropdown list", category: "Select" },
  { key: "richtext",    label: "Rich text",             icon: "</>", description: "Formatted text with HTML links or styling", category: "Text" },
  { key: "phone",       label: "Phone number",          icon: "📞",  description: "Phone numbers with calling links", category: "Other" },
  { key: "date",        label: "Date picker",           icon: "📅",  description: "Date values (YYYY-MM-DD)", category: "Date & Time" },
  { key: "datetime",    label: "Date and time picker",  icon: "📆",  description: "Exact timestamp with date and time", category: "Date & Time" },
  { key: "file",        label: "File",                  icon: "📄",  description: "Upload document or file URL attachment", category: "Other" },
  { key: "url",         label: "URL",                   icon: "🔗",  description: "Web address link (https://...)", category: "Other" },
  { key: "email",       label: "Email",                 icon: "✉️",  description: "Email address with mailto links", category: "Other" },
  { key: "user",        label: "PlotnHomes user",       icon: "👤",  description: "Assignee or user selector", category: "Other" },
];

export interface TableToolbarManagerProps {
  tableTitle?: string;
  addRowLabel?: string;
  onAddRow?: () => void;
  importSlot?: React.ReactNode;
  columns: ColumnDef[];
  visibleColumnIds: string[];
  onToggleColumn: (columnId: string) => void;
  onAddCustomColumn: (label: string, fieldType?: HubSpotFieldType, options?: string[]) => void;
  onUpdateCustomColumn?: (columnId: string, updates: { label?: string; fieldType?: HubSpotFieldType; options?: string[] }) => void;
  onRemoveCustomColumn: (columnId: string) => void;
  onResetColumns: () => void;
  children?: React.ReactNode;
}

export function TableToolbarManager({
  tableTitle,
  addRowLabel = "Add Row",
  onAddRow,
  importSlot,
  columns,
  visibleColumnIds,
  onToggleColumn,
  onAddCustomColumn,
  onUpdateCustomColumn,
  onRemoveCustomColumn,
  onResetColumns,
  children,
}: TableToolbarManagerProps) {
  // Modal 1: Add Custom Column Form Modal
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  
  // Modal 2: Manage Fields & Columns Visibility Checklist Modal
  const [showManageFieldsModal, setShowManageFieldsModal] = useState(false);

  const [newColumnName, setNewColumnName] = useState("");
  const [columnSearch, setColumnSearch] = useState("");
  
  // HubSpot Field Type state
  const [selectedFieldType, setSelectedFieldType] = useState<HubSpotFieldType>("text");
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [fieldTypeSearch, setFieldTypeSearch] = useState("");
  const [customOptions, setCustomOptions] = useState("");

  // Edit existing custom column state
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editFieldType, setEditFieldType] = useState<HubSpotFieldType>("text");
  const [editOptions, setEditOptions] = useState("");
  const [showEditTypeDropdown, setShowEditTypeDropdown] = useState(false);

  // Category Accordion state (expanded/collapsed)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    "Account & contact": false,
    "Address": false,
  });

  const toggleCategoryExpand = (catName: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catName]: prev[catName] === true ? false : true,
    }));
  };

  const filteredColumns = columns.filter((col) =>
    col.label.toLowerCase().includes(columnSearch.toLowerCase())
  );

  const flatBaseColumns = useMemo(() => {
    return filteredColumns.filter((c) => !c.category && !c.isCustom);
  }, [filteredColumns]);

  const customColumnsList = useMemo(() => {
    return columns.filter((c) => c.isCustom);
  }, [columns]);

  const categoryGroups = useMemo(() => {
    const groups: Record<string, ColumnDef[]> = {};
    filteredColumns.forEach((col) => {
      if (col.category) {
        if (!groups[col.category]) groups[col.category] = [];
        groups[col.category].push(col);
      }
    });
    return groups;
  }, [filteredColumns]);

  const sortedCategories = useMemo(() => {
    const knownOrder = ["Account & contact", "Address", "Verification & Activity"];
    return Object.keys(categoryGroups).sort((a, b) => {
      const idxA = knownOrder.indexOf(a);
      const idxB = knownOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [categoryGroups]);

  const filteredFieldTypes = HUBSPOT_FIELD_TYPES.filter(
    (t) =>
      t.label.toLowerCase().includes(fieldTypeSearch.toLowerCase()) ||
      t.description.toLowerCase().includes(fieldTypeSearch.toLowerCase())
  );

  const selectedOptionObj = HUBSPOT_FIELD_TYPES.find((t) => t.key === selectedFieldType) || HUBSPOT_FIELD_TYPES[0];

  const renderColumnRow = (col: ColumnDef) => {
    const isChecked = visibleColumnIds.includes(col.id);
    const isEditingThisCol = editingColId === col.id;
    const isLocked = col.isPermanent || col.id === "userId";

    if (isEditingThisCol) {
      const editTypeObj = HUBSPOT_FIELD_TYPES.find((t) => t.key === editFieldType) || HUBSPOT_FIELD_TYPES[0];
      return (
        <div key={col.id} className="rounded-2xl border border-amber-400 dark:border-amber-600 bg-amber-50/60 dark:bg-amber-950/40 p-3 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-800 pb-1.5">
            <span className="text-xs font-extrabold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
              <Pencil className="h-3.5 w-3.5 text-amber-600" /> Edit Column: {col.label}
            </span>
            <button type="button" onClick={() => setEditingColId(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Column Name *</span>
            <Input
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              className="text-xs h-8 bg-white dark:bg-slate-900"
              required
            />
          </div>

          <div className="space-y-1 relative">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">Field type *</span>
            <button
              type="button"
              onClick={() => setShowEditTypeDropdown((prev) => !prev)}
              className="w-full flex items-center justify-between rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{editTypeObj.icon}</span>
                <span>{editTypeObj.label}</span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {showEditTypeDropdown && (
              <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-2xl space-y-1 max-h-48 overflow-y-auto">
                {HUBSPOT_FIELD_TYPES.map((tObj) => (
                  <button
                    key={tObj.key}
                    type="button"
                    onClick={() => {
                      setEditFieldType(tObj.key);
                      setShowEditTypeDropdown(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs hover:bg-amber-50 dark:hover:bg-amber-950/60"
                  >
                    <span className="font-mono font-bold text-amber-600">{tObj.icon}</span>
                    <span className="font-semibold">{tObj.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {(editFieldType === "select" || editFieldType === "radio" || editFieldType === "multiselect") && (
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Options (comma-separated)</span>
              <Input
                placeholder="e.g. Bachelors, Masters, Doctorate, High School"
                value={editOptions}
                onChange={(e) => setEditOptions(e.target.value)}
                className="text-xs h-8 bg-white dark:bg-slate-900"
              />
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              variant="gold"
              className="flex-1 text-xs font-bold"
              onClick={() => {
                if (editLabel.trim()) {
                  const parsedOpts = editOptions
                    ? editOptions.split(",").map((s) => s.trim()).filter(Boolean)
                    : undefined;
                  if (onUpdateCustomColumn) {
                    onUpdateCustomColumn(col.id, {
                      label: editLabel.trim(),
                      fieldType: editFieldType,
                      options: parsedOpts,
                    });
                  }
                  setEditingColId(null);
                }
              }}
            >
              Save Changes
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="text-xs font-semibold"
              onClick={() => setEditingColId(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div
        key={col.id}
        className="flex items-center justify-between rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
      >
        <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer flex-1 select-none">
          <input
            type="checkbox"
            checked={isChecked || isLocked}
            disabled={isLocked}
            onChange={() => !isLocked && onToggleColumn(col.id)}
            className={`rounded border-slate-300 text-gold focus:ring-gold ${isLocked ? "opacity-60 cursor-not-allowed" : ""}`}
          />
          <span>{col.label}</span>
          {isLocked && (
            <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded font-mono inline-flex items-center gap-0.5">
              <Lock className="h-2.5 w-2.5" /> Permanent
            </span>
          )}
          {col.isCustom && (
            <span className="text-[10px] bg-gold/15 text-amber-800 dark:text-gold px-1.5 py-0.2 rounded font-mono">
              {col.fieldType ? col.fieldType.toUpperCase() : "CUSTOM"}
            </span>
          )}
        </label>

        {col.isCustom && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setEditingColId(col.id);
                setEditLabel(col.label);
                setEditFieldType(col.fieldType || "text");
                setEditOptions((col.options || []).join(", "));
                setShowEditTypeDropdown(false);
              }}
              className="text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 transition"
              title="Edit column settings"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onRemoveCustomColumn(col.id)}
              className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition"
              title="Remove custom column"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  };

  const handleCreateCustomColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (newColumnName.trim()) {
      const parsedOptions = customOptions
        ? customOptions.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined;
      onAddCustomColumn(newColumnName.trim(), selectedFieldType, parsedOptions);
      setNewColumnName("");
      setCustomOptions("");
      setSelectedFieldType("text");
      setShowTypeDropdown(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      {/* Title & Custom Actions */}
      <div className="flex items-center gap-3">
        {tableTitle && (
          <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            {tableTitle}
          </h3>
        )}
        {children}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5 ml-auto">
        {/* Hidden Trigger for external invocation */}
        <button
          type="button"
          data-manage-fields-btn
          onClick={() => setShowManageFieldsModal(true)}
          className="hidden"
          aria-hidden="true"
        />

        {/* 1. Manage fields Button (Modal 2: Columns Visibility Checklist) */}
        <Button
          type="button"
          variant="secondary"
          onClick={() => setShowManageFieldsModal(true)}
          className="gap-1.5 shadow-xs text-xs font-extrabold border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <SlidersHorizontal className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span>Manage fields</span>
        </Button>

        {/* 2. + Add Column Button (Modal 1: Add Custom Column Field) */}
        <Button
          type="button"
          variant="secondary"
          onClick={() => setShowAddCustomModal(true)}
          className="gap-1.5 shadow-xs text-xs font-extrabold border-amber-300 dark:border-amber-700 bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50"
        >
          <Columns className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span>+ Add Column</span>
        </Button>

        {/* Import slot (e.g. bulk import) — sits to the LEFT of Add Row */}
        {importSlot}

        {/* + Add Row Button */}
        {onAddRow && (
          <Button
            type="button"
            variant="secondary"
            onClick={onAddRow}
            className="gap-1.5 shadow-sm text-xs font-extrabold"
          >
            <Plus className="h-4 w-4" />
            <span>{addRowLabel}</span>
          </Button>
        )}
      </div>

      {/* MODAL 1: Add Custom Field Column Modal */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-gold" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Add Custom Field Column
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Create Custom Column Form */}
            <form onSubmit={handleCreateCustomColumn} className="space-y-3">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Column Name *</span>
                <Input
                  placeholder="e.g. Contract Value, Notes, Tag"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              {/* HubSpot Field Type Selector Dropdown */}
              <div className="space-y-1 relative">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">Field type *</span>
                <button
                  type="button"
                  onClick={() => setShowTypeDropdown((prev) => !prev)}
                  className="w-full flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{selectedOptionObj.icon}</span>
                    <span>{selectedOptionObj.label}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>

                {showTypeDropdown && (
                  <div className="absolute left-0 right-0 bottom-full mb-1 z-50 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-2xl space-y-2 max-h-64 overflow-y-auto">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Filter field types..."
                        value={fieldTypeSearch}
                        onChange={(e) => setFieldTypeSearch(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-8 pr-2 py-1 text-xs outline-none focus:border-gold"
                      />
                    </div>

                    <div className="space-y-1">
                      {filteredFieldTypes.map((tObj) => (
                        <button
                          key={tObj.key}
                          type="button"
                          onClick={() => {
                            setSelectedFieldType(tObj.key);
                            setShowTypeDropdown(false);
                          }}
                          className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl text-left transition ${
                            selectedFieldType === tObj.key
                              ? "bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm mt-0.5">{tObj.icon}</span>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{tObj.label}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{tObj.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Options input for select/radio/multiselect */}
              {(selectedFieldType === "select" || selectedFieldType === "radio" || selectedFieldType === "multiselect") && (
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Options (comma-separated)</span>
                  <Input
                    placeholder="e.g. Bachelors, Masters, Doctorate, High School"
                    value={customOptions}
                    onChange={(e) => setCustomOptions(e.target.value)}
                    className="text-xs"
                  />
                </div>
              )}

              <Button
                type="submit"
                variant="gold"
                className="w-full text-xs font-bold shadow-sm"
              >
                Add Field Column
              </Button>
            </form>

            {/* List of existing custom fields */}
            {customColumnsList.length > 0 && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
                  Existing Custom Fields ({customColumnsList.length})
                </span>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {customColumnsList.map((col) => renderColumnRow(col))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="gold"
                size="sm"
                onClick={() => setShowAddCustomModal(false)}
                className="font-bold"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Manage Table Columns & Profile Fields Checklist Modal */}
      {showManageFieldsModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-gold" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Manage Table Columns & Fields
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowManageFieldsModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Column Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search columns..."
                value={columnSearch}
                onChange={(e) => setColumnSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-gold"
              />
            </div>

            {/* Columns Checklist (1st and 2nd Screenshot Part) */}
            <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
              {/* 1. Base / Permanent / Flat Columns */}
              {flatBaseColumns.map((col) => renderColumnRow(col))}

              {/* 2. Categorized Section Heads (Account & contact, Address) */}
              {sortedCategories.map((catName) => {
                const catCols = categoryGroups[catName];
                if (!catCols || catCols.length === 0) return null;
                const visibleInCat = catCols.filter((c) => visibleColumnIds.includes(c.id)).length;
                const isAllChecked = catCols.length > 0 && catCols.every((c) => visibleColumnIds.includes(c.id));
                const isExpanded = expandedCategories[catName] === true;

                return (
                  <div
                    key={catName}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs"
                  >
                    {/* Category Head Header Bar */}
                    <div className="flex items-center justify-between px-3 py-2 bg-amber-50/60 dark:bg-amber-950/30 border-b border-slate-200/80 dark:border-slate-800">
                      <label className="flex items-center gap-2 text-xs font-extrabold text-slate-900 dark:text-white cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isAllChecked}
                          onChange={() => {
                            if (isAllChecked) {
                              catCols.forEach((col) => {
                                if (visibleColumnIds.includes(col.id)) onToggleColumn(col.id);
                              });
                            } else {
                              catCols.forEach((col) => {
                                if (!visibleColumnIds.includes(col.id)) onToggleColumn(col.id);
                              });
                            }
                          }}
                          className="rounded border-slate-300 text-gold focus:ring-gold"
                        />
                        <span>{catName}</span>
                        <span className="text-[10px] font-mono font-bold text-amber-800 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-900/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                          {visibleInCat}/{catCols.length} shown
                        </span>
                      </label>

                      <button
                        type="button"
                        onClick={() => toggleCategoryExpand(catName)}
                        className="flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:text-amber-900 px-2 py-0.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50 transition"
                      >
                        <span>{isExpanded ? "Hide" : "Show sub-fields"}</span>
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </button>
                    </div>

                    {/* Dropdown Sub-fields List */}
                    {isExpanded && (
                      <div className="p-2 space-y-1.5 bg-slate-50/50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800">
                        {catCols.map((col) => renderColumnRow(col))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onResetColumns}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Defaults
              </button>
              <Button
                type="button"
                variant="gold"
                size="sm"
                onClick={() => setShowManageFieldsModal(false)}
                className="font-bold"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
