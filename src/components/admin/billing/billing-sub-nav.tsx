"use client";

import Link from "next/link";
import { CreditCard, Layers, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin/billing", label: "Overview", icon: CreditCard, exact: true },
  { href: "/admin/billing/plans", label: "Plans", icon: Layers },
  { href: "/admin/billing/subscriptions", label: "Subscribers", icon: Users },
];

export function BillingSubNav({ active }: { active: "overview" | "plans" | "subscriptions" }) {
  return (
    <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm mb-6">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive =
          (active === "overview" && tab.exact) ||
          (active === "plans" && tab.href.includes("/plans")) ||
          (active === "subscriptions" && tab.href.includes("/subscriptions"));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition",
              isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
