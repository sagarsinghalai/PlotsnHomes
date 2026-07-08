"use client";

import { useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Save, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  initialConfigs: string[];
};

export function BhkSettingsForm({ initialConfigs }: Props) {
  const [configs, setConfigs] = useState<string[]>(initialConfigs);
  const [newConfig, setNewConfig] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const addConfig = () => {
    const val = newConfig.trim();
    if (!val) return;
    if (configs.includes(val)) {
      setMessage({ type: "error", text: `"${val}" already exists.` });
      return;
    }
    setConfigs([...configs, val]);
    setNewConfig("");
    setMessage(null);
  };

  const removeConfig = (index: number) => {
    setConfigs(configs.filter((_, i) => i !== index));
    setMessage(null);
  };

  const editConfig = (index: number, val: string) => {
    const next = [...configs];
    next[index] = val;
    setConfigs(next);
    setMessage(null);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...configs];
    const temp = next[index];
    next[index] = next[index - 1];
    next[index - 1] = temp;
    setConfigs(next);
    setMessage(null);
  };

  const moveDown = (index: number) => {
    if (index === configs.length - 1) return;
    const next = [...configs];
    const temp = next[index];
    next[index] = next[index + 1];
    next[index + 1] = temp;
    setConfigs(next);
    setMessage(null);
  };

  const save = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/platform/bhk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configs }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to save settings");
      }
      setMessage({ type: "success", text: "BHK settings saved successfully!" });
    } catch (e: any) {
      setMessage({ type: "error", text: e.message ?? "An error occurred." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {message && (
        <div
          className={`p-4 rounded-xl text-sm border ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Add new configuration</h2>
        <div className="flex gap-2">
          <Input
            value={newConfig}
            onChange={(e) => setNewConfig(e.target.value)}
            placeholder="e.g. 2.5BHK, Penthouse, Duplex..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addConfig();
              }
            }}
          />
          <Button onClick={addConfig} variant="secondary" className="gap-2 shrink-0">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-2 border-b">
          <h2 className="text-lg font-semibold text-slate-900">Manage list options</h2>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
            {configs.length} options defined
          </span>
        </div>

        <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
          {configs.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No options defined yet. Add some options above.</p>
          ) : (
            configs.map((cfg, index) => (
              <div key={index} className="flex items-center gap-3 py-3 group">
                <Input
                  value={cfg}
                  onChange={(e) => editConfig(index, e.target.value)}
                  className="font-medium text-slate-800 focus-visible:ring-1"
                />
                
                <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    className="h-8 w-8 text-slate-500 hover:text-slate-900"
                    disabled={index === 0}
                    onClick={() => moveUp(index)}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 text-slate-500 hover:text-slate-900"
                    disabled={index === configs.length - 1}
                    onClick={() => moveDown(index)}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => removeConfig(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-4 border-t flex justify-end">
          <Button disabled={busy} onClick={save} variant="gold" className="gap-2 px-6">
            {busy ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
