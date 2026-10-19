"use client";

import { Trash2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAdminPermissions } from "@/components/admin/admin-permissions-context";

type Inquiry = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  createdAt: string;
  property: { title: string; symbol: string };
  lead: { id: string; stage: string } | null;
};

export function InquiriesManager({ inquiries }: { inquiries: Inquiry[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  let hasDeletePermission: ((href?: string) => boolean) | null = null;
  let hasSubPermission: ((permissionKey: string, subKey: string) => boolean) | null = null;
  try {
    const perms = useAdminPermissions();
    hasDeletePermission = perms.hasDeletePermission;
    hasSubPermission = perms.hasSubPermission;
  } catch (e) {
    // Default if outside provider
  }

  const canAddToCrm = !hasSubPermission || hasSubPermission("inquiries", "add_to_crm");
  const canDelete = !hasDeletePermission || hasDeletePermission("/admin/inquiries");

  async function remove(id: string) {
    if (!confirm("Delete this inquiry?")) return;
    setBusy(id);
    await fetch(`/api/admin/inquiries/${id}`, { method: "DELETE" });
    setBusy(null);
    router.refresh();
  }

  async function convertToLead(id: string) {
    setBusy(`convert-${id}`);
    const res = await fetch(`/api/admin/inquiries/${id}`, { method: "POST" });
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
      <div className="flex flex-wrap gap-4 text-sm mb-2">
        <Link href="/admin/crm" className="text-brand-hover hover:underline font-medium">
          ← CRM pipeline
        </Link>
        <Link href="/admin/reports/inquiries" className="text-brand-hover hover:underline font-medium">
          Reports →
        </Link>
      </div>

      {inquiries.map((q) => (
        <div
          key={q.id}
          className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col sm:flex-row sm:justify-between gap-4"
        >
          <div>
            <p className="font-mono text-sm text-brand-hover font-bold">{q.property.symbol}</p>
            <p className="font-medium text-slate-900">{q.property.title}</p>
            <p className="mt-2 text-sm">
              {q.name} · {q.email}
              {q.phone ? ` · ${q.phone}` : ""}
            </p>
            <p className="mt-2 text-sm text-slate-600">{q.message}</p>
            <p className="mt-2 text-xs text-slate-400" suppressHydrationWarning>
              {new Date(q.createdAt).toLocaleString()}
            </p>
            {q.lead && (
              <Link
                href={`/admin/crm/leads/${q.lead.id}`}
                className="inline-block mt-2 text-xs text-emerald-700 font-medium"
              >
                In CRM · {q.lead.stage.replace("_", " ")}
              </Link>
            )}
          </div>

          <div className="flex flex-col gap-2 self-start">
            {!q.lead && canAddToCrm && (
              <Button
                variant="secondary"
                disabled={busy === `convert-${q.id}`}
                onClick={() => convertToLead(q.id)}
              >
                <UserPlus className="h-4 w-4" />
                Add to CRM
              </Button>
            )}

            {canDelete && (
              <Button
                variant="danger"
                disabled={busy === q.id}
                onClick={() => remove(q.id)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        </div>
      ))}

      {inquiries.length === 0 && (
        <p className="text-center text-slate-500 py-12">No inquiries yet.</p>
      )}
    </div>
  );
}

