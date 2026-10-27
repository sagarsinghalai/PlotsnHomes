import Link from "next/link";
import { isEmailConfigured } from "@/lib/email";
import { getMaskedPaymentConfig } from "@/lib/payment-settings";
import { activeSignupGateway } from "@/lib/signup-payment";
import { hasEncKey } from "@/lib/credentials-crypto";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [platform, active] = await Promise.all([getMaskedPaymentConfig(null), activeSignupGateway()]);

  const rzpOn = (platform.razorpay.enabled && !!platform.razorpay.keyId && platform.razorpay.hasKeySecret) || platform.envFallback.razorpay;
  const strOn = (platform.stripe.enabled && !!platform.stripe.publishableKey && platform.stripe.hasSecretKey) || platform.envFallback.stripe;
  const activeLabel =
    active === "test" ? "Test mode — subscription payments are simulated" : `Live — subscriptions collected via ${active === "razorpay" ? "Razorpay" : "Stripe"}`;

  const checks = [
    {
      name: "Email (Resend)",
      ok: isEmailConfigured(),
      hint: isEmailConfigured() ? "Real emails will be delivered" : "Emails saved to Admin → Emails (dev log)",
      env: "RESEND_API_KEY, EMAIL_FROM",
    },
    {
      name: "Subscription gateway (platform)",
      ok: active !== "test",
      hint: activeLabel,
      env: "Settings → Payments · platform gateway",
    },
    {
      name: "Razorpay",
      ok: rzpOn,
      hint: rzpOn
        ? `Configured${platform.envFallback.razorpay && !platform.razorpay.enabled ? " via environment" : " in Settings → Payments"}`
        : "Not configured — add keys in Settings → Payments",
      env: "keyId + keySecret (encrypted) · env: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET",
    },
    {
      name: "Stripe",
      ok: strOn,
      hint: strOn
        ? `Configured${platform.envFallback.stripe && !platform.stripe.enabled ? " via environment" : " in Settings → Payments"}`
        : "Not configured — add keys in Settings → Payments",
      env: "publishableKey + secretKey (encrypted) · env: STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    },
    {
      name: "Secret encryption key",
      ok: hasEncKey(),
      hint: hasEncKey() ? "Payment & integration secrets are encrypted at rest" : "Missing — set before storing any live keys",
      env: "CREDENTIALS_ENC_KEY",
    },
    {
      name: "App URL",
      ok: Boolean(process.env.NEXT_PUBLIC_APP_URL),
      hint: process.env.NEXT_PUBLIC_APP_URL ?? "Not set",
      env: "NEXT_PUBLIC_APP_URL, NEXTAUTH_URL",
    },
    {
      name: "Auth secret",
      ok: Boolean(process.env.NEXTAUTH_SECRET),
      hint: process.env.NEXTAUTH_SECRET ? "Configured" : "Missing",
      env: "NEXTAUTH_SECRET",
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900">System status</h1>
          <p className="mt-1 text-slate-600">Integration health for email, payments and auth</p>
        </div>
        <Link
          href="/admin/payments"
          className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover"
        >
          Configure payment gateways →
        </Link>
      </div>

      <div className="mt-8 grid gap-4">
        {checks.map((c) => (
          <div key={c.name} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6">
            <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${c.ok ? "bg-emerald-500" : "bg-amber-500"}`} />
            <div>
              <p className="font-semibold text-slate-900">{c.name}</p>
              <p className="mt-1 text-sm text-slate-600">{c.hint}</p>
              <p className="mt-2 font-mono text-xs text-slate-400">{c.env}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl bg-slate-900 p-6 text-sm text-white">
        <p className="font-semibold text-brand">How payments resolve</p>
        <ul className="mt-3 list-inside list-disc space-y-2 text-slate-300">
          <li>Each tenant&apos;s own keys collect their customers&apos; payments; the platform keys collect partner subscriptions.</li>
          <li>Resolution order: tenant config → environment keys → test mode (simulated).</li>
          <li>Test cards — Stripe: 4242 4242 4242 4242 · Razorpay: use test-mode keys.</li>
        </ul>
      </div>
    </div>
  );
}
