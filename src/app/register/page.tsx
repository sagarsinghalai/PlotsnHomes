"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  ShieldCheck,
  Briefcase,
  Building2,
  Home,
  User,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export type RegisterRole = "EMPLOYEE" | "AGENT" | "SELLER" | "BUYER";

interface RoleOption {
  key: RegisterRole;
  title: string;
  subtitle: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    key: "EMPLOYEE",
    title: "Employee",
    subtitle: "Admin Staff & Operations",
    badge: "Operations",
    description: "Manage lead pipelines, showings, user inquiries, and daily CRM operations.",
    icon: Briefcase,
  },
  {
    key: "AGENT",
    title: "Agent",
    subtitle: "Real Estate Broker / Agent",
    badge: "Agent Portal",
    description: "Manage client leads, list luxury properties, track commissions, and schedule property tours.",
    icon: Building2,
  },
  {
    key: "SELLER",
    title: "Seller",
    subtitle: "Property Owner / Seller",
    badge: "Listings",
    description: "Post residential plots, commercial properties, and track buyer inquiries in real-time.",
    icon: Home,
  },
  {
    key: "BUYER",
    title: "Customer",
    subtitle: "Property Buyer / Client",
    badge: "Buyer",
    description: "Browse verified listings, calculate area values, apply for loans, and book property tours.",
    icon: User,
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<RegisterRole>("BUYER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const currentRoleInfo = ROLE_OPTIONS.find((r) => r.key === selectedRole) ?? ROLE_OPTIONS[4];

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        email: fd.get("email"),
        password: fd.get("password"),
        role: selectedRole,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Registration failed");
      setLoading(false);
      return;
    }

    router.push("/login?registered=1");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-900">
          <Sparkles className="h-3.5 w-3.5 text-brand-hover" /> Select Account Type
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900">
          Join PlotsnHomes
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Select your role below to get started with a tailored portal experience.
        </p>
      </div>

      {/* ─── 1. Role Selection Cards (4 Public Roles) ───────────────────────── */}
      <div className="mt-10 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {ROLE_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selectedRole === opt.key;

          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setSelectedRole(opt.key)}
              className={`relative flex flex-col justify-between text-left rounded-2xl p-5 border transition-all duration-200 shadow-sm cursor-pointer ${
                isSelected
                  ? "border-brand bg-amber-50/70 ring-2 ring-brand/40 shadow-md"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
              }`}
            >
              {/* Active Checkmark Badge */}
              <div className="flex items-center justify-between">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                    isSelected ? "bg-brand text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>

                {isSelected ? (
                  <CheckCircle2 className="h-5 w-5 text-brand-hover" />
                ) : (
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    {opt.badge}
                  </span>
                )}
              </div>

              {/* Title & Description */}
              <div className="mt-4 space-y-1">
                <h3 className="font-bold text-slate-900 text-base">{opt.title}</h3>
                <p className="text-xs font-medium text-slate-500">{opt.subtitle}</p>
                <p className="text-[11px] text-slate-400 leading-snug pt-1">
                  {opt.description}
                </p>
              </div>

              {/* Selection Bar */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span
                  className={`text-xs font-bold ${
                    isSelected ? "text-brand-hover" : "text-slate-500"
                  }`}
                >
                  {isSelected ? "Selected" : "Select Role"}
                </span>
                <span
                  className={`h-2 w-2 rounded-full ${
                    isSelected ? "bg-brand animate-pulse" : "bg-slate-200"
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* ─── 2. User Details Form (Full Name, Email, Password) ─────────────── */}
      <div className="mt-10 max-w-lg mx-auto">
        <form
          onSubmit={onSubmit}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm"
        >
          {/* Banner showing selected role */}
          <div className="flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200/80 px-4 py-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Role:</span>
              <span className="font-bold text-brand-hover text-sm">{currentRoleInfo.title}</span>
            </div>
            <span className="text-slate-500 font-medium">({currentRoleInfo.subtitle})</span>
          </div>

          <div>
            <Label className="text-slate-700 font-semibold">Full name</Label>
            <Input
              name="name"
              placeholder="e.g. John Doe"
              required
              className="mt-1 rounded-xl border-slate-200 focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          <div>
            <Label className="text-slate-700 font-semibold">Email address</Label>
            <Input
              name="email"
              type="email"
              placeholder="name@example.com"
              required
              className="mt-1 rounded-xl border-slate-200 focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          <div>
            <Label className="text-slate-700 font-semibold">Password (min 8 characters)</Label>
            <Input
              name="password"
              type="password"
              placeholder="••••••••"
              required
              minLength={8}
              className="mt-1 rounded-xl border-slate-200 focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <Button
            type="submit"
            variant="gold"
            className="w-full py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition"
            loading={loading}
          >
            Create {currentRoleInfo.title} Account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-brand-hover hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
