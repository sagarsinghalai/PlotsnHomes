"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Loader2, ShieldCheck, Sparkles, X, CreditCard } from "lucide-react";

export type PricingPlan = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  interval: string;
  intervalLabel: string;
  priceSuffix: string;
  trialDays: number;
  features: string[];
};

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: amount % 1 === 0 ? 0 : 2 }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

type Result = { ok: true; email: string; plan: string; expiresAt: string | null; message: string } | { ok: false; error: string };

export function PricingPlans({ plans, testMode = true }: { plans: PricingPlan[]; testMode?: boolean }) {
  const [selected, setSelected] = useState<PricingPlan | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", companyName: "", domain: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  function openFor(plan: PricingPlan) {
    setSelected(plan);
    setResult(null);
    setForm({ name: "", email: "", password: "", companyName: "", domain: "" });
  }

  function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const s = document.createElement("script");
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Could not load the payment SDK."));
      document.body.appendChild(s);
    });
  }

  async function finishSignup(proof: Record<string, string>) {
    const res = await fetch("/api/public/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planSlug: selected!.slug, ...form, ...proof }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || "Signup failed");
    setResult(data as Result);
    setLoading(false);
  }

  async function payWithRazorpay(order: any) {
    await loadScript("https://checkout.razorpay.com/v1/checkout.js");
    const rzp = new (window as any).Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
      name: "White-label platform",
      description: `Subscribe to ${selected!.name}`,
      prefill: { name: form.name, email: form.email },
      handler: async (resp: any) => {
        try {
          await finishSignup({
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_signature: resp.razorpay_signature,
          });
        } catch (e: any) {
          setResult({ ok: false, error: e.message || "Payment verification failed" });
          setLoading(false);
        }
      },
      modal: { ondismiss: () => setLoading(false) },
    });
    rzp.open();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setLoading(true);
    setResult(null);
    try {
      // 1. Create the payment order (or learn we're in test mode).
      const orderRes = await fetch("/api/public/signup/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug: selected.slug }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.ok) throw new Error(orderData.error || "Could not start checkout");

      // 2. Pay (or simulate), then provision.
      if (orderData.gateway === "razorpay") {
        await payWithRazorpay(orderData.order);
        return; // the Razorpay handler finishes + unsets loading
      }
      if (orderData.gateway === "test") {
        await finishSignup({});
        return;
      }
      throw new Error("This payment method isn't available from the signup form yet — please contact support.");
    } catch (err: any) {
      setResult({ ok: false, error: err.message || "Signup failed" });
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand">White-label platform</p>
          <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">Launch your own real-estate platform</h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
            Pick a plan and your branded workspace — CRM, listings, WhatsApp hub and more — goes live in minutes on your own domain.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-300 ring-1 ring-amber-400/30">
            <Sparkles className="h-3.5 w-3.5" />
            {testMode ? "Test mode — payments are simulated; no card is charged." : "Secure checkout — pay by card, UPI, net banking and more."}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {plans.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center text-slate-500">
            No plans are available right now. Please check back soon.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((p) => (
              <div key={p.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand/40 hover:shadow-md">
                <h3 className="font-display text-xl font-bold text-slate-900">{p.name}</h3>
                {p.description && <p className="mt-1 text-sm text-slate-500">{p.description}</p>}
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">{money(p.price, p.currency)}</span>
                  <span className="text-sm text-slate-500">{p.priceSuffix}</span>
                </div>
                {p.trialDays > 0 && (
                  <p className="mt-1 text-xs font-medium text-emerald-600">{p.trialDays}-day free trial</p>
                )}
                <ul className="mt-5 flex-1 space-y-2.5">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-hover" /> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => openFor(p)}
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"
                >
                  <CreditCard className="h-4 w-4" /> Subscribe
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="mt-10 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-hover hover:underline">Sign in</Link>
        </p>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !loading && setSelected(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">Subscribe to {selected.name}</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  {money(selected.price, selected.currency)}{selected.priceSuffix}
                </p>
              </div>
              <button onClick={() => !loading && setSelected(null)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>

            {result?.ok ? (
              <div className="mt-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100"><Check className="h-6 w-6 text-emerald-600" /></div>
                <p className="mt-3 font-semibold text-slate-900">{result.message}</p>
                <p className="mt-1 text-sm text-slate-500">
                  Plan: {result.plan}{result.expiresAt ? ` · renews/ends ${new Date(result.expiresAt).toLocaleString()}` : " · no expiry"}
                </p>
                <Link href="/login" className="mt-5 inline-flex items-center justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover">
                  Sign in to your workspace
                </Link>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-5 space-y-3">
                <Field label="Your name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                <Field label="Work email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                <Field label="Password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} hint="At least 8 characters" />
                <Field label="Company / agency name" value={form.companyName} onChange={(v) => setForm({ ...form, companyName: v })} />
                <Field label="Custom domain (optional)" value={form.domain} onChange={(v) => setForm({ ...form, domain: v })} placeholder="acme-realty.com" />

                {result && !result.ok && (
                  <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{result.error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  {loading ? "Processing…" : testMode ? "Create workspace (test)" : "Continue to payment"}
                </button>
                <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {testMode ? "Test mode — no real payment is taken." : "Secured by your payment provider."}
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", hint, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; hint?: string; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      />
      {hint && <span className="mt-0.5 block text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}
