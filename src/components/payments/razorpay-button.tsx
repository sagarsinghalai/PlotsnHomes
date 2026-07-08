"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// ── Razorpay global type ────────────────────────────────────────────────────
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void; confirm_close?: boolean };
  method?: string;
  handler: (response: RazorpayResponse) => void;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
}

// ── Props ────────────────────────────────────────────────────────────────────
interface RazorpayButtonProps {
  orderId: string;
  amount: number;        // in paise
  currency: string;
  keyId: string;
  transactionId: string;
  description: string;
  prefill?: { name?: string; email?: string };
  preferredMethod?: string;
  /**
   * When true the Razorpay checkout modal opens automatically as soon as the
   * SDK is ready — no second button click needed. This is the professional UX.
   */
  autoOpen?: boolean;
  onSuccess?: (transactionId: string) => void;
  onError?: (error: string) => void;
  /** Called when the user closes the Razorpay modal without paying. */
  onDismiss?: () => void;
  children?: React.ReactNode;
  className?: string;
}

// ── Component ────────────────────────────────────────────────────────────────
/**
 * Loads the Razorpay JS SDK dynamically and triggers the payment modal.
 * Set autoOpen={true} to open the modal immediately without a second click.
 */
export function RazorpayButton({
  orderId,
  amount,
  currency,
  keyId,
  transactionId,
  description,
  prefill,
  preferredMethod,
  autoOpen = false,
  onSuccess,
  onError,
  onDismiss,
  children,
  className = "",
}: RazorpayButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const rzpRef = useRef<RazorpayInstance | null>(null);
  const autoOpenFiredRef = useRef(false);

  // ── 1. Load Razorpay SDK once on mount ────────────────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined" && window.Razorpay) {
      setSdkReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setSdkReady(true);
    script.onerror = () => {
      console.error("[PlotsnHomes] Failed to load Razorpay SDK");
      onError?.("Could not load Razorpay. Please check your internet connection.");
    };
    document.body.appendChild(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 2. Server-side signature verification ────────────────────────────────
  const verifyAndComplete = useCallback(
    async (response: RazorpayResponse) => {
      setLoading(true);
      try {
        const res = await fetch("/api/checkout/razorpay-verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature,
            transactionId,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error ?? "Payment verification failed");
        }

        onSuccess?.(transactionId);
        router.push(
          `/dashboard/transactions?success=1&razorpay_payment_id=${response.razorpay_payment_id}`
        );
        router.refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Payment verification failed";
        onError?.(msg);
        setLoading(false);
      }
    },
    [transactionId, onSuccess, onError, router]
  );

  // ── 3. Open the Razorpay checkout modal ──────────────────────────────────
  const openModal = useCallback(() => {
    if (!sdkReady || !window.Razorpay) {
      onError?.("Razorpay SDK not loaded. Please refresh the page.");
      return;
    }

    setLoading(true);

    const options: RazorpayOptions = {
      key: keyId,
      amount,
      currency,
      name: "PlotsnHomes",
      description,
      order_id: orderId,
      prefill: {
        name: prefill?.name ?? "",
        email: prefill?.email ?? "",
      },
      theme: { color: "#b8860b" }, // PlotsnHomes gold
      modal: {
        ondismiss: () => {
          setLoading(false);
          onDismiss?.();
        },
        confirm_close: true,
      },
      handler: verifyAndComplete,
    };

    // Pre-select payment method when specified
    if (preferredMethod && preferredMethod !== "all") {
      options.method = preferredMethod;
    }

    rzpRef.current = new window.Razorpay(options);
    rzpRef.current.open();
  }, [
    sdkReady,
    keyId,
    amount,
    currency,
    description,
    orderId,
    prefill,
    preferredMethod,
    verifyAndComplete,
    onDismiss,
    onError,
  ]);

  // ── 4. Auto-open once SDK is ready (fires only once) ─────────────────────
  useEffect(() => {
    if (autoOpen && sdkReady && !autoOpenFiredRef.current) {
      autoOpenFiredRef.current = true;
      openModal();
    }
  }, [autoOpen, sdkReady, openModal]);

  // ── 5. Render ──────────────────────────────────────────────────────────────
  return (
    <button
      type="button"
      onClick={openModal}
      disabled={loading || !sdkReady}
      className={className}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Processing…
        </span>
      ) : (
        children
      )}
    </button>
  );
}
