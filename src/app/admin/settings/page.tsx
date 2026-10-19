import { isEmailConfigured } from "@/lib/email";
import { stripeConfigured } from "@/lib/stripe";

export default function AdminSettingsPage() {
  const checks = [
    {
      name: "Email (Resend)",
      ok: isEmailConfigured(),
      hint: isEmailConfigured()
        ? "Real emails will be delivered"
        : "Emails saved to Admin → Emails (dev log)",
      env: "RESEND_API_KEY, EMAIL_FROM",
    },
    {
      name: "Payments (Stripe)",
      ok: stripeConfigured(),
      hint: stripeConfigured()
        ? "Multi-method Checkout: card, ACH, wallets, Cash App, BNPL"
        : "Demo mode — add keys for real card/bank/wallet payments",
      env: "STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET",
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
      <h1 className="font-display text-3xl font-bold text-slate-900">System status</h1>
      <p className="mt-1 text-slate-600">Integration health for email and transactions</p>

      <div className="mt-8 grid gap-4">
        {checks.map((c) => (
          <div
            key={c.name}
            className="rounded-2xl border border-slate-200 bg-white p-6 flex items-start gap-4"
          >
            <span
              className={`mt-1 h-3 w-3 rounded-full shrink-0 ${
                c.ok ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            <div>
              <p className="font-semibold text-slate-900">{c.name}</p>
              <p className="text-sm text-slate-600 mt-1">{c.hint}</p>
              <p className="text-xs text-slate-400 mt-2 font-mono">{c.env}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl bg-slate-900 text-white p-6 text-sm">
        <p className="font-semibold text-brand">Test without API keys</p>
        <ul className="mt-3 space-y-2 text-slate-300 list-disc list-inside">
          <li>See <strong className="text-brand">docs/STRIPE-SETUP.md</strong> for real Stripe setup</li>
          <li>Test card: 4242 4242 4242 4242 — any future expiry, any CVC</li>
          <li>Submit inquiry → Admin → Emails</li>
          <li>Add Resend key for real inbox delivery</li>
        </ul>
      </div>
    </div>
  );
}
