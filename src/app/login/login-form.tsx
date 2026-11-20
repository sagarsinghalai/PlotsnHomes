"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthShell } from "@/components/auth/auth-showcase";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { hasCrmAccess } from "@/lib/roles";

// Staff (incl. agents) land on their work panel; customers on their dashboard.
function homeForRole(role: string | null | undefined): string {
  return role && hasCrmAccess(role as any) ? "/admin" : "/dashboard";
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: session, status } = useSession();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      router.push(params.get("callbackUrl") ?? homeForRole(session?.user?.role));
    }
  }, [status, session, params, router]);

  useEffect(() => {
    if (params.get("reason") === "session-expired") {
      signOut({ redirect: false });
    }
  }, [params]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fd = new FormData(e.currentTarget);
    const emailVal = String(fd.get("email") ?? "").trim().toLowerCase();
    const passwordVal = String(fd.get("password") ?? "").trim();

    const res = await signIn("credentials", {
      email: emailVal,
      password: passwordVal,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    // Route by role (staff → /admin, customers → /dashboard). Use a plain fetch
    // of the session endpoint — next-auth's getSession() can throw on URL
    // construction under some NEXTAUTH_URL/host setups.
    let role: string | null = null;
    try {
      const s = await fetch("/api/auth/session").then((r) => r.json());
      role = s?.user?.role ?? null;
    } catch {
      /* fall back to the default destination */
    }
    router.push(params.get("callbackUrl") ?? homeForRole(role));
    router.refresh();
  }

  const justRegistered = params.get("registered") === "1";

  return (
    <AuthShell>
      <p className="hidden text-sm font-semibold text-slate-950 sm:block">PlotsnHomes</p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:mt-6 sm:text-3xl">Welcome back</h1>
      <p className="mt-1 text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-[#2563EB] hover:underline">
          Create one
        </Link>
      </p>

      {justRegistered && (
        <p className="mt-5 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Account created. Sign in to continue.
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-4 space-y-3 sm:mt-6">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border-slate-200"
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border-slate-200"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="h-11 w-full rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8]" loading={loading}>
          Sign in
        </Button>
      </form>

      <p className="mt-3 text-sm text-slate-500">
        Forgot password?{" "}
        <Link href="/forgot-password" className="font-semibold text-slate-950 hover:underline">
          Reset it
        </Link>
      </p>
    </AuthShell>
  );
}

