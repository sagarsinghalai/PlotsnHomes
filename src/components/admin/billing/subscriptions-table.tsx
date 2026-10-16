"use client";

import type { SubscriptionStatus } from "@prisma/client";
import { Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { INTERVAL_LABELS, STATUS_LABELS } from "@/lib/subscription";
import { formatCurrency } from "@/lib/utils";
import { TableToolbarManager } from "@/components/ui/table-toolbar-manager";
import { useTableColumns, useCustomCellData } from "@/hooks/use-table-columns";
import { EditableCell } from "@/components/ui/editable-cell";
import { useHorizontalScroll } from "@/hooks/use-horizontal-scroll";
import { TableScrollButtons } from "@/components/ui/table-scroll-buttons";

type SubRow = {
  id: string;
  status: SubscriptionStatus;
  amount: number;
  currency: string;
  currentPeriodStart: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  notes: string | null;
  user: { id: string; name: string; email: string; role: string };
  plan: { id: string; name: string; interval: string; slug: string };
};

type PlanOption = { id: string; name: string; interval: string; price: number };
type UserOption = { id: string; name: string; email: string; role: string };

const STATUSES: SubscriptionStatus[] = [
  "ACTIVE",
  "TRIALING",
  "PAST_DUE",
  "CANCELLED",
  "EXPIRED",
  "PAUSED",
];

export function SubscriptionsTable({
  subscriptions,
  plans,
  users,
}: {
  subscriptions: SubRow[];
  plans: PlanOption[];
  users: UserOption[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterInterval, setFilterInterval] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({ userId: "", planId: plans[0]?.id ?? "", notes: "" });

  const { getCellValue, updateCell } = useCustomCellData("subscriptions_table");
  const {
    columns,
    visibleColumnIds,
    toggleColumn,
    addCustomColumn,
    updateCustomColumn,
    removeCustomColumn,
    resetColumns,
    isColumnVisible,
  } = useTableColumns("subscriptions_table", [
    { id: "subscriber", label: "Subscriber", defaultVisible: true },
    { id: "plan", label: "Plan", defaultVisible: true },
    { id: "cycle", label: "Billing Cycle", defaultVisible: true },
    { id: "amount", label: "Amount", defaultVisible: true },
    { id: "status", label: "Status", defaultVisible: true },
    { id: "period", label: "Period", defaultVisible: true },
    { id: "actions", label: "Actions", defaultVisible: true },
  ]);

  const filtered = useMemo(() => {
    return subscriptions.filter((s) => {
      if (filterStatus && s.status !== filterStatus) return false;
      if (filterInterval && s.plan.interval !== filterInterval) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !s.user.name.toLowerCase().includes(q) &&
          !s.user.email.toLowerCase().includes(q) &&
          !s.plan.name.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [subscriptions, search, filterStatus, filterInterval]);

  async function updateStatus(id: string, status: SubscriptionStatus) {
    setBusy(id);
    await fetch(`/api/admin/billing/subscriptions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(null);
    router.refresh();
  }

  async function assign() {
    if (!assignForm.userId || !assignForm.planId) return;
    setBusy("assign");
    const res = await fetch("/api/admin/billing/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(assignForm),
    });
    setBusy(null);
    if (res.ok) {
      setAssignOpen(false);
      router.refresh();
    } else {
      alert((await res.json()).error ?? "Assign failed");
    }
  }

  const { ref: tableScrollRef, canScrollLeft, canScrollRight, scroll } = useHorizontalScroll([filtered, visibleColumnIds]);

  const hasActiveFilters = search !== "" || filterStatus !== "" || filterInterval !== "";
  const clearAllFilters = () => {
    setSearch("");
    setFilterStatus("");
    setFilterInterval("");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap justify-between gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Search user, email, plan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="gold" onClick={() => setAssignOpen(true)}>
            <Plus className="h-4 w-4" />
            Assign subscription
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          <select
            className="rounded-lg border px-3 py-2 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border px-3 py-2 text-sm"
            value={filterInterval}
            onChange={(e) => setFilterInterval(e.target.value)}
          >
            <option value="">All billing cycles</option>
            <option value="MONTHLY">Monthly</option>
            <option value="QUARTERLY">Quarterly</option>
            <option value="YEARLY">Yearly / Annual</option>
            <option value="LIFETIME">Lifetime</option>
          </select>
          <button
            type="button"
            onClick={clearAllFilters}
            disabled={!hasActiveFilters}
            title={hasActiveFilters ? "Clear all filters" : "No filters applied"}
            className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-bold transition disabled:opacity-40 disabled:cursor-not-allowed ${
              hasActiveFilters
                ? "border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100"
                : "border-slate-300 bg-white text-slate-800"
            }`}
          >
            <X className="h-4 w-4 stroke-[2.5]" /> Clear All
          </button>
          <TableScrollButtons
            canScrollLeft={canScrollLeft}
            canScrollRight={canScrollRight}
            onScroll={scroll}
            className="ml-auto"
          />
        </div>
      </div>

      <TableToolbarManager
        tableTitle="Subscriptions Directory"
        addRowLabel="Assign Subscription"
        onAddRow={() => setAssignOpen(true)}
        columns={columns}
        visibleColumnIds={visibleColumnIds}
        onToggleColumn={toggleColumn}
        onAddCustomColumn={addCustomColumn}
        onUpdateCustomColumn={updateCustomColumn}
        onRemoveCustomColumn={removeCustomColumn}
        onResetColumns={resetColumns}
      />

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div ref={tableScrollRef} className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1000px]">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {isColumnVisible("subscriber") && <th className="px-5 py-3.5 text-left">Subscriber</th>}
                {isColumnVisible("plan") && <th className="px-5 py-3.5 text-left">Plan</th>}
                {isColumnVisible("cycle") && <th className="px-5 py-3.5 text-left">Billing cycle</th>}
                {isColumnVisible("amount") && <th className="px-5 py-3.5 text-left">Amount</th>}
                {isColumnVisible("status") && <th className="px-5 py-3.5 text-left">Status</th>}
                {isColumnVisible("period") && <th className="px-5 py-3.5 text-left">Period</th>}
                {columns.filter((c) => c.isCustom && isColumnVisible(c.id)).map((c) => (
                  <th key={c.id} className="px-5 py-3.5 text-left text-amber-700 font-mono">{c.label}</th>
                ))}
                {isColumnVisible("actions") && <th className="px-5 py-3.5 text-left">Actions</th>}
                <th className="px-3 py-3.5 text-center w-12 border-l border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      const btn = document.querySelector('[data-column-manager-btn]') as HTMLButtonElement;
                      if (btn) btn.click();
                    }}
                    className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-slate-300 bg-white text-slate-900 font-bold hover:bg-slate-100 shadow-xs transition"
                    title="Add / Customize Columns & Fields"
                  >
                    <Plus className="h-4 w-4 stroke-[2.5]" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                  {isColumnVisible("subscriber") && (
                    <td className="px-5 py-4">
                      <Link href={`/admin/users/${s.user.id}`} className="font-semibold hover:text-gold-dark">
                        {s.user.name}
                      </Link>
                      <p className="text-xs text-slate-500">{s.user.email}</p>
                      <span className="text-[10px] rounded bg-slate-100 px-1.5 py-0.5">{s.user.role}</span>
                    </td>
                  )}
                  {isColumnVisible("plan") && <td className="px-5 py-4 font-medium">{s.plan.name}</td>}
                  {isColumnVisible("cycle") && (
                    <td className="px-5 py-4">
                      <span className="rounded-md bg-indigo-50 text-indigo-800 px-2 py-0.5 text-xs font-medium">
                        {INTERVAL_LABELS[s.plan.interval as keyof typeof INTERVAL_LABELS] ??
                          s.plan.interval}
                      </span>
                    </td>
                  )}
                  {isColumnVisible("amount") && <td className="px-5 py-4 font-semibold" suppressHydrationWarning>{formatCurrency(s.amount)}</td>}
                  {isColumnVisible("status") && (
                    <td className="px-5 py-4">
                      <select
                        disabled={busy === s.id}
                        value={s.status}
                        onChange={(e) => updateStatus(s.id, e.target.value as SubscriptionStatus)}
                        className={`rounded-lg border px-2 py-1 text-xs font-medium ${
                          s.status === "ACTIVE" || s.status === "TRIALING"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : s.status === "PAST_DUE"
                              ? "border-red-200 bg-red-50 text-red-800"
                              : "border-slate-200"
                        }`}
                      >
                        {STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {STATUS_LABELS[st]}
                          </option>
                        ))}
                      </select>
                      {s.cancelAtPeriodEnd && (
                        <p className="text-[10px] text-amber-600 mt-1">Cancels at period end</p>
                      )}
                    </td>
                  )}
                  {isColumnVisible("period") && (
                    <td className="px-5 py-4 text-xs text-slate-600 whitespace-nowrap" suppressHydrationWarning>
                      <p>{new Date(s.currentPeriodStart).toLocaleDateString("en-IN")} →</p>
                      <p>
                        {s.currentPeriodEnd
                          ? new Date(s.currentPeriodEnd).toLocaleDateString("en-IN")
                          : "Lifetime"}
                      </p>
                    </td>
                  )}
                  {columns.filter((c) => c.isCustom && isColumnVisible(c.id)).map((c) => (
                    <td key={c.id} className="px-4 py-3 min-w-[140px]" onClick={(e) => e.stopPropagation()}>
                      <EditableCell
                        value={getCellValue(s.id, c.id)}
                        fieldType={c.fieldType}
                        options={c.options}
                        placeholder={`+ Enter ${c.label}...`}
                        onChange={(val) => updateCell(s.id, c.id, val)}
                      />
                    </td>
                  ))}
                  {isColumnVisible("actions") && (
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/users/${s.user.id}`}
                        className="text-xs text-gold-dark font-bold hover:underline"
                      >
                        View user
                      </Link>
                    </td>
                  )}
                  <td className="px-3 py-3.5 text-center border-l border-slate-100"></td>
                </tr>
              ))}

              <tr className="bg-slate-50/50 hover:bg-slate-50 transition">
                <td colSpan={15} className="px-5 py-3 text-left">
                  <button
                    type="button"
                    onClick={() => setAssignOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 transition"
                  >
                    <Plus className="h-4 w-4 text-amber-600 stroke-[2.5]" />
                    <span>+ Add New Subscription Row</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="p-12 text-center text-slate-500">No subscriptions match your filters.</p>
        )}
      </div>

      {assignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 space-y-4">
            <h3 className="text-lg font-bold">Assign subscription</h3>
            <div>
              <Label>User</Label>
              <select
                className="w-full rounded-xl border px-3 py-2.5 text-sm mt-1"
                value={assignForm.userId}
                onChange={(e) => setAssignForm((f) => ({ ...f, userId: e.target.value }))}
              >
                <option value="">Select user</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email}) — {u.role}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Plan</Label>
              <select
                className="w-full rounded-xl border px-3 py-2.5 text-sm mt-1"
                value={assignForm.planId}
                onChange={(e) => setAssignForm((f) => ({ ...f, planId: e.target.value }))}
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {INTERVAL_LABELS[p.interval as keyof typeof INTERVAL_LABELS]} (
                    {formatCurrency(p.price)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Input
                value={assignForm.notes}
                onChange={(e) => setAssignForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setAssignOpen(false)}>
                Cancel
              </Button>
              <Button variant="gold" disabled={busy === "assign"} onClick={assign}>
                Assign
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
