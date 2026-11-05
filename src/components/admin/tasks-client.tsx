"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Check, X, Loader2, Building2, ShieldCheck, Landmark, CalendarCheck, FileText, ArrowRight, RefreshCw,
} from "lucide-react";
import { logActivity } from "@/lib/activity-logs";

type Item = { type: string; id: string; title: string; subtitle: string; href: string; createdAt: string };
type Summary = { listings: number; kyc: number; loans: number; showings: number; registrations: number; total: number };

const TYPE_META: Record<string, { label: string; icon: any }> = {
  listing: { label: "Pending Listings", icon: Building2 },
  kyc: { label: "KYC Verifications", icon: ShieldCheck },
  loan: { label: "Loan Applications", icon: Landmark },
  showing: { label: "Site Visits", icon: CalendarCheck },
  registration: { label: "Applications", icon: FileText },
};

export function TasksClient() {
  const { data: session } = useSession();
  const [items, setItems] = useState<Item[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const d = await fetch("/api/admin/pending-tasks").then((r) => r.json()).catch(() => ({ items: [], summary: null }));
    setItems(d.items || []);
    setSummary(d.summary || null);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function moderateListing(id: string, status: "ACTIVE" | "REJECTED") {
    setBusy(id);
    const item = items.find((i) => i.type === "listing" && i.id === id);
    const res = await fetch(`/api/admin/properties/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
    });
    if (res.ok) {
      logActivity({
        category: "edit",
        action: status === "ACTIVE" ? "Listing Approved" : "Listing Rejected",
        actorName: session?.user?.name || "Admin",
        actorRole: (session?.user as any)?.role || "SUPERADMIN",
        actorEmail: session?.user?.email || "",
        target: item?.title || "Listing",
        details: `${status === "ACTIVE" ? "Approved and published" : "Rejected"} seller listing from Notifications & Tasks.`,
      });
      setItems((x) => x.filter((i) => !(i.type === "listing" && i.id === id)));
      setSummary((s) => (s ? { ...s, listings: Math.max(0, s.listings - 1), total: Math.max(0, s.total - 1) } : s));
    }
    setBusy(null);
  }

  if (loading) {
    return <div className="flex justify-center py-16 text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (!items.length) {
    return <div className="rounded-2xl border bg-white p-10 text-center text-slate-500">You&apos;re all caught up — no pending tasks. 🎉</div>;
  }

  const groups = Object.keys(TYPE_META)
    .map((t) => ({ t, list: items.filter((i) => i.type === t) }))
    .filter((g) => g.list.length);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{summary?.total ?? items.length} task{(summary?.total ?? items.length) === 1 ? "" : "s"} need your attention. They disappear as you complete each one.</p>
        <button onClick={load} className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>
      </div>

      {groups.map(({ t, list }) => {
        const M = TYPE_META[t];
        const Icon = M.icon;
        return (
          <div key={t}>
            <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
              <Icon className="h-4 w-4 text-brand" /> {M.label}
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{list.length}</span>
            </h2>
            <div className="space-y-2">
              {list.map((i) => (
                <div key={i.type + i.id} className="flex items-center gap-3 rounded-xl border bg-white p-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-900">{i.title}</div>
                    <div className="truncate text-xs text-slate-500">{i.subtitle} · {new Date(i.createdAt).toLocaleDateString()}</div>
                  </div>
                  {i.type === "listing" ? (
                    <div className="flex shrink-0 gap-2">
                      <button onClick={() => moderateListing(i.id, "REJECTED")} disabled={busy === i.id} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"><X className="h-3.5 w-3.5" /> Reject</button>
                      <button onClick={() => moderateListing(i.id, "ACTIVE")} disabled={busy === i.id} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">{busy === i.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Approve</button>
                    </div>
                  ) : (
                    <Link href={i.href} className="inline-flex shrink-0 items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">Review <ArrowRight className="h-3.5 w-3.5" /></Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
