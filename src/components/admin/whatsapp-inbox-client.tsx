"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, MessageCircle, Clock, AlertTriangle, RefreshCw, ArrowRight } from "lucide-react";

type Conversation = {
  contactId: string;
  leadId: string | null;
  leadName: string;
  phone: string;
  property: string | null;
  assignedAgentName: string | null;
  lastBody: string;
  lastAt: string;
  lastInboundAt: string | null;
  windowOpen: boolean;
  count: number;
};

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function WhatsAppInboxClient({ canSeeAll }: { canSeeAll: boolean }) {
  const [scope, setScope] = useState<"mine" | "all">("mine");
  const [rows, setRows] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(s: "mine" | "all") {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/whatsapp/inbox?scope=${s}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to load");
      setRows(data.conversations);
    } catch (e: any) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(scope); }, [scope]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <MessageCircle className="h-5 w-5 text-emerald-600" />
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">WhatsApp inbox</h1>
        <div className="ml-auto flex items-center gap-2">
          {canSeeAll && (
            <div className="flex rounded-lg border border-slate-200 p-0.5 text-xs dark:border-slate-700">
              <button onClick={() => setScope("mine")} className={`rounded-md px-2.5 py-1 font-semibold ${scope === "mine" ? "bg-brand text-white" : "text-slate-600"}`}>Assigned to me</button>
              <button onClick={() => setScope("all")} className={`rounded-md px-2.5 py-1 font-semibold ${scope === "all" ? "bg-brand text-white" : "text-slate-600"}`}>All</button>
            </div>
          )}
          <button onClick={() => load(scope)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Conversations from WhatsApp leads. Open one to view the thread and reply with quick replies or a direct message. The 24-hour window shows whether WhatsApp still allows a free-form reply (otherwise you must use an approved template).
      </p>

      {loading ? (
        <div className="flex items-center gap-2 p-6 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/50">
          No WhatsApp conversations yet{scope === "mine" ? " assigned to you" : ""}.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
          {rows.map((c) => {
            const href = c.leadId ? `/admin/messages?userId=${c.leadId}` : `/admin/messages?userId=${c.contactId}`;
            return (
              <Link key={c.contactId} href={href} className="flex items-center gap-3 bg-white px-4 py-3 hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/60">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                  {(c.leadName || "?").slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold text-slate-900 dark:text-white">{c.leadName}</span>
                    <span className="truncate text-xs text-slate-400">{c.phone}</span>
                  </div>
                  <div className="truncate text-xs text-slate-500">{c.lastBody}</div>
                  {c.property && <div className="truncate text-[11px] text-slate-400">Interested in: {c.property}</div>}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-[11px] text-slate-400">{timeAgo(c.lastAt)}</span>
                  {c.windowOpen ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700"><Clock className="h-3 w-3" /> window open</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700"><AlertTriangle className="h-3 w-3" /> needs template</span>
                  )}
                  {c.assignedAgentName && <span className="text-[10px] text-slate-400">→ {c.assignedAgentName}</span>}
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
