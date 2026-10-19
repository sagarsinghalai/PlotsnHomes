"use client";

import { UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Showing = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  tourDate: string;
  tourTime: string;
  tourType: string;
  message: string | null;
  status: string;
  createdAt: string;
  property: { title: string; symbol: string; slug: string };
  lead: { id: string; stage: string } | null;
};

const STATUSES = ["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;

export function ShowingsManager({ showings }: { showings: Showing[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function updateStatus(id: string, status: string) {
    setBusy(id);
    await fetch(`/api/admin/showings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(null);
    router.refresh();
  }

  async function convertToLead(id: string) {
    setBusy(`convert-${id}`);
    const res = await fetch(`/api/admin/showings/${id}`, { method: "POST" });
    const data = await res.json();
    setBusy(null);
    if (data.lead?.id) {
      router.push(`/admin/crm/leads/${data.lead.id}`);
    } else {
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/admin/crm" className="text-brand-hover hover:underline font-medium">
          ← CRM pipeline
        </Link>
        <Link href="/admin/reports" className="text-brand-hover hover:underline font-medium">
          Reports →
        </Link>
      </div>

      {showings.map((s) => (
        <div
          key={s.id}
          className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col lg:flex-row lg:justify-between gap-4"
        >
          <div>
            <p className="font-mono text-sm text-brand-hover font-bold">{s.property.symbol}</p>
            <Link href={`/properties/${s.property.slug}`} className="font-medium text-slate-900 hover:underline">
              {s.property.title}
            </Link>
            <p className="mt-2 text-sm">
              {s.name} · {s.email}
              {s.phone ? ` · ${s.phone}` : ""}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {s.tourType} tour · {new Date(s.tourDate).toLocaleDateString()} at {s.tourTime}
            </p>
            {s.message && <p className="mt-2 text-sm text-slate-500">{s.message}</p>}
            {s.lead && (
              <Link
                href={`/admin/crm/leads/${s.lead.id}`}
                className="inline-block mt-2 text-xs text-emerald-700 font-medium"
              >
                In CRM · {s.lead.stage.replace("_", " ")}
              </Link>
            )}
          </div>
          <div className="flex flex-col gap-2 min-w-[200px]">
            <select
              value={s.status}
              disabled={busy === s.id}
              onChange={(e) => updateStatus(s.id, e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
            {!s.lead && (
              <Button variant="secondary" disabled={busy === `convert-${s.id}`} onClick={() => convertToLead(s.id)}>
                <UserPlus className="h-4 w-4" />
                Add to CRM
              </Button>
            )}
          </div>
        </div>
      ))}
      {showings.length === 0 && (
        <p className="text-center text-slate-500 py-12">No site visit requests yet.</p>
      )}
    </div>
  );
}
