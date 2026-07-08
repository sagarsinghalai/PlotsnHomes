"use client";

import { Role } from "@prisma/client";
import { Pencil, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { hasCrmAccess, isCustomerRole, roleLabel } from "@/lib/roles";
import { activityLabel, isUserOnline } from "@/lib/user-activity";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  role: Role;
  active: boolean;
  lastActiveAt: string | null;
  createdAt: string;
  kycStatus: string | null;
  _count: { properties: number; transactions: number };
};

type Tab = "all" | "customers" | "staff";

export function UsersDirectory({
  users,
  initialSearch = "",
  initialTab = "all",
}: {
  users: UserRow[];
  initialSearch?: string;
  initialTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [search, setSearch] = useState(initialSearch);

  const filtered = useMemo(() => {
    let list = users;
    if (tab === "customers") list = list.filter((u) => isCustomerRole(u.role));
    if (tab === "staff") list = list.filter((u) => hasCrmAccess(u.role));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.phone ?? "").includes(q)
      );
    }
    return list;
  }, [users, tab, search]);

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "all", label: "All users", count: users.length },
    {
      id: "customers",
      label: "Customers",
      count: users.filter((u) => isCustomerRole(u.role)).length,
    },
    {
      id: "staff",
      label: "Staff",
      count: users.filter((u) => hasCrmAccess(u.role)).length,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 -mb-px ${
              tab === t.id
                ? "border-gold text-gold-dark"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="search"
          placeholder="Search name, email, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">User</th>
              <th className="px-5 py-3">Contact</th>
              <th className="px-5 py-3">Location</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">KYC</th>
              <th className="px-5 py-3">Activity</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const last = u.lastActiveAt ? new Date(u.lastActiveAt) : null;
              const act = activityLabel(last);
              const online = u.active && isUserOnline(last);
              const isStaff = hasCrmAccess(u.role);
              return (
                <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">{u.name}</p>
                    <p className="text-xs text-slate-400">Joined {new Date(u.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p>{u.email}</p>
                    <p className="text-slate-500">{u.phone ?? "—"}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{u.city ?? "—"}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        isStaff ? "bg-violet-100 text-violet-800" : "bg-sky-100 text-sky-800"
                      }`}
                    >
                      {roleLabel(u.role)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {u.kycStatus ? (
                      <span
                        className={`text-xs font-medium ${
                          u.kycStatus === "APPROVED"
                            ? "text-emerald-600"
                            : u.kycStatus === "REJECTED"
                              ? "text-red-600"
                              : "text-amber-600"
                        }`}
                      >
                        {u.kycStatus}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Not submitted</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          !u.active ? "bg-red-400" : online ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                      />
                      <span className="text-xs">{!u.active ? "Disabled" : act.label}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit profile
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-slate-500 py-16">No users match your filters.</p>
        )}
      </div>
    </div>
  );
}
