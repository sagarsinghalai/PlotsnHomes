"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X, Loader2, ExternalLink } from "lucide-react";

export type PendingRow = {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  listingType: string;
  city: string;
  state: string;
  price: number;
  images: string;
  createdAt: string;
  submittedBy: { name: string | null; email: string | null } | null;
};

export function PendingListingsClient({ initial }: { initial: PendingRow[] }) {
  const [rows, setRows] = useState<PendingRow[]>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function moderate(id: string, status: "ACTIVE" | "REJECTED") {
    setBusy(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/properties/${id}`, {
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
      setRows((rs) => rs.filter((r) => r.id !== id)); // disappears from the list
    } catch {
      setError("Action failed.");
    }
    setBusy(null);
  }

  if (!rows.length) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center text-slate-500">
        No listings awaiting review. 🎉
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      <p className="text-xs text-slate-500">{rows.length} listing{rows.length === 1 ? "" : "s"} awaiting your review.</p>
      {rows.map((r) => {
        let img = "";
        try { img = JSON.parse(r.images || "[]")[0] || ""; } catch { /* ignore */ }
        return (
          <div key={r.id} className="flex flex-col gap-4 rounded-2xl border bg-white p-4 sm:flex-row sm:items-center">
            <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {img && <img src={img} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-slate-900">{r.title}</div>
              <div className="mt-0.5 text-xs text-slate-500">{r.category || "—"} · {r.listingType} · {[r.city, r.state].filter(Boolean).join(", ")}</div>
              <div className="text-xs text-slate-500">
                Seller: {r.submittedBy?.name || "—"}{r.submittedBy?.email ? ` (${r.submittedBy.email})` : ""} · {new Date(r.createdAt).toLocaleDateString()}
              </div>
              <div className="mt-1 text-sm font-bold text-slate-900">₹{Number(r.price).toLocaleString("en-IN")}{r.listingType === "RENT" ? "/mo" : ""}</div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link href={`/admin/properties/${r.id}/edit`} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                <ExternalLink className="h-3.5 w-3.5" /> Details
              </Link>
              <button onClick={() => moderate(r.id, "REJECTED")} disabled={busy === r.id} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50">
                <X className="h-4 w-4" /> Reject
              </button>
              <button onClick={() => moderate(r.id, "ACTIVE")} disabled={busy === r.id} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                {busy === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Approve
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
