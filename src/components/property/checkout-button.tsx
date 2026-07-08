"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CheckoutButton({
  propertyId,
  type = "DEPOSIT",
  label = "Pay with Stripe — 10% deposit",
  stripeEnabled = false,
}: {
  propertyId: string;
  type?: "DEPOSIT" | "INVESTMENT" | "LISTING_FEE";
  label?: string;
  stripeEnabled?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function pay() {
    setLoading(true);
    setError("");
    setMessage("");

    if (!stripeEnabled) {
      const demoRes = await fetch("/api/checkout/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, type }),
      });
      const demoData = await demoRes.json();
      if (demoRes.ok && demoData.redirectUrl) {
        router.push(demoData.redirectUrl);
        router.refresh();
        return;
      }
      setError(
        "Stripe not set up. Add STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to .env — see docs/STRIPE-SETUP.md"
      );
      setLoading(false);
      return;
    }

    let res: Response;
    try {
      res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, type }),
      });
    } catch {
      setError("Server not running. Start: npm run dev → http://localhost:3001");
      setLoading(false);
      return;
    }

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
      return;
    }

    setError(data.error ?? "Checkout failed");
    setLoading(false);
  }

  return (
    <div>
      <Button variant="gold" className="w-full" onClick={pay} loading={loading}>
        {stripeEnabled ? label : "Pay deposit (demo mode)"}
      </Button>
      {stripeEnabled && (
        <p className="mt-2 text-xs text-slate-500 text-center">
          Secure checkout powered by Stripe
        </p>
      )}
      {message && <p className="mt-2 text-sm text-emerald-600">{message}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
