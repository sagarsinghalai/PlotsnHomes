"use client";

import { useRef, useState } from "react";
import { X, Upload, FileSpreadsheet, FileText, Loader2, CheckCircle2, AlertTriangle, Download } from "lucide-react";

export type TemplateCol = { header: string; example: string };
type RowError = { field: string; message: string };
type SkippedRow = { row: number; name?: string; errors: RowError[] };
type ImportResult = { createdCount: number; skippedCount: number; skipped?: SkippedRow[] } | null;

export function OrgBulkImportModal({
  open,
  onClose,
  onImported,
  actionType,
  entityLabel,
  templateColumns,
  parentHint,
}: {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
  actionType: string;
  entityLabel: string;
  templateColumns: TemplateCol[];
  parentHint?: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [downloading, setDownloading] = useState<"csv" | "xlsx" | null>(null);
  const [result, setResult] = useState<ImportResult>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  async function downloadTemplate(format: "csv" | "xlsx") {
    setDownloading(format);
    try {
      const XLSX = await import("xlsx");
      const headers = templateColumns.map((c) => c.header);
      const ex1: Record<string, string> = {};
      const ex2: Record<string, string> = {};
      templateColumns.forEach((c) => { ex1[c.header] = c.example; ex2[c.header] = ""; });
      const NOTE = "NOTES (read, then delete these rows before uploading)";
      const notes = [
        { [NOTE]: `Name and Code are required for every ${entityLabel}.` },
        parentHint ? { [NOTE]: parentHint } : null,
        { [NOTE]: "These note rows are ignored when you upload." },
      ].filter(Boolean) as Record<string, string>[];
      const ws = XLSX.utils.json_to_sheet([ex1, ex2, {}, ...notes], { header: [...headers, NOTE] });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, entityLabel.slice(0, 28));
      const slug = entityLabel.toLowerCase().replace(/\s+/g, "-");
      XLSX.writeFile(wb, `plotsnhomes-${slug}-import-template.${format}`, { bookType: format });
    } finally {
      setDownloading(null);
    }
  }

  async function handleImport() {
    if (!file) { setError("Please choose a file to upload."); return; }
    setError(""); setResult(null); setImporting(true);
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      if (rows.length === 0) { setError("The file has no data rows."); return; }
      const res = await fetch("/api/admin/organization/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionType, rows }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Import failed."); return; }
      setResult(data);
      if (data.createdCount > 0) onImported();
    } catch {
      setError("Could not read the file. Use .xlsx, .xls or .csv.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">Bulk Upload — {entityLabel}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Required fields</p>
            <div className="flex flex-wrap gap-1.5">
              {templateColumns.map((c) => (
                <span key={c.header} className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {c.header}{(c.header === "Name" || c.header === "Code") && <span className="text-rose-500 ml-0.5">*</span>}
                </span>
              ))}
            </div>
            {parentHint && <p className="mt-2 text-[11px] text-slate-500">{parentHint}</p>}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">1. Download sample template</p>
            <div className="flex gap-2.5">
              <button type="button" onClick={() => downloadTemplate("csv")} disabled={downloading !== null} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 transition disabled:opacity-60">
                {downloading === "csv" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4 text-blue-600" />} Sample CSV
              </button>
              <button type="button" onClick={() => downloadTemplate("xlsx")} disabled={downloading !== null} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 transition disabled:opacity-60">
                {downloading === "xlsx" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 text-emerald-600" />} Sample Excel
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">2. Upload your file (.xlsx, .xls or .csv)</p>
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResult(null); setError(""); }} />
            <button type="button" onClick={() => inputRef.current?.click()} className="w-full rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 px-4 py-6 text-center hover:border-emerald-400 hover:bg-emerald-50/40 transition">
              <Upload className="h-6 w-6 mx-auto text-slate-400 mb-1.5" />
              {file ? <span className="text-sm font-bold text-slate-800">{file.name}</span> : <span className="text-sm font-semibold text-slate-500">Click to choose a file</span>}
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700 flex items-center gap-2"><AlertTriangle className="h-4 w-4 shrink-0" /> {error}</div>
          )}

          {result && (
            <div className="space-y-3">
              <div className={`rounded-xl border px-4 py-3 text-sm ${result.createdCount > 0 ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
                <p className="font-bold flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> {result.createdCount} created{result.skippedCount > 0 ? `, ${result.skippedCount} rejected` : ""}.</p>
                {result.skippedCount > 0 && <p className="text-xs mt-0.5 opacity-90">Rejected rows were not created. Fix the fields below and re-upload.</p>}
              </div>
              {result.skippedCount > 0 && result.skipped && (
                <div className="rounded-xl border border-rose-200 overflow-hidden">
                  <div className="px-3 py-2 bg-rose-50 border-b border-rose-100 text-xs font-extrabold text-rose-700 flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" /> {result.skipped.length} row(s) need fixing</div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-rose-100">
                    {result.skipped.map((s, i) => (
                      <div key={i} className="px-3 py-2 text-xs">
                        <p className="font-bold text-slate-800">Row {s.row}{s.name ? ` · ${s.name}` : ""}</p>
                        <ul className="mt-0.5 space-y-0.5">
                          {s.errors.map((e, j) => <li key={j} className="text-rose-600"><span className="font-bold">{e.field}:</span> {e.message}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition">{result ? "Close" : "Cancel"}</button>
          <button type="button" onClick={handleImport} disabled={importing || !file} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition disabled:opacity-50">
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
          </button>
        </div>
      </div>
    </div>
  );
}
