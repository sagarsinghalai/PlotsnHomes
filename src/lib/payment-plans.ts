import type { Property } from "@prisma/client";

export type PaymentPlanId =
  | "deposit_10"
  | "partial_25"
  | "investment_1k"
  | "investment_5k"
  | "investment_10k"
  | "rent_first_month";

export type PaymentMethodId = "all" | "card" | "upi" | "netbanking" | "wallet" | "emi" | "bank" | "bnpl" | "cashapp" | "cheque" | "neft_rtgs";

export const PAYMENT_PLANS: {
  id: PaymentPlanId;
  label: string;
  description: string;
  transactionType: "DEPOSIT" | "INVESTMENT" | "RENT_PAYMENT";
}[] = [
  {
    id: "deposit_10",
    label: "10% deposit",
    description: "Reserve this property — standard hold",
    transactionType: "DEPOSIT",
  },
  {
    id: "partial_25",
    label: "25% down payment",
    description: "Stronger commitment toward purchase",
    transactionType: "DEPOSIT",
  },
  {
    id: "investment_1k",
    label: "₹1,000 investment",
    description: "Fractional / token-style stake",
    transactionType: "INVESTMENT",
  },
  {
    id: "investment_5k",
    label: "₹5,000 investment",
    description: "Mid-tier investment tier",
    transactionType: "INVESTMENT",
  },
  {
    id: "investment_10k",
    label: "₹10,000 investment",
    description: "Premium investment tier",
    transactionType: "INVESTMENT",
  },
  {
    id: "rent_first_month",
    label: "First month rent",
    description: "Rental properties only",
    transactionType: "RENT_PAYMENT",
  },
];

export const PAYMENT_METHODS: {
  id: PaymentMethodId;
  label: string;
  description: string;
  icon: "card" | "upi" | "netbanking" | "wallet" | "emi" | "bank" | "bnpl" | "cashapp" | "all";
  razorpayMethod?: string;
}[] = [
  {
    id: "upi",
    label: "UPI",
    description: "GPay, PhonePe, Paytm & all UPI apps",
    icon: "upi",
    razorpayMethod: "upi",
  },
  {
    id: "card",
    label: "Credit / Debit Card",
    description: "Visa, Mastercard, RuPay & more",
    icon: "card",
    razorpayMethod: "card",
  },
  {
    id: "netbanking",
    label: "Net Banking",
    description: "SBI, HDFC, ICICI, Axis & all banks",
    icon: "netbanking",
    razorpayMethod: "netbanking",
  },
  {
    id: "wallet",
    label: "Wallets",
    description: "Paytm, Mobikwik, FreeCharge & more",
    icon: "wallet",
    razorpayMethod: "wallet",
  },
  {
    id: "emi",
    label: "EMI",
    description: "Easy monthly installments on cards",
    icon: "emi",
    razorpayMethod: "emi",
  },
  {
    id: "cheque",
    label: "Cheque",
    description: "Pay via Cheque (Brokerage fee: 0%)",
    icon: "bank",
  },
  {
    id: "neft_rtgs",
    label: "NEFT / RTGS",
    description: "Bank Transfer (Brokerage fee: 0%)",
    icon: "bank",
  },
  {
    id: "all",
    label: "All methods",
    description: "Let Razorpay show all available options",
    icon: "all",
  },
];

export function getPlansForProperty(property: Pick<Property, "price" | "rentMonthly" | "type">) {
  return PAYMENT_PLANS.filter((p) => {
    if (p.id === "rent_first_month") {
      return Boolean(property.rentMonthly) || property.type === "RENTAL";
    }
    return true;
  });
}

export function calculatePaymentAmount(
  planId: PaymentPlanId,
  property: Pick<Property, "price" | "rentMonthly">
): number {
  switch (planId) {
    case "deposit_10":
      return Math.round(property.price * 0.1 * 100) / 100;
    case "partial_25":
      return Math.round(property.price * 0.25 * 100) / 100;
    case "investment_1k":
      return 1000;
    case "investment_5k":
      return 5000;
    case "investment_10k":
      return 10000;
    case "rent_first_month":
      return property.rentMonthly ?? Math.round(property.price * 0.006 * 100) / 100;
    default:
      return Math.round(property.price * 0.1 * 100) / 100;
  }
}

export function planTransactionType(planId: PaymentPlanId) {
  return PAYMENT_PLANS.find((p) => p.id === planId)?.transactionType ?? "DEPOSIT";
}

export function paymentMethodLabel(method: PaymentMethodId | string | null | undefined) {
  const m = PAYMENT_METHODS.find((x) => x.id === method);
  return m?.label ?? (method ? String(method) : "—");
}

export function paymentPlanLabel(plan: PaymentPlanId | string | null | undefined) {
  const p = PAYMENT_PLANS.find((x) => x.id === plan);
  return p?.label ?? (plan ? String(plan) : "—");
}
