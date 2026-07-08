"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

type Goal = {
  id: string;
  title: string;
  target: number;
  current: number;
  period: string;
  owner: { name: string } | null;
};

export function GoalsManager({ goals }: { goals: Goal[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState(10);
  const [period, setPeriod] = useState("monthly");

  async function add() {
    if (!title.trim()) return;
    await fetch("/api/admin/platform/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, target, period }),
    });
    setTitle("");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border bg-white p-6 max-w-md space-y-3">
        <h3 className="font-semibold">Add goal</h3>
        <div>
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label>Target</Label>
          <Input type="number" value={target} onChange={(e) => setTarget(Number(e.target.value))} />
        </div>
        <div>
          <Label>Period</Label>
          <select className="w-full rounded-xl border px-3 py-2" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <Button onClick={add}>Add goal</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {goals.map((g) => {
          const pct = g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
          return (
            <div key={g.id} className="rounded-2xl border bg-white p-6">
              <h3 className="font-semibold">{g.title}</h3>
              <p className="text-sm text-slate-500 capitalize">{g.period}</p>
              <p className="mt-2 text-2xl font-bold">
                {g.current} / {g.target}
              </p>
              <div className="mt-3 h-2 rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-slate-400 mt-2">{g.owner?.name ?? "All team"}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
