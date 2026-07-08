"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        role: fd.get("role"),
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
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="font-display text-3xl font-bold text-slate-900">Create account</h1>
      <p className="mt-2 text-slate-600">Join PlotsnHomes as buyer, seller, or agent</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div>
          <Label>Full name</Label>
          <Input name="name" required />
        </div>
        <div>
          <Label>Email</Label>
          <Input name="email" type="email" required />
        </div>
        <div>
          <Label>Password (min 8 characters)</Label>
          <Input name="password" type="password" required minLength={8} />
        </div>
        <div>
          <Label>I am a</Label>
          <select
            name="role"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
            defaultValue="BUYER"
          >
            <option value="BUYER">Buyer</option>
            <option value="SELLER">Seller</option>
            <option value="AGENT">Agent</option>
          </select>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" variant="gold" className="w-full" loading={loading}>
          Register
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account? <Link href="/login" className="font-medium text-gold-dark">Log in</Link>
      </p>
    </div>
  );
}
