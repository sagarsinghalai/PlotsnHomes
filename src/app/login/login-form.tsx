"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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

  return (
    <div className="min-h-[calc(100vh-10rem)] bg-white flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-slate-900">Welcome back</h1>
          <p className="mt-2 text-slate-600">Sign in to your PlotsnHomes account</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div>
            <Label>Email</Label>
            <Input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label>Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" variant="gold" className="w-full" loading={loading}>
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          No account? <Link href="/register" className="font-medium text-brand-hover">Register</Link>
        </p>
      </div>
    </div>
  );
}

