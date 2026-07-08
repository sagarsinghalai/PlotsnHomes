"use client";

import { Role } from "@prisma/client";
import { Trash2, UserCheck, UserX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { activityLabel, isUserOnline } from "@/lib/user-activity";

type UserRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  active: boolean;
  lastActiveAt: string | null;
  createdAt: string;
  _count: { properties: number; transactions: number };
};

export function UsersManager({ users }: { users: UserRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function patchUser(id: string, body: Record<string, unknown>) {
    setBusy(id);
    setError("");
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) {
      setError(data.error ?? "Update failed");
      return;
    }
    router.refresh();
  }

  async function deleteUser(id: string, name: string) {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    setBusy(id);
    setError("");
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) {
      setError(data.error ?? "Delete failed");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Listings</th>
              <th className="px-4 py-3">Txns</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const last = u.lastActiveAt ? new Date(u.lastActiveAt) : null;
              const act = activityLabel(last);
              const online = isUserOnline(last);
              return (
                <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          !u.active
                            ? "bg-red-500"
                            : online
                              ? "bg-emerald-500 animate-pulse"
                              : act.tone === "recent"
                                ? "bg-amber-400"
                                : "bg-slate-300"
                        }`}
                      />
                      <span className="text-xs">
                        {!u.active ? "Disabled" : act.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <input
                      type="tel"
                      defaultValue={u.phone ?? ""}
                      disabled={busy === u.id}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v !== (u.phone ?? "")) patchUser(u.id, { phone: v || null });
                      }}
                      placeholder="+1 555..."
                      className="w-32 rounded-lg border border-slate-200 px-2 py-1 text-xs"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      disabled={busy === u.id}
                      onChange={(e) =>
                        patchUser(u.id, { role: e.target.value as Role })
                      }
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                    >
                      {Object.values(Role).map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">{u._count.properties}</td>
                  <td className="px-4 py-3">{u._count.transactions}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        className="!px-2 !py-1 text-xs"
                        disabled={busy === u.id}
                        onClick={() => patchUser(u.id, { active: !u.active })}
                      >
                        {u.active ? (
                          <UserX className="h-3.5 w-3.5" />
                        ) : (
                          <UserCheck className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="danger"
                        className="!px-2 !py-1 text-xs"
                        disabled={busy === u.id}
                        onClick={() => deleteUser(u.id, u.name)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
