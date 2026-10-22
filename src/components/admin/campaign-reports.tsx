"use client";

import { useEffect, useState, Fragment } from "react";
import { Loader2, Download, RefreshCw, BarChart3, ChevronDown, ChevronRight, User2, Clock, Users, CheckCircle2, XCircle } from "lucide-react";

type Campaign = {
  id: string;
  name: string;
  templateName: string | null;
  channels: string | null;
  sourceType: string | null;
  audienceCount: number;
  sentCount: number;
  failedCount: number;
  createdByName: string | null;
  createdByEmail: string | null;
  createdByRole: string | null;
  createdAt: string;
  resultsJson: string | null;
};

function fmt(iso: string) {
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}
const SOURCE_LABEL: Record<string, string> = { leads: "CRM audience", manual: "Manual numbers", file: "CSV/Excel upload" };

export function CampaignReports() {
  const [rows, setRows] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

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

  function parseResults(c: Campaign): any[] {
    try { return c.resultsJson ? JSON.parse(c.resultsJson) : []; } catch { return []; }
  }

  function downloadReport(c: Campaign) {
    const results = parseResults(c);
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
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <BarChart3 className="h-4 w-4 text-brand-hover" /> Campaign reports
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">Every campaign ever launched, who ran it, and the delivery outcome. Click a row for full details.</p>
        </div>
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
                <th className="px-3 py-2 font-semibold">Source</th>
                <th className="px-3 py-2 font-semibold text-right">Audience</th>
                <th className="px-3 py-2 font-semibold text-right">Sent</th>
                <th className="px-3 py-2 font-semibold text-right">Failed</th>
                <th className="px-3 py-2 font-semibold">Launched by</th>
                <th className="px-3 py-2 font-semibold">When</th>
                <th className="px-3 py-2 font-semibold text-right">Report</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const open = openId === c.id;
                const results = open ? parseResults(c) : [];
                const failed = results.filter((r) => r.status !== "SENT");
                return (
                  <Fragment key={c.id}>
                    <tr className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => setOpenId(open ? null : c.id)}>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5 font-medium text-slate-900">
                          {open ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                          {c.name}
                        </div>
                        {c.templateName && <div className="ml-5 text-[11px] text-slate-400">Template: {c.templateName}{c.channels ? ` · ${c.channels}` : ""}</div>}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-500">{SOURCE_LABEL[c.sourceType || ""] || c.sourceType || "—"}</td>
                      <td className="px-3 py-2.5 text-right">{c.audienceCount}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-emerald-700">{c.sentCount}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-red-600">{c.failedCount}</td>
                      <td className="px-3 py-2.5">
                        <div className="text-xs font-medium text-slate-700">{c.createdByName || "—"}</div>
                        <div className="text-[11px] text-slate-400">{c.createdByEmail || ""}</div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-500">{fmt(c.createdAt)}</td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); downloadReport(c); }}
                          disabled={!c.resultsJson}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                          title={c.resultsJson ? "Download success & failed contacts (CSV)" : "No per-contact results stored"}
                        >
                          <Download className="h-3 w-3" /> CSV
                        </button>
                      </td>
                    </tr>
                    {open && (
                      <tr className="bg-slate-50/70">
                        <td colSpan={8} className="px-5 py-4">
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <Detail icon={<User2 className="h-3.5 w-3.5" />} label="Launched by" value={`${c.createdByName || "—"}${c.createdByRole ? ` · ${c.createdByRole}` : ""}`} sub={c.createdByEmail || ""} />
                            <Detail icon={<Clock className="h-3.5 w-3.5" />} label="Timestamp" value={fmt(c.createdAt)} />
                            <Detail icon={<Users className="h-3.5 w-3.5" />} label="Audience / source" value={`${c.audienceCount} contacts`} sub={SOURCE_LABEL[c.sourceType || ""] || c.sourceType || ""} />
                            <Detail icon={<BarChart3 className="h-3.5 w-3.5" />} label="Template / channels" value={c.templateName || "—"} sub={c.channels || ""} />
                            <Detail icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />} label="Delivered" value={`${c.sentCount}`} />
                            <Detail icon={<XCircle className="h-3.5 w-3.5 text-red-600" />} label="Failed" value={`${c.failedCount}`} />
                          </div>
                          {failed.length > 0 && (
                            <div className="mt-4">
                              <p className="mb-1.5 text-xs font-semibold text-slate-600">Failed contacts ({failed.length})</p>
                              <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                                {failed.slice(0, 50).map((r: any, i: number) => (
                                  <div key={i} className="flex items-center justify-between border-b border-slate-100 px-3 py-1.5 text-xs last:border-0">
                                    <span className="text-slate-700">{r.name || "Contact"} <span className="text-slate-400">{r.phone || r.email}</span></span>
                                    <span className="text-red-500">{r.detail}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Detail({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{icon}{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-900">{value}</div>
      {sub ? <div className="text-[11px] text-slate-500">{sub}</div> : null}
    </div>
  );
}
