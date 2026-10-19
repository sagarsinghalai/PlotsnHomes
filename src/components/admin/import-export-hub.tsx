"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SettingsCardGrid } from "@/components/admin/settings-card-grid";
import { Download, Globe, List, Upload } from "lucide-react";

export function ImportHub() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function importCsv(file: File) {
    setBusy(true);
    setMsg("");
    const text = await file.text();
    const res = await fetch("/api/admin/platform/import-leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv: text, fileName: file.name }),
    });
    const data = await res.json();
    setBusy(false);
    setMsg(res.ok ? `Imported ${data.count} leads.` : data.error ?? "Import failed");
    router.refresh();
  }

  const cards = [
    { href: "#leads-csv", title: "Import Leads", description: "Upload CSV: name, email, phone, source", icon: Globe },
    { href: "/admin/inquiries", title: "Import Inquiries", description: "Convert property inquiries to leads.", icon: Upload },
  ];

  return (
    <div className="space-y-8">
      <SettingsCardGrid cards={cards} />
      <div id="leads-csv" className="rounded-2xl border bg-white p-6 max-w-lg">
        <h3 className="font-semibold mb-2">Bulk import leads (CSV)</h3>
        <p className="text-sm text-slate-500 mb-4">
          Header row: name, email, phone, source, stage, notes
        </p>
        <input
          type="file"
          accept=".csv"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importCsv(f);
          }}
        />
        {msg && <p className="mt-3 text-sm text-emerald-700">{msg}</p>}
      </div>
    </div>
  );
}

export function ExportHub() {
  const cards = [
    { href: "/api/admin/platform/export-leads", title: "Export Leads", description: "Download your leads data.", icon: Globe },
    { href: "/api/admin/platform/export-tasks", title: "Export Tasks", description: "Download lead tasks.", icon: List },
    { href: "/api/admin/platform/export-showings", title: "Export Site Visits", description: "Download site visit requests.", icon: Upload },
    { href: "/admin/platform/bulk-jobs", title: "Export History", description: "View audit logs for downloads.", icon: Download },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          const isApi = c.href.startsWith("/api/");
          const inner = (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold">{c.title}</h3>
              <p className="text-sm text-slate-500">{c.description}</p>
            </>
          );
          if (isApi) {
            return (
              <a
                key={c.href}
                href={c.href}
                className="rounded-2xl border bg-white p-6 hover:border-brand block"
              >
                {inner}
              </a>
            );
          }
          return (
            <Link key={c.href} href={c.href} className="rounded-2xl border bg-white p-6 hover:border-brand block">
              {inner}
            </Link>
          );
        })}
      </div>
      <p className="text-sm text-slate-500">
        Template exports open as CSV download. Configure WhatsApp/SMS templates under{" "}
        <Link href="/admin/crm/settings" className="text-brand-hover underline">
          CRM settings
        </Link>
        .
      </p>
    </div>
  );
}
