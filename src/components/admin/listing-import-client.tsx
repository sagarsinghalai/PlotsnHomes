"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Upload, Loader2, CheckCircle2, AlertTriangle, FileSpreadsheet } from "lucide-react";

export function ListingImportClient() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function doImport() {
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/listing-import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Import failed.");
        setResult(data.warnings ? { warnings: data.warnings } : null);
        setLoading(false);
        return;
      }
      setResult(data);
    } catch {
      setError("Import failed. Check the file and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Step 1 — template */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2 text-slate-900 font-bold">
          <FileSpreadsheet className="h-5 w-5 text-brand" /> 1. Download the template
        </div>
        <p className="mt-1 text-sm text-slate-500">Give this to the seller to fill in, then upload the completed file below.</p>
        <a href="/api/listing-template" className="mt-3 inline-flex items-center gap-2 rounded-lg border border-brand/40 bg-brand/5 px-4 py-2 text-sm font-bold text-brand hover:bg-brand/10">
          <Download className="h-4 w-4" /> Download Excel template
        </a>
      </div>

      {/* Step 2 — upload */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2 text-slate-900 font-bold">
          <Upload className="h-5 w-5 text-brand" /> 2. Upload the filled file
        </div>
        <p className="mt-1 text-sm text-slate-500">Values are validated against the spec; mismatches are reported but don't block the import.</p>
        <input
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResult(null); setError(""); }}
          className="mt-3 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
        />
        <button
          onClick={doImport}
          disabled={!file || loading}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-hover disabled:opacity-50"
        >
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Importing…</> : "Import listing"}
        </button>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

      {result?.ok && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-2 font-bold text-emerald-800"><CheckCircle2 className="h-5 w-5" /> Listing created</div>
          <p className="mt-1 text-sm text-emerald-800">
            <span className="font-semibold">{result.title}</span> — {result.category || "Uncategorised"} · {result.fieldsImported} fields imported.
          </p>
          <Link href="/admin/properties" className="mt-2 inline-block text-sm font-bold text-emerald-900 underline">View in Properties →</Link>
        </div>
      )}

      {result?.warnings?.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 font-bold text-amber-800"><AlertTriangle className="h-4 w-4" /> Validation notes</div>
          <ul className="mt-2 list-disc pl-5 text-xs text-amber-800 space-y-1">
            {result.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
