"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function PaymentSuccessHandler() {
  const params = useSearchParams();
  const router = useRouter();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState<"idle" | "verifying" | "done" | "error">("idle");

  useEffect(() => {
    if (!sessionId || params.get("demo")) return;

    setStatus("verifying");
    fetch("/api/checkout/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("verify failed");
        setStatus("done");
        router.refresh();
      })
      .catch(() => setStatus("error"));
  }, [sessionId, params, router]);

  if (!sessionId || params.get("demo")) return null;

  if (status === "verifying") {
    return (
      <p className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-blue-800 text-sm">
        Confirming your Stripe payment…
      </p>
    );
  }

  if (status === "error") {
    return (
      <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-amber-800 text-sm">
        Payment received by Stripe. If status still shows PENDING, wait a moment or contact support.
      </p>
    );
  }

  return null;
}
