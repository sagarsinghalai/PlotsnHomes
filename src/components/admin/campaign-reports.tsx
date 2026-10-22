"use client";

import { useEffect, useState } from "react";
import { Loader2, Download, RefreshCw, BarChart3 } from "lucide-react";

type Campaign = {
  id: string;
  name: string;
  templateName: string | null;
  channels: string | null;
  audienceCount: number;
  sentCount: number;
  failedCount: number;
  createdByName: string | null;
  createdAt: string;
  resultsJson: string | null;
};

function fmt(iso: string) {
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

export function CampaignReports() {
  const [rows, setRows] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/whatsapp/campaigns");
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to load");
      setRows(data.campaigns);
    } catch (e: any) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  function downloadReport(c: Campaign) {
    let results: any[] = [];
    try { results = c.resultsJson ? JSON.parse(c.resultsJson) : []; } catch { results = []; }
    const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = ["Name", "Phone", "Email", "Channel", "Status", "Detail"];
    const body = results.map((r) => [r.name, r.phone, r.email, r.channel, r.status === "SENT" ? "Success" : "Failed", r.detail].map(esc).join(","));
    const csv = [header.join(","), ...body].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${c.name.replace(/[^a-z0-9]+/gi, "-")}-${c.id.slice(-6)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between border-b pb-3">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900">
          <BarChart3 className="h-4 w-4 text-brand-hover" /> Campaign reports
        </h3>
        <button onClick={load} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 p-6 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">No campaigns have been launched yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2 font-semibold">Campaign</th>
                <th className="px-3 py-2 font-semibold">Channels</th>
                <th className="px-3 py-2 font-semibold text-right">Audience</th>
                <th className="px-3 py-2 font-semibold text-right">Sent</th>
                <th className="px-3 py-2 font-semibold text-right">Failed</th>
                <th className="px-3 py-2 font-semibold">Launched by</th>
                <th className="px-3 py-2 font-semibold">When</th>
                <th className="px-3 py-2 font-semibold text-right">Report</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-slate-900">{c.name}</div>
                    {c.templateName && <div className="text-[11px] text-slate-400">Template: {c.templateName}</div>}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">{c.channels || "—"}</td>
                  <td className="px-3 py-2.5 text-right">{c.audienceCount}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-emerald-700">{c.sentCount}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-red-600">{c.failedCount}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-600">{c.createdByName || "—"}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">{fmt(c.createdAt)}</td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      onClick={() => downloadReport(c)}
                      disabled={!c.resultsJson}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                      title={c.resultsJson ? "Download success & failed contacts (CSV)" : "No per-contact results stored"}
                    >
                      <Download className="h-3 w-3" /> CSV
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
