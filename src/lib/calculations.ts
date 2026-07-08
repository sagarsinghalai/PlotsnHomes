/** Monthly mortgage payment (principal + interest) */
export function mortgageMonthlyPayment(
  principal: number,
  annualRatePercent: number,
  years: number
): number {
  if (principal <= 0 || years <= 0) return 0;
  const r = annualRatePercent / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

/** Gross rental yield (annual rent / price) */
export function grossRentalYield(annualRent: number, price: number): number {
  if (price <= 0) return 0;
  return (annualRent / price) * 100;
}

/** Cap rate: NOI / price */
export function capRate(noi: number, price: number): number {
  if (price <= 0) return 0;
  return (noi / price) * 100;
}

/** Cash-on-cash return */
export function cashOnCashReturn(
  annualCashFlow: number,
  cashInvested: number
): number {
  if (cashInvested <= 0) return 0;
  return (annualCashFlow / cashInvested) * 100;
}

/** ROI over holding period */
export function roi(
  gain: number,
  initialInvestment: number
): number {
  if (initialInvestment <= 0) return 0;
  return (gain / initialInvestment) * 100;
}

/**
 * Annual yield based on listed price vs current price.
 * Formula: ((currentPrice - listedPrice) / listedPrice * 100) / 12
 * This gives the monthly appreciation as a percentage, annualised.
 */
export function computeAnnualYield(
  listedPrice: number,
  currentPrice: number
): number {
  if (listedPrice <= 0) return 0;
  return ((currentPrice - listedPrice) / listedPrice * 100) / 12;
}

export type RatingSlabInput = {
  label: string;
  minYield: number;
  maxYield?: number | null;
  color?: string;
};

/** Default rating slabs used if none are configured in DB */
export const DEFAULT_RATING_SLABS: RatingSlabInput[] = [
  { label: "A+", minYield: 12, color: "#16a34a" },
  { label: "A",  minYield: 10, maxYield: 12, color: "#22c55e" },
  { label: "B+", minYield: 8,  maxYield: 10, color: "#84cc16" },
  { label: "B",  minYield: 4,  maxYield: 8,  color: "#eab308" },
  { label: "C",  minYield: 0,  maxYield: 4,  color: "#f97316" },
];

export const DEFAULT_SLABS_MAP: Record<string, RatingSlabInput[]> = {
  yieldRate: DEFAULT_RATING_SLABS,
  capRate: [
    { label: "High", minYield: 8, color: "#16a34a" },
    { label: "Moderate", minYield: 5, maxYield: 8, color: "#eab308" },
    { label: "Low", minYield: 0, maxYield: 5, color: "#ef4444" },
  ],
  interestRate: [
    { label: "High", minYield: 8, color: "#ef4444" },
    { label: "Moderate", minYield: 5, maxYield: 8, color: "#eab308" },
    { label: "Low", minYield: 0, maxYield: 5, color: "#16a34a" },
  ],
  brokerageRate: [
    { label: "High", minYield: 5, color: "#ef4444" },
    { label: "Standard", minYield: 2, maxYield: 5, color: "#eab308" },
    { label: "Low", minYield: 0, maxYield: 2, color: "#16a34a" },
  ],
  change7d: [
    { label: "Up", minYield: 0, color: "#16a34a" },
    { label: "Down", minYield: -100, maxYield: 0, color: "#ef4444" },
  ],
  change1m: [
    { label: "Up", minYield: 0, color: "#16a34a" },
    { label: "Down", minYield: -100, maxYield: 0, color: "#ef4444" },
  ],
  change6m: [
    { label: "Up", minYield: 0, color: "#16a34a" },
    { label: "Down", minYield: -100, maxYield: 0, color: "#ef4444" },
  ],
  changeYtd: [
    { label: "Up", minYield: 0, color: "#16a34a" },
    { label: "Down", minYield: -100, maxYield: 0, color: "#ef4444" },
  ],
};

/**
 * Find the matching slab for a given value and type.
 * Slabs are sorted descending by minYield so the highest matching threshold wins.
 */
export function computeSlabForValue(
  value: number,
  type: string,
  slabs?: RatingSlabInput[]
): RatingSlabInput | undefined {
  const list = slabs && slabs.length > 0 ? slabs : (DEFAULT_SLABS_MAP[type] ?? []);
  const sorted = [...list].sort((a, b) => b.minYield - a.minYield);
  for (const slab of sorted) {
    if (value >= slab.minYield) {
      return slab;
    }
  }
  return sorted[sorted.length - 1];
}

/**
 * Compute market rating from annual yield using configurable slabs.
 * Slabs should be sorted descending by minYield.
 */
export function computeRatingFromSlabs(
  annualYield: number,
  slabs: RatingSlabInput[] = DEFAULT_RATING_SLABS
): string {
  const match = computeSlabForValue(annualYield, "yieldRate", slabs);
  return match?.label ?? "C";
}

export type InvestmentSummary = {
  monthlyMortgage: number;
  monthlyRent: number;
  monthlyExpenses: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  grossYield: number;
  capRate: number;
  cashOnCash: number;
  totalCashInvested: number;
};

export function buildInvestmentSummary(input: {
  price: number;
  downPaymentPercent: number;
  annualRatePercent: number;
  loanYears: number;
  monthlyRent: number;
  monthlyExpenses: number;
  closingCosts: number;
}): InvestmentSummary {
  const downPayment = input.price * (input.downPaymentPercent / 100);
  const loanAmount = input.price - downPayment;
  const monthlyMortgage = mortgageMonthlyPayment(
    loanAmount,
    input.annualRatePercent,
    input.loanYears
  );
  const monthlyRent = input.monthlyRent;
  const monthlyExpenses = input.monthlyExpenses + monthlyMortgage;
  const monthlyCashFlow = monthlyRent - monthlyExpenses;
  const annualCashFlow = monthlyCashFlow * 12;
  const totalCashInvested = downPayment + input.closingCosts;
  const annualRent = monthlyRent * 12;
  const noi = annualRent - input.monthlyExpenses * 12;

  return {
    monthlyMortgage,
    monthlyRent,
    monthlyExpenses: input.monthlyExpenses + monthlyMortgage,
    monthlyCashFlow,
    annualCashFlow,
    grossYield: grossRentalYield(annualRent, input.price),
    capRate: capRate(noi, input.price),
    cashOnCash: cashOnCashReturn(annualCashFlow, totalCashInvested),
    totalCashInvested,
  };
}
