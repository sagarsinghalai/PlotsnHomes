"use client";

import { useRef, useState } from "react";
import { Role } from "@prisma/client";
import { X, Upload, FileSpreadsheet, Download, Loader2, CheckCircle2, AlertTriangle, FileText } from "lucide-react";
import { roleLabel } from "@/lib/roles";

// Catalog of every importable field (column header + example value).
const FIELD: Record<string, { header: string; example: string }> = {
  name: { header: "Name", example: "Rahul Sharma" },
  email: { header: "Email", example: "rahul@example.com" },
  countryCode: { header: "Country Code", example: "+91" },
  phone: { header: "Phone", example: "9876543210" },
  password: { header: "Password", example: "" },
  dob: { header: "DOB (YYYY-MM-DD)", example: "1990-05-21" },
  pan: { header: "PAN", example: "ABCDE1234F" },
  aadhar: { header: "Aadhaar", example: "234567890123" },
  address: { header: "Address", example: "12 MG Road" },
  city: { header: "City", example: "Mumbai" },
  state: { header: "State", example: "Maharashtra" },
  zip: { header: "ZIP", example: "400001" },
  country: { header: "Country", example: "IN" },
  commissionRate: { header: "Commission Rate (%)", example: "3" },
  managerEmail: { header: "Manager Email", example: "manager@example.com" },
  organization: { header: "Organization", example: "Acme Realty" },
  franchise: { header: "Franchise", example: "Acme West" },
  branch: { header: "Branch", example: "Andheri Branch" },
  department: { header: "Department", example: "Sales" },
  team: { header: "Team", example: "Team Alpha" },
};

const BASE = ["name", "email", "countryCode", "phone", "password"];

// The relevant fields for each account type / role.
const ROLE_FIELDS: Record<Role, string[]> = {
  SUPERADMIN: [...BASE],
  PLATFORM_ADMIN: [...BASE],
  WHITE_LABEL_ADMIN: [...BASE, "organization", "city", "state", "managerEmail"],
  FRANCHISE_ADMIN: [...BASE, "organization", "franchise", "city", "state", "managerEmail"],
  BRANCH_MANAGER: [...BASE, "franchise", "branch", "city", "state", "managerEmail"],
  DEPARTMENT_HEAD: [...BASE, "branch", "department", "city", "state", "managerEmail"],
  TEAM_LEADER: [...BASE, "branch", "department", "team", "city", "state", "managerEmail"],
  EXECUTIVE: [...BASE, "department", "team", "city", "state", "managerEmail"],
  EMPLOYEE: [...BASE, "department", "city", "state", "managerEmail"],
  AGENT: [...BASE, "pan", "commissionRate", "city", "state"],
  SELLER: [...BASE, "pan", "aadhar", "dob", "address", "city", "state", "zip", "country"],
  BUYER: [...BASE, "pan", "aadhar", "dob", "address", "city", "state", "zip", "country"],
  DEMO: [...BASE],
};

// Hierarchy order for the selector.
const ROLE_ORDER: Role[] = [
  "SUPERADMIN", "PLATFORM_ADMIN", "WHITE_LABEL_ADMIN", "FRANCHISE_ADMIN",
  "BRANCH_MANAGER", "DEPARTMENT_HEAD", "TEAM_LEADER", "EXECUTIVE",
  "EMPLOYEE", "AGENT", "SELLER", "BUYER", "DEMO",
];

type RowError = { field: string; message: string };
type SkippedRow = { row: number; name?: string; email?: string; errors: RowError[] };
type ImportResult = {
  createdCount: number;
  skippedCount: number;
  skipped?: SkippedRow[];
} | null;

export function BulkImportUsersModal({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}) {
  const [role, setRole] = useState<Role>("AGENT");
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [downloading, setDownloading] = useState<"csv" | "xlsx" | null>(null);
  const [result, setResult] = useState<ImportResult>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const columns = ROLE_FIELDS[role];

  async function downloadTemplate(format: "csv" | "xlsx") {
    setDownloading(format);
    try {
      const XLSX = await import("xlsx");
      const headers = columns.map((k) => FIELD[k].header);
      const NOTE_COL = "NOTES (read, then delete these rows before uploading)";
      const example1: Record<string, string> = { Role: roleLabel(role) };
      const example2: Record<string, string> = { Role: roleLabel(role) };
      columns.forEach((k) => {
        example1[FIELD[k].header] = FIELD[k].example;
        example2[FIELD[k].header] = "";
      });
      // Instruction rows — placed in a separate NOTES column so they are
      // ignored on import (their Name/Email/Role cells are blank).
      const notes = [
        { [NOTE_COL]: "'Country Code' accepts digits with or without a + (e.g. 91 or +91) — it is auto-formatted to +91 on import." },
        { [NOTE_COL]: "'Phone' must be exactly 10 digits only — do NOT include the country code here." },
        { [NOTE_COL]: "'Name' and 'Email' are required. These note rows are ignored when you upload." },
      ];
      const ws = XLSX.utils.json_to_sheet([example1, example2, {}, ...notes], {
        header: ["Role", ...headers, NOTE_COL],
      });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Users");
      const slug = roleLabel(role).toLowerCase().replace(/\s+/g, "-");
      XLSX.writeFile(wb, `plotsnhomes-${slug}-import-template.${format}`, { bookType: format });
    } finally {
      setDownloading(null);
    }
  }

  async function downloadErrorReport() {
    if (!result?.skipped?.length) return;
    const XLSX = await import("xlsx");
    const rows = result.skipped.map((s) => ({
      Row: s.row,
      Name: s.name ?? "",
      Email: s.email ?? "",
      "Fields with errors": s.errors.map((e) => e.field).join(", "),
      "What to fix": s.errors.map((e) => `${e.field}: ${e.message}`).join(" | "),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Errors");
    XLSX.writeFile(wb, "plotsnhomes-import-errors.csv", { bookType: "csv" });
  }

  async function handleImport() {
    if (!file) {
      setError("Please choose a file to upload.");
      return;
    }
    setError("");
    setResult(null);
    setImporting(true);
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      if (rows.length === 0) {
        setError("The file has no data rows.");
        return;
      }
      const res = await fetch("/api/admin/users/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: rows, defaultRole: role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Import failed.");
        return;
      }
      setResult(data);
      if (data.createdCount > 0) onImported();
    } catch {
      setError("Could not read the file. Use .xlsx, .xls or .csv.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Bulk Import Users</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Step 1: choose account type */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              1. Account type to import
            </label>
            <select
              value={role}
              onChange={(e) => { setRole(e.target.value as Role); setResult(null); setError(""); }}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-brand"
            >
              {ROLE_ORDER.map((r) => (
                <option key={r} value={r}>{roleLabel(r)}</option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              The template for <span className="font-bold">{roleLabel(role)}</span> includes these fields:
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {columns.map((k) => (
                <span
                  key={k}
                  className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                >
                  {FIELD[k].header}
                  {(k === "name" || k === "email") && <span className="text-rose-500 ml-0.5">*</span>}
                </span>
              ))}
            </div>
          </div>

          {/* Step 2: download sample */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              2. Download the sample template
            </label>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => downloadTemplate("csv")}
                disabled={downloading !== null}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition disabled:opacity-60"
              >
                {downloading === "csv" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4 text-blue-600" />}
                Sample CSV
              </button>
              <button
                type="button"
                onClick={() => downloadTemplate("xlsx")}
                disabled={downloading !== null}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition disabled:opacity-60"
              >
                {downloading === "xlsx" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 text-emerald-600" />}
                Sample Excel
              </button>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Fill in your data under these headers, then upload below. <span className="font-bold">Name</span> and <span className="font-bold">Email</span> are required; a temporary password is auto-generated if left blank.
            </p>
            <p className="mt-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-start gap-1">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              Country Code accepts digits with or without a <span className="font-mono">+</span> (e.g. 91 or +91) — it&apos;s auto-formatted. Phone must be 10 digits only.
            </p>
          </div>

          {/* Step 3: upload */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              3. Upload your file (.xlsx, .xls or .csv)
            </label>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResult(null); setError(""); }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 px-4 py-6 text-center hover:border-emerald-400 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition"
            >
              <Upload className="h-6 w-6 mx-auto text-slate-400 mb-1.5" />
              {file ? (
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{file.name}</span>
              ) : (
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Click to choose a file</span>
              )}
              <p className="text-[11px] text-slate-400 mt-0.5">Excel or CSV, up to 1000 users</p>
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/40 px-4 py-2.5 text-sm text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div
                className={`rounded-xl border px-4 py-3 text-sm ${
                  result.createdCount > 0
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                }`}
              >
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  {result.createdCount} user{result.createdCount !== 1 ? "s" : ""} imported
                  {result.skippedCount > 0 ? `, ${result.skippedCount} rejected` : ""}.
                </p>
                {result.skippedCount > 0 && (
                  <p className="text-xs mt-0.5 opacity-90">
                    Rejected rows were <span className="font-bold">not</span> imported. Fix the fields below and re-upload only those rows.
                  </p>
                )}
              </div>

              {result.skippedCount > 0 && result.skipped && result.skipped.length > 0 && (
                <div className="rounded-xl border border-rose-200 dark:border-rose-900 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-100 dark:border-rose-900">
                    <span className="text-xs font-extrabold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4" /> {result.skipped.length} row{result.skipped.length !== 1 ? "s" : ""} need fixing
                    </span>
                    <button
                      type="button"
                      onClick={downloadErrorReport}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 hover:underline"
                    >
                      <Download className="h-3.5 w-3.5" /> Download error report
                    </button>
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-rose-100 dark:divide-rose-900/60">
                    {result.skipped.map((s, idx) => (
                      <div key={idx} className="px-3 py-2 text-xs">
                        <p className="font-bold text-slate-800 dark:text-slate-100">
                          Row {s.row}
                          {s.email ? <span className="font-medium text-slate-500 dark:text-slate-400"> · {s.email}</span> : null}
                        </p>
                        <ul className="mt-0.5 space-y-0.5">
                          {s.errors.map((e, j) => (
                            <li key={j} className="text-rose-600 dark:text-rose-400">
                              <span className="font-bold">{e.field}:</span> {e.message}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {result ? "Close" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={importing || !file}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Import Users
          </button>
        </div>
      </div>
    </div>
  );
}
