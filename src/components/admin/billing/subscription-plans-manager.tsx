"use client";

import type { SubscriptionInterval } from "@prisma/client";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { INTERVAL_LABELS, intervalShort, parseFeatures } from "@/lib/subscription";
import { formatCurrency } from "@/lib/utils";
import { TableToolbarManager } from "@/components/ui/table-toolbar-manager";
import { useTableColumns } from "@/hooks/use-table-columns";

type Plan = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  interval: SubscriptionInterval;
  price: number;
  currency: string;
  featuresJson: string | null;
  targetRole: string | null;
  trialDays: number;
  active: boolean;
  sortOrder: number;
  subscriberCount: number;
};

const INTERVALS: SubscriptionInterval[] = ["MONTHLY", "QUARTERLY", "YEARLY", "LIFETIME"];

export function SubscriptionPlansManager({ plans: initial }: { plans: Plan[] }) {
  const router = useRouter();
  const [plans, setPlans] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    interval: "MONTHLY" as SubscriptionInterval,
    price: 0,
    targetRole: "ALL",
    trialDays: 0,
    featuresText: "",
    active: true,
  });

  function openCreate() {
    setForm({
      name: "",
      slug: "",
      description: "",
      interval: "MONTHLY",
      price: 29,
      targetRole: "ALL",
      trialDays: 7,
      featuresText: "Property search\nMarket alerts\nBasic support",
      active: true,
    });
    setEditId(null);
    setModal("create");
  }

  function openEdit(p: Plan) {
    setForm({
      name: p.name,
      slug: p.slug,
      description: p.description ?? "",
      interval: p.interval,
      price: p.price,
      targetRole: p.targetRole ?? "ALL",
      trialDays: p.trialDays,
      featuresText: parseFeatures(p.featuresJson).join("\n"),
      active: p.active,
    });
    setEditId(p.id);
    setModal("edit");
  }

  async function save() {
    setBusy("save");
    const features = form.featuresText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description || undefined,
      interval: form.interval,
      price: form.price,
      targetRole: form.targetRole,
      trialDays: form.trialDays,
      features,
      active: form.active,
    };

    const url =
      modal === "edit" && editId ? `/api/admin/billing/plans/${editId}` : "/api/admin/billing/plans";
    const res = await fetch(url, {
      method: modal === "edit" ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(null);
    if (res.ok) {
      setModal(null);
      router.refresh();
    } else {
      alert((await res.json()).error ?? "Save failed");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this plan?")) return;
    setBusy(id);
    const res = await fetch(`/api/admin/billing/plans/${id}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) {
      setPlans((p) => p.filter((x) => x.id !== id));
      router.refresh();
    }
  }

  const {
    columns,
    visibleColumnIds,
    toggleColumn,
    addCustomColumn,
    removeCustomColumn,
    resetColumns,
  } = useTableColumns("subscription_plans_table", [
    { id: "planName", label: "Plan Name & Slug", defaultVisible: true },
    { id: "pricing", label: "Price & Billing Interval", defaultVisible: true },
    { id: "features", label: "Included Features", defaultVisible: true },
    { id: "role", label: "Target User Role", defaultVisible: true },
    { id: "actions", label: "Actions", defaultVisible: true },
  ]);

  return (
    <div className="space-y-6">
      <TableToolbarManager
        tableTitle="Subscription Plans Settings"
        addRowLabel="Add Plan"
        onAddRow={openCreate}
        columns={columns}
        visibleColumnIds={visibleColumnIds}
        onToggleColumn={toggleColumn}
        onAddCustomColumn={addCustomColumn}
        onRemoveCustomColumn={removeCustomColumn}
        onResetColumns={resetColumns}
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.id}
            className={`rounded-2xl border p-6 flex flex-col ${
              p.active ? "border-slate-200 bg-white shadow-sm" : "border-dashed bg-slate-50 opacity-75"
            }`}
          >
            <div className="flex justify-between items-start gap-2">
              <div>
                <p className="text-xs font-semibold uppercase text-brand-hover">
                  {INTERVAL_LABELS[p.interval]}
                </p>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{p.name}</h3>
                <p className="text-sm text-slate-500">{p.slug}</p>
              </div>
              {!p.active && (
                <span className="text-xs bg-slate-200 px-2 py-0.5 rounded">Inactive</span>
              )}
            </div>
            <p className="mt-4 text-3xl font-bold text-slate-900">
              {formatCurrency(p.price)}
              <span className="text-sm font-normal text-slate-500">{intervalShort(p.interval)}</span>
            </p>
            {p.description && <p className="mt-2 text-sm text-slate-600">{p.description}</p>}
            <ul className="mt-4 space-y-1 text-sm text-slate-600 flex-1">
              {parseFeatures(p.featuresJson)
                .slice(0, 5)
                .map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
            </ul>
            <p className="mt-3 text-xs text-slate-500">
              {p.subscriberCount} subscriber{p.subscriberCount === 1 ? "" : "s"} ·{" "}
              {p.targetRole ?? "ALL"} · {p.trialDays}d trial
            </p>
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" className="!px-3 !py-1.5 text-xs" onClick={() => openEdit(p)}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                variant="secondary"
                className="!px-3 !py-1.5 text-xs"
                disabled={busy === p.id || p.subscriberCount > 0}
                onClick={() => remove(p.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="text-lg font-bold">{modal === "create" ? "New plan" : "Edit plan"}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
              </div>
              <div>
                <Label>Billing cycle</Label>
                <select
                  className="w-full rounded-xl border px-3 py-2.5 text-sm"
                  value={form.interval}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, interval: e.target.value as SubscriptionInterval }))
                  }
                >
                  {INTERVALS.map((i) => (
                    <option key={i} value={i}>
                      {INTERVAL_LABELS[i]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Price (USD)</Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: +e.target.value }))}
                />
              </div>
              <div>
                <Label>Target role</Label>
                <select
                  className="w-full rounded-xl border px-3 py-2.5 text-sm"
                  value={form.targetRole}
                  onChange={(e) => setForm((f) => ({ ...f, targetRole: e.target.value }))}
                >
                  <option value="ALL">All users</option>
                  <option value="BUYER">Buyers</option>
                  <option value="BUYER">Buyers</option>
                  <option value="SELLER">Sellers</option>
                  <option value="AGENT">Agents</option>
                </select>
              </div>
              <div>
                <Label>Trial days</Label>
                <Input
                  type="number"
                  value={form.trialDays}
                  onChange={(e) => setForm((f) => ({ ...f, trialDays: +e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Description</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Features (one per line)</Label>
                <textarea
                  className="w-full rounded-xl border px-3 py-2 text-sm min-h-[100px]"
                  value={form.featuresText}
                  onChange={(e) => setForm((f) => ({ ...f, featuresText: e.target.value }))}
                />
              </div>
              <label className="sm:col-span-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                />
                Plan active (visible for new sign-ups)
              </label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setModal(null)}>
                Cancel
              </Button>
              <Button variant="gold" disabled={busy === "save"} onClick={save}>
                Save plan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
