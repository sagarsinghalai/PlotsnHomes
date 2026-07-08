"use client";

import type { SubscriptionStatus } from "@prisma/client";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { INTERVAL_LABELS, STATUS_LABELS } from "@/lib/subscription";
import { formatCurrency } from "@/lib/utils";

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
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1000px]">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3.5 text-left">Subscriber</th>
                <th className="px-5 py-3.5 text-left">Plan</th>
                <th className="px-5 py-3.5 text-left">Billing cycle</th>
                <th className="px-5 py-3.5 text-left">Amount</th>
                <th className="px-5 py-3.5 text-left">Status</th>
                <th className="px-5 py-3.5 text-left">Period</th>
                <th className="px-5 py-3.5 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                  <td className="px-5 py-4">
                    <Link href={`/admin/users/${s.user.id}`} className="font-semibold hover:text-gold-dark">
                      {s.user.name}
                    </Link>
                    <p className="text-xs text-slate-500">{s.user.email}</p>
                    <span className="text-[10px] rounded bg-slate-100 px-1.5 py-0.5">{s.user.role}</span>
                  </td>
                  <td className="px-5 py-4 font-medium">{s.plan.name}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-md bg-indigo-50 text-indigo-800 px-2 py-0.5 text-xs font-medium">
                      {INTERVAL_LABELS[s.plan.interval as keyof typeof INTERVAL_LABELS] ??
                        s.plan.interval}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-semibold">{formatCurrency(s.amount)}</td>
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
                  <td className="px-5 py-4 text-xs text-slate-600 whitespace-nowrap">
                    <p>{new Date(s.currentPeriodStart).toLocaleDateString()} →</p>
                    <p>
                      {s.currentPeriodEnd
                        ? new Date(s.currentPeriodEnd).toLocaleDateString()
                        : "Lifetime"}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/users/${s.user.id}`}
                      className="text-xs text-gold-dark hover:underline"
                    >
                      View user
                    </Link>
                  </td>
                </tr>
              ))}
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
