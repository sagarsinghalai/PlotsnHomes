"use client";

import {
  AlertCircle,
  BadgeCheck,
  Building2,
  CheckCircle,
  ChevronDown,
  CreditCard,
  ExternalLink,
  Landmark,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { RazorpayButton } from "@/components/payments/razorpay-button";
import { Button } from "@/components/ui/button";
import {
  calculatePaymentAmount,
  getPlansForProperty,
  PAYMENT_METHODS,
  type PaymentMethodId,
  type PaymentPlanId,
} from "@/lib/payment-plans";
import { formatCurrency } from "@/lib/utils";

const METHOD_ICONS: Record<string, React.ElementType> = {
  card: CreditCard,
  upi: Zap,
  netbanking: Landmark,
  wallet: Wallet,
  emi: Shield,
  bank: Building2,
  all: Smartphone,
};

const STATUS_COLORS: Record<string, string> = {
  upi: "bg-violet-50 border-violet-200 text-violet-700",
  card: "bg-blue-50 border-blue-200 text-blue-700",
  netbanking: "bg-sky-50 border-sky-200 text-sky-700",
  wallet: "bg-pink-50 border-pink-200 text-pink-700",
  emi: "bg-orange-50 border-orange-200 text-orange-700",
  cheque: "bg-slate-50 border-slate-300 text-slate-700",
  neft_rtgs: "bg-slate-50 border-slate-300 text-slate-700",
  all: "bg-emerald-50 border-emerald-200 text-emerald-700",
};

interface CheckoutData {
  provider: "razorpay" | "stripe";
  orderId?: string;
  amount?: number;
  currency?: string;
  keyId?: string;
  transactionId?: string;
  prefill?: { name?: string; email?: string };
  description?: string;
  url?: string;
}

interface OfflineSuccess {
  ok: true;
  redirectUrl: string;
  transactionId: string;
  referenceNo?: string;
}

// ── NEFT / RTGS Bank Details ────────────────────────────────────────────────
const PLOTSNHOMES_BANK = {
  accountName: "PlotsnHomes Realty Pvt. Ltd.",
  accountNumber: "XXXX XXXX XXXX 1234",
  ifsc: "HDFC0001234",
  bank: "HDFC Bank",
  branch: "Connaught Place, New Delhi",
};

export function PaymentOptions({
  propertyId,
  propertyPrice,
  rentMonthly,
  propertyType,
  brokerageRate: propBrokerageRate,
  stripeEnabled: _stripeEnabled,
}: {
  propertyId: string;
  propertyPrice: number;
  rentMonthly: number | null;
  propertyType: string;
  brokerageRate?: number;
  stripeEnabled: boolean;
}) {
  const router = useRouter();
  const plans = useMemo(
    () =>
      getPlansForProperty({
        price: propertyPrice,
        rentMonthly,
        type: propertyType as "RESIDENTIAL" | "COMMERCIAL" | "LAND" | "RENTAL",
      }),
    [propertyPrice, rentMonthly, propertyType]
  );

  const [planId, setPlanId] = useState<PaymentPlanId>(plans[0]?.id ?? "deposit_10");
  const [methodId, setMethodId] = useState<PaymentMethodId>("upi");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkout, setCheckout] = useState<CheckoutData | null>(null);
  const [offlineSuccess, setOfflineSuccess] = useState<OfflineSuccess | null>(null);

  const brokerageRate = propBrokerageRate ?? 3.0;
  const amount = useMemo(
    () => calculatePaymentAmount(planId, { price: propertyPrice, rentMonthly }),
    [planId, propertyPrice, rentMonthly]
  );

  const isOffline = methodId === "cheque" || methodId === "neft_rtgs";
  const platformFee = isOffline ? 0 : Math.round(amount * (brokerageRate / 100) * 100) / 100;
  const sellerPayout = amount - platformFee;

  const selectedMethod = PAYMENT_METHODS.find((m) => m.id === methodId);

  async function initiatePayment() {
    setLoading(true);
    setError("");
    setCheckout(null);
    setOfflineSuccess(null);

    const body = { propertyId, plan: planId, paymentMethod: methodId };

    let res: Response;
    try {
      res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      setError("Cannot reach server. Make sure the app is running.");
      setLoading(false);
      return;
    }

    const data: (CheckoutData | OfflineSuccess) & { error?: string; useDemo?: boolean } = await res.json();

    // ── Server says: no payment gateway configured → fall back to demo ──────
    if (!res.ok && (data as { useDemo?: boolean }).useDemo) {
      const demoRes = await fetch("/api/checkout/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const demoData = await demoRes.json();
      if (demoRes.ok && demoData.redirectUrl) {
        router.push(demoData.redirectUrl);
        router.refresh();
        return;
      }
      setError(demoData.error ?? "Demo payment failed");
      setLoading(false);
      return;
    }

    if (!res.ok) {
      setError((data as { error?: string }).error ?? "Checkout failed");
      setLoading(false);
      return;
    }

    // ── Offline payment (Cheque / NEFT / RTGS) ────────────────────────────
    const offlineData = data as OfflineSuccess;
    if (offlineData.ok && offlineData.redirectUrl) {
      setOfflineSuccess(offlineData);
      setLoading(false);
      return;
    }

    // ── Stripe: redirect directly ────────────────────────────────────────────
    const checkoutData = data as CheckoutData;
    if (checkoutData.provider === "stripe" && checkoutData.url) {
      window.location.href = checkoutData.url;
      return;
    }

    // ── Razorpay: store order and auto-open modal ────────────────────────────
    if (checkoutData.provider === "razorpay") {
      setCheckout(checkoutData);
      setLoading(false);
      return;
    }

    setError("Unexpected response from server");
    setLoading(false);
  }

  // ── Offline success screen ─────────────────────────────────────────────────
  if (offlineSuccess) {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-bold text-emerald-900 text-sm">Transaction Recorded!</p>
              <p className="text-xs text-emerald-700">Pending confirmation upon payment clearance</p>
            </div>
          </div>
          {offlineSuccess.referenceNo && (
            <div className="rounded-xl bg-white border border-emerald-200 px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Reference No.</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{offlineSuccess.referenceNo}</span>
            </div>
          )}
        </div>

        {methodId === "neft_rtgs" && (
          <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">NEFT / RTGS Transfer Details</p>
            </div>
            {[
              ["Account Name", PLOTSNHOMES_BANK.accountName],
              ["Account Number", PLOTSNHOMES_BANK.accountNumber],
              ["IFSC Code", PLOTSNHOMES_BANK.ifsc],
              ["Bank", PLOTSNHOMES_BANK.bank],
              ["Branch", PLOTSNHOMES_BANK.branch],
              ["Amount to Transfer", formatCurrency(amount)],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-slate-500">{label}</span>
                <span className="text-xs font-semibold text-slate-900 font-mono">{value}</span>
              </div>
            ))}
            <div className="px-4 py-3 bg-amber-50 border-t border-amber-100">
              <p className="text-xs text-amber-800">
                <span className="font-bold">Important:</span> Use your registered email or Reference No.{" "}
                <strong>{offlineSuccess.referenceNo}</strong> as the transfer remarks.
              </p>
            </div>
          </div>
        )}

        {methodId === "cheque" && (
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Cheque Payment Details</p>
            </div>
            <div className="px-4 py-4 space-y-2 text-sm">
              <p className="text-slate-700">
                Draw cheque in favour of: <span className="font-bold text-slate-900">{PLOTSNHOMES_BANK.accountName}</span>
              </p>
              <p className="text-xs text-slate-500">
                Write your Ref. No. <strong>{offlineSuccess.referenceNo}</strong> on the back of the cheque.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            <strong>Brokerage fee: ₹0</strong> — No platform fee is charged for offline payments. 
            100% of {formatCurrency(amount)} goes directly to the builder/seller.
          </p>
        </div>

        <button
          onClick={() => router.push("/dashboard/transactions")}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          View Transaction History
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Step 1 — Payment plan */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          1. Payment amount
        </p>
        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {plans.map((plan) => {
            const amt = calculatePaymentAmount(plan.id, { price: propertyPrice, rentMonthly });
            const selected = planId === plan.id;
            return (
              <label
                key={plan.id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                  selected
                    ? "border-gold bg-amber-50/80 ring-1 ring-gold/40"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="plan"
                  className="mt-1"
                  checked={selected}
                  onChange={() => { setPlanId(plan.id); setCheckout(null); setOfflineSuccess(null); }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-900">{plan.label}</span>
                    <span className="font-mono text-sm font-bold text-gold-dark shrink-0">
                      {formatCurrency(amt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{plan.description}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Step 2 — Payment method */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          2. Payment method
        </p>
        <div className="grid grid-cols-3 gap-2">
          {PAYMENT_METHODS.map((method) => {
            const Icon = METHOD_ICONS[method.icon] ?? CreditCard;
            const selected = methodId === method.id;
            const colorClass = STATUS_COLORS[method.id] ?? STATUS_COLORS.all;
            return (
              <button
                key={method.id}
                type="button"
                id={`payment-method-${method.id}`}
                onClick={() => { setMethodId(method.id); setCheckout(null); setOfflineSuccess(null); }}
                className={`flex flex-col items-start gap-1 rounded-xl border p-2.5 text-left transition-all ${
                  selected
                    ? `${colorClass} ring-1 ring-current/40 shadow-sm`
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <Icon className={`h-4 w-4 ${selected ? "text-current" : "text-slate-500"}`} />
                <span className="text-[11px] font-bold text-slate-900 leading-tight">{method.label}</span>
                <span className="text-[9px] text-slate-500 leading-snug">{method.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Dual Beneficiary Breakdown ───────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Breakdown</p>
        </div>
        <div className="divide-y divide-slate-100">
          {/* Total */}
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="text-xs text-slate-600">Total Payment</span>
            <span className="font-mono font-bold text-slate-900">{formatCurrency(amount)}</span>
          </div>
          {/* Platform fee */}
          <div className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <Building2 className="h-3 w-3 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700">To PlotsnHomes (Platform)</p>
                <p className="text-[10px] text-slate-400">
                  {isOffline ? "Waived for offline payments" : `${brokerageRate}% brokerage fee`}
                </p>
              </div>
            </div>
            <span className={`font-mono font-bold text-sm ${isOffline ? "text-slate-400 line-through" : "text-amber-600"}`}>
              {isOffline ? "₹0.00" : formatCurrency(platformFee)}
            </span>
          </div>
          {/* Seller payout */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-50/50">
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <BadgeCheck className="h-3 w-3 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700">To Builder / Seller</p>
                <p className="text-[10px] text-slate-400">
                  {isOffline ? "100% — full amount" : `${(100 - brokerageRate).toFixed(1)}% of payment`}
                </p>
              </div>
            </div>
            <span className="font-mono font-bold text-sm text-emerald-600">{formatCurrency(sellerPayout)}</span>
          </div>
        </div>
        {/* Offline info chip */}
        {isOffline && (
          <div className="px-4 py-2.5 border-t border-amber-100 bg-amber-50">
            <p className="text-[10px] text-amber-800 font-medium">
              ⓘ Offline payments (Cheque / NEFT / RTGS) carry <strong>0% brokerage fee</strong>. 
              Full amount is transferred directly to the builder/seller.
            </p>
          </div>
        )}
      </div>

      {/* ── UPI Dynamic QR Preview (when UPI is selected) ── */}
      {methodId === "upi" && (
        <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-violet-900 flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-violet-600" /> Instant UPI Payment (0% Fee)
            </span>
            <span className="text-[10px] font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full">
              GPay · PhonePe · Paytm · BHIM
            </span>
          </div>

          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-violet-100">
            <div className="shrink-0 bg-slate-900 text-white p-2 rounded-xl text-center">
              <Smartphone className="h-6 w-6 mx-auto text-amber-400" />
              <span className="text-[9px] font-bold block mt-0.5">Scan or Tap</span>
            </div>
            <div className="text-xs space-y-0.5 min-w-0 flex-1">
              <p className="font-bold text-slate-900">VPA: brickvest@axisbank</p>
              <p className="text-[11px] text-slate-500 truncate">Deep-links directly to installed mobile UPI apps</p>
            </div>
            <a
              href={`upi://pay?pa=brickvest@axisbank&pn=PlotsnHomes&am=${amount}&cu=INR`}
              className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-3 py-2 transition shrink-0"
            >
              Open App ↗
            </a>
          </div>
        </div>
      )}

      {/* ── Razorpay checkout — auto-opens modal after order creation ── */}
      {checkout?.provider === "razorpay" &&
      checkout.orderId &&
      checkout.keyId &&
      checkout.transactionId ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
            <p className="text-xs text-emerald-800 font-semibold">
              Order created! Opening secure Razorpay window…
            </p>
          </div>

          <RazorpayButton
            autoOpen
            orderId={checkout.orderId}
            amount={checkout.amount!}
            currency={checkout.currency ?? "INR"}
            keyId={checkout.keyId}
            transactionId={checkout.transactionId}
            description={checkout.description ?? "PlotsnHomes Payment"}
            prefill={checkout.prefill}
            preferredMethod={selectedMethod?.razorpayMethod}
            onError={(err) => setError(err)}
            onDismiss={() => setCheckout(null)}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gold py-3 px-4 font-semibold text-white shadow-sm hover:bg-gold-dark transition-colors disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" />
            Pay {formatCurrency(amount)} via Razorpay
          </RazorpayButton>
        </div>
      ) : (
        <Button
          variant="gold"
          className="w-full"
          onClick={initiatePayment}
          loading={loading}
          id="initiate-payment-btn"
        >
          {!loading && <Sparkles className="h-4 w-4" />}
          {isOffline
            ? `Record ${methodId === "neft_rtgs" ? "NEFT/RTGS" : "Cheque"} Payment`
            : `Pay ${formatCurrency(amount)} securely`}
        </Button>
      )}

      {/* Trust badges */}
      <div className="text-xs text-center text-slate-500 space-y-1">
        <p className="flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          Secured by Razorpay · UPI · Cards · Net Banking · Wallets · EMI
        </p>
        <p className="text-emerald-700 font-medium">256-bit SSL encrypted · PCI DSS compliant</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
