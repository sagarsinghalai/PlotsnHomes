"use client";

import { useEffect, useState } from "react";
import { Globe, Loader2, Check, AlertTriangle, RefreshCw } from "lucide-react";

type DnsRecord = { type: string; host: string; value: string; note: string };
type Data = {
  ok: boolean;
  domain: string;
  platformHost: string;
  subdomainHint: string | null;
  records: DnsRecord[];
  check: { resolves: boolean; target?: string; pointsToPlatform: boolean; detail: string };
};

export function DomainStatusCard() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/admin/domains/check");
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Failed to check domain");
      setData(j);
    } catch (e: any) {
      setErr(e.message || "Failed to check domain");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const status = data?.check;
  const chip = !data?.domain
    ? { cls: "bg-slate-100 text-slate-600", label: "No custom domain" }
    : status?.pointsToPlatform
      ? { cls: "bg-emerald-100 text-emerald-800", label: "Live" }
      : status?.resolves
        ? { cls: "bg-amber-100 text-amber-800", label: "Misconfigured" }
        : { cls: "bg-amber-100 text-amber-800", label: "Pending DNS" };

  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-brand" />
          <h2 className="font-semibold text-slate-900">Custom domain</h2>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${chip.cls}`}>{chip.label}</span>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Re-check DNS
        </button>
      </div>

      <div className="space-y-4 p-6 text-sm">
        {err && <p className="rounded-lg bg-rose-50 px-3 py-2 text-rose-700">{err}</p>}
        {loading && !data && (
          <p className="flex items-center gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Checking…</p>
        )}

        {data && (
          <>
            {data.domain ? (
              <div className="flex items-start gap-2">
                {status?.pointsToPlatform ? (
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                )}
                <p className="text-slate-700">
                  <span className="font-medium">{data.domain}</span> — {status?.detail}
                </p>
              </div>
            ) : (
              <p className="text-slate-600">
                No custom domain is set for your workspace. You can also use the ready subdomain
                {data.subdomainHint ? <> <span className="font-mono text-slate-800">{data.subdomainHint}</span></> : null},
                or ask the platform owner to set your domain.
              </p>
            )}

            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-slate-400">DNS records to set at your registrar</p>
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left">Type</th>
                      <th className="px-3 py-2 text-left">Host</th>
                      <th className="px-3 py-2 text-left">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.records.map((r, i) => (
                      <tr key={i} className="border-t border-slate-100 align-top">
                        <td className="px-3 py-2 font-mono font-medium">{r.type}</td>
                        <td className="px-3 py-2 font-mono">{r.host}</td>
                        <td className="px-3 py-2">
                          <span className="font-mono">{r.value}</span>
                          <p className="mt-0.5 text-slate-400">{r.note}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                After setting records, HTTPS is provisioned by the platform host. DNS changes can take up to ~48h to propagate.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
