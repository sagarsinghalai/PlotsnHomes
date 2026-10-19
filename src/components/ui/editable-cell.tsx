"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Check, Clock, Edit2, ExternalLink, Mail, Phone, User, FileText, CheckSquare, X, ChevronDown } from "lucide-react";
import { HubSpotFieldType } from "@/hooks/use-table-columns";

interface EditableCellProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  fieldType?: HubSpotFieldType;
  options?: string[];
}

export function EditableCell({
  value,
  onChange,
  placeholder = "+ Enter value...",
  className = "",
  fieldType = "text",
  options = [],
}: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value || "");

  useEffect(() => {
    setTempValue(value || "");
  }, [value]);

  const handleSave = (valToSave?: string) => {
    const finalVal = (valToSave !== undefined ? valToSave : tempValue).trim();
    onChange(finalVal);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && fieldType !== "textarea" && fieldType !== "richtext") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setTempValue(value || "");
      setEditing(false);
    }
  };

  // 1. Special Boolean / Single Checkbox Toggle
  if (fieldType === "boolean") {
    const isChecked = value.toLowerCase() === "true" || value.toLowerCase() === "yes" || value === "1";
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onChange(isChecked ? "false" : "true");
        }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition shadow-2xs ${
          isChecked
            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
        }`}
      >
        {isChecked ? <Check className="h-3 w-3 text-emerald-600" /> : <X className="h-3 w-3 text-slate-400" />}
        <span>{isChecked ? "Yes" : "No"}</span>
      </button>
    );
  }

  // 2. Multiselect (Multiple Checkboxes) Field Type
  if (fieldType === "multiselect") {
    const selectedList = value
      ? value.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const defaultOptList = options.length > 0
      ? options
      : placeholder.toLowerCase().includes("education")
      ? ["High School", "Bachelors", "Masters", "Doctorate", "Diploma", "Other"]
      : ["Option A", "Option B", "Option C", "Option D"];

    if (editing) {
      return (
        <div
          className="relative z-50 p-3 rounded-2xl border border-amber-400 dark:border-amber-600 bg-white dark:bg-slate-900 shadow-2xl space-y-2 min-w-[210px]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Multiple Checkboxes
            </span>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1 py-1 pr-1">
            {defaultOptList.map((opt) => {
              const isChecked = selectedList.includes(opt);
              return (
                <label
                  key={opt}
                  className="flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      const next = isChecked
                        ? selectedList.filter((x) => x !== opt)
                        : [...selectedList, opt];
                      const newStr = next.join(", ");
                      setTempValue(newStr);
                      onChange(newStr);
                    }}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span>{opt}</span>
                </label>
              );
            })}
          </div>

          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-mono">
              {selectedList.length} selected
            </span>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-3 py-1 rounded-lg bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-xs"
            >
              Done
            </button>
          </div>
        </div>
      );
    }

    if (selectedList.length === 0) {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
          className={`inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full transition ${className}`}
        >
          <span className="truncate">{placeholder}</span>
        </button>
      );
    }

    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
        className="group/cell inline-flex flex-wrap items-center gap-1 cursor-pointer py-0.5"
        title="Click to edit (MULTIPLE CHECKBOXES)"
      >
        {selectedList.map((item) => (
          <span
            key={item}
            className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700 font-extrabold text-[11px]"
          >
            {item}
          </span>
        ))}
        <Edit2 className="h-3 w-3 text-slate-400 opacity-0 group-hover/cell:opacity-100 transition shrink-0 ml-0.5" />
      </div>
    );
  }

  // 3. Active Editing Mode for other Data Types
  if (editing) {
    return (
      <div className="relative flex items-center gap-1 group/cell min-w-[120px]" onClick={(e) => e.stopPropagation()}>
        {fieldType === "textarea" || fieldType === "richtext" ? (
          <textarea
            autoFocus
            rows={2}
            placeholder={placeholder}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => handleSave()}
            className={`w-full rounded-lg border border-amber-400 dark:border-amber-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-amber-500 shadow-xs transition ${className}`}
          />
        ) : fieldType === "number" ? (
          <input
            type="number"
            autoFocus
            placeholder={placeholder}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => handleSave()}
            className={`w-full rounded-lg border border-amber-400 dark:border-amber-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-amber-500 shadow-xs transition ${className}`}
          />
        ) : fieldType === "date" ? (
          <input
            type="date"
            autoFocus
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => handleSave()}
            className={`w-full rounded-lg border border-amber-400 dark:border-amber-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-amber-500 shadow-xs transition ${className}`}
          />
        ) : fieldType === "datetime" ? (
          <input
            type="datetime-local"
            autoFocus
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => handleSave()}
            className={`w-full rounded-lg border border-amber-400 dark:border-amber-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-amber-500 shadow-xs transition ${className}`}
          />
        ) : fieldType === "select" || fieldType === "radio" ? (
          <select
            autoFocus
            value={tempValue}
            onChange={(e) => {
              setTempValue(e.target.value);
              handleSave(e.target.value);
            }}
            onBlur={() => handleSave()}
            className={`w-full rounded-lg border border-amber-400 dark:border-amber-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-amber-500 shadow-xs transition ${className}`}
          >
            <option value="">-- Select Option --</option>
            {options.length > 0
              ? options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))
              : ["Option 1", "Option 2", "Option 3", "Active", "Pending", "Completed"].map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
          </select>
        ) : fieldType === "email" ? (
          <input
            type="email"
            autoFocus
            placeholder="user@domain.com"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => handleSave()}
            className={`w-full rounded-lg border border-amber-400 dark:border-amber-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-amber-500 shadow-xs transition ${className}`}
          />
        ) : fieldType === "phone" ? (
          <input
            type="tel"
            autoFocus
            placeholder="+91 9876543210"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => handleSave()}
            className={`w-full rounded-lg border border-amber-400 dark:border-amber-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-mono font-semibold text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-amber-500 shadow-xs transition ${className}`}
          />
        ) : fieldType === "url" ? (
          <input
            type="url"
            autoFocus
            placeholder="https://example.com"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => handleSave()}
            className={`w-full rounded-lg border border-amber-400 dark:border-amber-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-amber-500 shadow-xs transition ${className}`}
          />
        ) : (
          <input
            type="text"
            autoFocus
            placeholder={placeholder}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => handleSave()}
            className={`w-full rounded-lg border border-amber-400 dark:border-amber-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-amber-500 shadow-xs transition ${className}`}
          />
        )}
        <button
          type="button"
          onClick={() => handleSave()}
          className="p-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 shrink-0"
          title="Save"
        >
          <Check className="h-3.5 w-3.5 stroke-[2.5]" />
        </button>
      </div>
    );
  }

  // 4. Empty State (No value entered yet)
  if (!value) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
        className={`inline-flex items-center gap-1 justify-center text-[10px] font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full shadow-2xs transition max-w-[120px] ${className}`}
      >
        <span className="truncate">{placeholder}</span>
      </button>
    );
  }

  // 5. Display Mode formatted according to Data Type
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      className="group/cell inline-flex items-center gap-1.5 py-0.5 px-1 cursor-pointer transition hover:text-indigo-600 dark:hover:text-indigo-400"
      title={`Click to edit (${fieldType.toUpperCase()})`}
    >
      {fieldType === "number" ? (
        <span className="font-mono text-xs font-black text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
          {Number(value).toLocaleString("en-IN") || value}
        </span>
      ) : fieldType === "select" || fieldType === "radio" ? (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-extrabold text-[11px]">
          {value}
        </span>
      ) : fieldType === "phone" ? (
        <a
          href={`tel:${value}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-xs font-mono font-bold text-sky-600 dark:text-sky-400 hover:underline"
        >
          <Phone className="h-3 w-3" /> {value}
        </a>
      ) : fieldType === "email" ? (
        <a
          href={`mailto:${value}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
        >
          <Mail className="h-3 w-3" /> {value}
        </a>
      ) : fieldType === "url" ? (
        <a
          href={value.startsWith("http") ? value : `https://${value}`}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          <ExternalLink className="h-3 w-3" /> {value.replace(/^https?:\/\//, "")}
        </a>
      ) : fieldType === "date" ? (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
          <Calendar className="h-3 w-3 text-amber-500" /> {value}
        </span>
      ) : fieldType === "datetime" ? (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
          <Clock className="h-3 w-3 text-amber-500" /> {value}
        </span>
      ) : fieldType === "user" ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800 text-violet-800 dark:text-violet-300 font-bold text-xs">
          <User className="h-3 w-3" /> {value}
        </span>
      ) : (
        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-xs">
          {value}
        </span>
      )}
      <Edit2 className="h-3 w-3 text-slate-400 opacity-0 group-hover/cell:opacity-100 transition shrink-0 ml-0.5" />
    </div>
  );
}
