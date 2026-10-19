"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Kyc = {
  id: string;
  fullName: string;
  status: string;
  idNumber: string | null;
  idDocumentUrl: string | null;
  addressProofUrl: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; phone: string | null };
};

export function KycManager({ profiles }: { profiles: Kyc[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function review(id: string, status: "APPROVED" | "REJECTED") {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/kyc/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Failed to update KYC status.");
      } else {
        router.refresh();
      }
    } catch (err) {
      alert("Network error occurred.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      {profiles.map((p) => (
        <div key={p.id} className="rounded-2xl border bg-white p-6">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <p className="font-semibold">{p.fullName}</p>
              <p className="text-sm text-slate-600">{p.user.name} · {p.user.email}</p>
              <p className="text-sm text-slate-500">ID: {p.idNumber ?? "—"} · Phone: {p.user.phone ?? "—"}</p>
              <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                p.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" :
                p.status === "REJECTED" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
              }`}>{p.status}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/admin/users/${p.user.id}`}
                className="text-xs font-medium text-brand-hover underline"
              >
                Full profile →
              </Link>
              {p.idDocumentUrl && (
                <a href={p.idDocumentUrl} target="_blank" rel="noreferrer" className="text-xs text-brand-hover underline">ID doc</a>
              )}
              {p.addressProofUrl && (
                <a href={p.addressProofUrl} target="_blank" rel="noreferrer" className="text-xs text-brand-hover underline">Address proof</a>
              )}
              {p.status === "PENDING" && (
                <>
                  <Button variant="gold" disabled={busy === p.id} onClick={() => review(p.id, "APPROVED")}>Approve</Button>
                  <Button variant="danger" disabled={busy === p.id} onClick={() => review(p.id, "REJECTED")}>Reject</Button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
      {profiles.length === 0 && <p className="text-center text-slate-500 py-12">No KYC submissions yet.</p>}
    </div>
  );
}
