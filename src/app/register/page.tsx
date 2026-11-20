"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/auth/auth-showcase";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Briefcase, Building2, Home, User } from "lucide-react";

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

  const currentRoleInfo = ROLE_OPTIONS.find((r) => r.key === selectedRole) ?? ROLE_OPTIONS[0];

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
    <AuthShell intent="join">
      <p className="hidden text-sm font-semibold text-slate-950 sm:block">PlotsnHomes</p>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:mt-5 sm:text-3xl">Get started</h1>
      <p className="mt-1 text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[#2563EB] hover:underline">
          Sign in
        </Link>
      </p>

      <form onSubmit={onSubmit} className="mt-3 space-y-2.5 sm:mt-5 sm:space-y-3">
        <div>
          <Label>Account type</Label>
          <div className="grid grid-cols-2 gap-2">
            {ROLE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const selected = selectedRole === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSelectedRole(opt.key)}
                  className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-left transition ${
                    selected
                      ? "border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8]"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>
                    <span className="block text-sm font-semibold">{opt.title}</span>
                    <span className="block text-[11px] font-medium text-slate-500">{opt.badge}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 hidden text-xs leading-4 text-slate-500 sm:line-clamp-2 sm:block">{currentRoleInfo.description}</p>
        </div>

        <div>
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            name="name"
            placeholder="Your name"
            required
            autoComplete="name"
            className="min-h-10 rounded-xl border-slate-200 py-2"
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
            className="min-h-10 rounded-xl border-slate-200 py-2"
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="At least 8 characters"
            required
            minLength={8}
            autoComplete="new-password"
            className="min-h-10 rounded-xl border-slate-200 py-2"
          />
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <Button
          type="submit"
          className="h-11 w-full rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
          loading={loading}
        >
          Create {currentRoleInfo.title.toLowerCase()} account
        </Button>
      </form>
    </AuthShell>
  );
}
