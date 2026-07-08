"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import type { CrmSettings } from "@/lib/crm-settings";
import type { MessageTemplate } from "@/lib/crm-template-utils";

export function CrmSettingsForm({
  settings,
  agents,
}: {
  settings: CrmSettings;
  agents: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState(settings);
  const [sourcesText, setSourcesText] = useState(settings.leadSources.join("\n"));

  async function save() {
    setBusy(true);
    setMsg("");
    const leadSources = sourcesText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const res = await fetch("/api/admin/crm/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        routingMode: form.routingMode,
        autoAssign: form.autoAssign,
        defaultOwnerId: form.defaultOwnerId,
        leadSources,
        messageTemplates: form.messageTemplates,
      }),
    });
    setBusy(false);
    if (res.ok) {
      setMsg("Settings saved.");
      router.refresh();
    } else {
      setMsg("Save failed.");
    }
  }

  function updateTemplate(i: number, patch: Partial<MessageTemplate>) {
    setForm((f) => ({
      ...f,
      messageTemplates: f.messageTemplates.map((t, idx) => (idx === i ? { ...t, ...patch } : t)),
    }));
  }

  function addTemplate() {
    setForm((f) => ({
      ...f,
      messageTemplates: [
        ...f.messageTemplates,
        {
          id: `tpl_${Date.now()}`,
          name: "New template",
          channel: "whatsapp",
          body: "Hi {{name}}, ...",
        },
      ],
    }));
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {msg && <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-4 py-2">{msg}</p>}

      <section className="rounded-2xl border bg-white p-6 space-y-4">
        <h2 className="font-semibold text-lg">Lead routing</h2>
        <div>
          <Label>Assignment mode</Label>
          <select
            className="w-full rounded-xl border px-3 py-2"
            value={form.routingMode}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                routingMode: e.target.value as CrmSettings["routingMode"],
              }))
            }
          >
            <option value="property_agent">Property agent (default)</option>
            <option value="round_robin">Round robin across agents</option>
            <option value="manual">Manual — use default owner only</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.autoAssign}
            onChange={(e) => setForm((f) => ({ ...f, autoAssign: e.target.checked }))}
          />
          Auto-assign owner on new leads (inquiries, site visits, manual create)
        </label>
        <div>
          <Label>Default owner (fallback)</Label>
          <select
            className="w-full rounded-xl border px-3 py-2"
            value={form.defaultOwnerId}
            onChange={(e) => setForm((f) => ({ ...f, defaultOwnerId: e.target.value }))}
          >
            <option value="">— None —</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-6 space-y-4">
        <h2 className="font-semibold text-lg">Lead sources</h2>
        <p className="text-sm text-slate-500">One source per line (used in dropdowns)</p>
        <Textarea value={sourcesText} onChange={(e) => setSourcesText(e.target.value)} className="min-h-[160px]" />
      </section>

      <section className="rounded-2xl border bg-white p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-lg">Message templates</h2>
          <Button variant="secondary" onClick={addTemplate}>
            Add template
          </Button>
        </div>
        <p className="text-sm text-slate-500">
          Use {"{{name}}"}, {"{{property}}"}, {"{{email}}"} in body text.
        </p>
        {form.messageTemplates.map((t, i) => (
          <div key={t.id} className="rounded-xl border p-4 space-y-2">
            <Input value={t.name} onChange={(e) => updateTemplate(i, { name: e.target.value })} placeholder="Template name" />
            <select
              className="w-full rounded-xl border px-3 py-2 text-sm"
              value={t.channel}
              onChange={(e) =>
                updateTemplate(i, { channel: e.target.value as MessageTemplate["channel"] })
              }
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
            {t.channel === "email" && (
              <Input
                value={t.subject ?? ""}
                onChange={(e) => updateTemplate(i, { subject: e.target.value })}
                placeholder="Email subject"
              />
            )}
            <Textarea value={t.body} onChange={(e) => updateTemplate(i, { body: e.target.value })} />
          </div>
        ))}
      </section>

      <Button disabled={busy} onClick={save}>
        Save CRM settings
      </Button>
    </div>
  );
}
