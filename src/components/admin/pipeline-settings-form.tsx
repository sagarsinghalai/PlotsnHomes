"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import type { PipelineConfig } from "@/lib/pipeline-settings";

const STAGES = ["NEW", "CONTACTED", "QUALIFIED", "SITE_VISIT", "NEGOTIATION", "WON", "LOST"];

export function PipelineSettingsForm({ config }: { config: PipelineConfig }) {
  const router = useRouter();
  const [form, setForm] = useState(config);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    await fetch("/api/admin/platform/pipeline", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="max-w-xl space-y-6 rounded-2xl border bg-white p-6">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.lockStages}
          onChange={(e) => setForm((f) => ({ ...f, lockStages: e.target.checked }))}
        />
        Lock stages (sales cannot change stage manually)
      </label>
      <div>
        <Label>Qualified lead stages</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {STAGES.map((s) => (
            <label key={s} className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={form.qualifiedStages.includes(s)}
                onChange={(e) => {
                  setForm((f) => ({
                    ...f,
                    qualifiedStages: e.target.checked
                      ? [...f.qualifiedStages, s]
                      : f.qualifiedStages.filter((x) => x !== s),
                  }));
                }}
              />
              {s.replace("_", " ")}
            </label>
          ))}
        </div>
      </div>
      <div>
        <Label>Booking cancelled → move to stage</Label>
        <select
          className="w-full rounded-xl border px-3 py-2 mt-1"
          value={form.bookingCancelledStage}
          onChange={(e) => setForm((f) => ({ ...f, bookingCancelledStage: e.target.value }))}
        >
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>
      <Button disabled={busy} onClick={save}>
        Save pipeline settings
      </Button>
    </div>
  );
}
