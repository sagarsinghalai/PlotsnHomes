"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, X, Loader2, ExternalLink, Search } from "lucide-react";
import { logActivity } from "@/lib/activity-logs";

export type PendingRow = {
  id: string;
  symbol: string;
  title: string;
  slug: string;
  category: string | null;
  listingType: string;
  city: string;
  state: string;
  price: number;
  images: string;
  status: string;
  createdAt: string;
  submittedBy: { name: string | null; email: string | null } | null;
};

type Actor = { name: string; role: string; email: string };

export function PendingListingsClient({ initial, actor }: { initial: PendingRow[]; actor: Actor }) {
  const [rows, setRows] = useState<PendingRow[]>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      [r.symbol, r.title, r.category, r.city, r.state, r.listingType, r.submittedBy?.name, r.submittedBy?.email, String(r.price)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(s))
    );
  }, [rows, q]);

  async function moderate(r: PendingRow, status: "ACTIVE" | "REJECTED") {
    setBusy(r.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/properties/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Action failed.");
        setBusy(null);
        return;
      }
      // Log every approval / rejection (shows under Logs → Approvals & Rejections).
      logActivity({
        category: "edit",
        action: status === "ACTIVE" ? "Listing Approved" : "Listing Rejected",
        actorName: actor.name,
        actorRole: actor.role,
        actorEmail: actor.email,
        target: `${r.title} (${r.symbol})`,
        details: `${status === "ACTIVE" ? "Approved and published" : "Rejected"} seller listing${r.submittedBy?.name ? ` submitted by ${r.submittedBy.name}` : ""}.`,
      });
      if (status === "ACTIVE") {
        setRows((rs) => rs.filter((x) => x.id !== r.id)); // approved → leaves the list
      } else {
        setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, status: "REJECTED" } : x))); // rejected → marked
      }
    } catch {
      setError("Action failed.");
    }
    setBusy(null);
  }

  const pendingCount = rows.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by code, title, city, seller…"
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>

      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      <p className="text-xs text-slate-500">{pendingCount} awaiting review{rows.length - pendingCount > 0 ? ` · ${rows.length - pendingCount} rejected` : ""}{q ? ` · ${filtered.length} shown` : ""}</p>

      {!filtered.length ? (
        <div className="rounded-2xl border bg-white p-10 text-center text-slate-500">{q ? "No listings match your search." : "No listings to review. 🎉"}</div>
      ) : (
        filtered.map((r) => {
          let img = "";
          try { img = JSON.parse(r.images || "[]")[0] || ""; } catch { /* ignore */ }
          const rejected = r.status === "REJECTED";
          return (
            <div key={r.id} className={`flex flex-col gap-4 rounded-2xl border bg-white p-4 sm:flex-row sm:items-center ${rejected ? "opacity-75" : ""}`}>
              {/* Left: photo or the property code */}
              <div className="flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-center">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="px-1 font-mono text-[10px] font-bold leading-tight text-slate-500">{r.symbol}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-semibold text-slate-900">{r.title}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${rejected ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>
                    {rejected ? "Rejected" : "Pending"}
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-slate-500">
                  <span className="font-mono font-semibold text-slate-600">{r.symbol}</span> · {r.category || "—"} · {r.listingType} · {[r.city, r.state].filter(Boolean).join(", ")}
                </div>
                <div className="text-xs text-slate-500">
                  Seller: {r.submittedBy?.name || "—"}{r.submittedBy?.email ? ` (${r.submittedBy.email})` : ""} · {r.createdAt.slice(0, 10)}
                </div>
                <div className="mt-1 text-sm font-bold text-slate-900">₹{Number(r.price).toLocaleString("en-IN")}{r.listingType === "RENT" ? "/mo" : ""}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link href={`/admin/properties/${r.id}/edit`} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  <ExternalLink className="h-3.5 w-3.5" /> Details
                </Link>
                {!rejected && (
                  <button onClick={() => moderate(r, "REJECTED")} disabled={busy === r.id} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50">
                    <X className="h-4 w-4" /> Reject
                  </button>
                )}
                <button onClick={() => moderate(r, "ACTIVE")} disabled={busy === r.id} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                  {busy === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Approve
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
