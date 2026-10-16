import { prisma } from "@/lib/prisma";

export type PriceLogEntry = {
  id: string;
  propertyId: string;
  price: number;
  ratePerSqft: number | null;
  stage: string | null;
  changedByUserId: string | null;
  changedByName: string | null;
  notes: string | null;
  createdAt: Date | string;
};

export type PropertyAppreciationMetrics = {
  currentPrice: number;
  ratePerSqft: number | null;
  
  // 7-day
  price7d: number | null;
  change7dAmount: number;
  change7dPercent: number;

  // 30-day (1m)
  price30d: number | null;
  change30dAmount: number;
  change30dPercent: number;

  // 90-day (3m)
  price90d: number | null;
  change90dAmount: number;
  change90dPercent: number;

  // Annual (365d / YTD)
  priceAnnual: number | null;
  changeAnnualAmount: number;
  changeAnnualPercent: number;

  // Price history logs list
  logs: PriceLogEntry[];
};

/**
 * Log a new price change entry in PropertyPriceLog
 */
export async function logPropertyPriceChange({
  propertyId,
  price,
  ratePerSqft,
  stage = "Current Price",
  changedByUserId,
  changedByName,
  notes,
}: {
  propertyId: string;
  price: number;
  ratePerSqft?: number | null;
  stage?: string | null;
  changedByUserId?: string | null;
  changedByName?: string | null;
  notes?: string | null;
}) {
  if (!prisma || !(prisma as any).propertyPriceLog) {
    console.warn("Prisma propertyPriceLog model not available yet.");
    return null;
  }

  // Create the new log entry
  const log = await (prisma as any).propertyPriceLog.create({
    data: {
      propertyId,
      price,
      ratePerSqft: ratePerSqft || null,
      stage: stage || "Current Price",
      changedByUserId: changedByUserId || null,
      changedByName: changedByName || "System Admin",
      notes: notes || null,
    },
  });

  // Recalculate appreciation and update property metrics
  await updatePropertyAppreciationMetrics(propertyId);

  return log;
}

/**
 * Calculate 7-day, 30-day, 90-day, and annual appreciation metrics for a property
 */
export async function calculatePropertyAppreciation(
  propertyId: string
): Promise<PropertyAppreciationMetrics> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      id: true,
      price: true,
      sqft: true,
      rentMonthly: true,
      basePriceRate: true,
      softLaunchRate: true,
      preLaunchRate: true,
      launchRate: true,
      createdAt: true,
    },
  });

  if (!property) {
    throw new Error(`Property ${propertyId} not found`);
  }

  let logs: PriceLogEntry[] = [];
  if (prisma && (prisma as any).propertyPriceLog) {
    logs = await (prisma as any).propertyPriceLog.findMany({
      where: { propertyId },
      orderBy: { createdAt: "asc" },
    });
  }

  const currentPrice = property.price;
  const sqft = property.sqft || 0;
  const currentRate = sqft > 0 ? currentPrice / sqft : null;

  // If no logs exist yet, construct baseline logs from stages or initial record
  if (logs.length === 0) {
    const defaultLogs: PriceLogEntry[] = [];
    const now = new Date();

    if (property.softLaunchRate && sqft > 0) {
      const softPrice = property.softLaunchRate * sqft;
      defaultLogs.push({
        id: `seed-soft-${propertyId}`,
        propertyId,
        price: softPrice,
        ratePerSqft: property.softLaunchRate,
        stage: "Soft Launch",
        changedByUserId: null,
        changedByName: "System Seed",
        notes: "Soft Launch Stage Baseline",
        createdAt: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
      });
    }

    if (property.preLaunchRate && sqft > 0) {
      const prePrice = property.preLaunchRate * sqft;
      defaultLogs.push({
        id: `seed-pre-${propertyId}`,
        propertyId,
        price: prePrice,
        ratePerSqft: property.preLaunchRate,
        stage: "Pre Launch",
        changedByUserId: null,
        changedByName: "System Seed",
        notes: "Pre Launch Stage Baseline",
        createdAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      });
    }

    if (property.launchRate && sqft > 0) {
      const launchPrice = property.launchRate * sqft;
      defaultLogs.push({
        id: `seed-launch-${propertyId}`,
        propertyId,
        price: launchPrice,
        ratePerSqft: property.launchRate,
        stage: "Launch Price",
        changedByUserId: null,
        changedByName: "System Seed",
        notes: "Launch Stage Baseline",
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      });
    }

    defaultLogs.push({
      id: `seed-current-${propertyId}`,
      propertyId,
      price: currentPrice,
      ratePerSqft: currentRate,
      stage: "Current Price",
      changedByUserId: null,
      changedByName: "System Admin",
      notes: "Current Listing Price",
      createdAt: property.createdAt || now,
    });

    logs = defaultLogs;
  }

  const nowTime = new Date().getTime();

  function findClosestPriceBefore(daysAgo: number): number {
    const targetTime = nowTime - daysAgo * 24 * 60 * 60 * 1000;
    const validLogs = logs.filter((l) => new Date(l.createdAt).getTime() <= targetTime);
    if (validLogs.length > 0) {
      return validLogs[validLogs.length - 1].price;
    }
    return logs[0]?.price || currentPrice;
  }

  // 7-Day Appreciation
  const price7d = findClosestPriceBefore(7);
  const change7dAmount = currentPrice - price7d;
  const change7dPercent = price7d > 0 ? (change7dAmount / price7d) * 100 : 0;

  // 30-Day Appreciation
  const price30d = findClosestPriceBefore(30);
  const change30dAmount = currentPrice - price30d;
  const change30dPercent = price30d > 0 ? (change30dAmount / price30d) * 100 : 0;

  // 90-Day Appreciation
  const price90d = findClosestPriceBefore(90);
  const change90dAmount = currentPrice - price90d;
  const change90dPercent = price90d > 0 ? (change90dAmount / price90d) * 100 : 0;

  // Annual Appreciation (365d / YTD)
  const priceAnnual = findClosestPriceBefore(365);
  const changeAnnualAmount = currentPrice - priceAnnual;
  const changeAnnualPercent = priceAnnual > 0 ? (changeAnnualAmount / priceAnnual) * 100 : 0;

  return {
    currentPrice,
    ratePerSqft: currentRate,
    price7d,
    change7dAmount,
    change7dPercent,
    price30d,
    change30dAmount,
    change30dPercent,
    price90d,
    change90dAmount,
    change90dPercent,
    priceAnnual,
    changeAnnualAmount,
    changeAnnualPercent,
    logs,
  };
}

/**
 * Default sample price change logs for properties across historical phases
 */
export const DEFAULT_GLOBAL_PRICE_LOGS: PriceLogEntry[] = [
  {
    id: "log-1",
    propertyId: "prop-1",
    price: 32000000,
    ratePerSqft: 12800,
    stage: "Soft Launch",
    changedByUserId: "user-admin",
    changedByName: "Rajesh Sharma (Admin)",
    notes: "Initial Soft Launch phase pricing for early investors",
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "log-2",
    propertyId: "prop-1",
    price: 34500000,
    ratePerSqft: 13800,
    stage: "Pre-Launch Phase",
    changedByUserId: "user-admin",
    changedByName: "Rajesh Sharma (Admin)",
    notes: "Pre-Launch rate adjustment post environmental clearance",
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "log-3",
    propertyId: "prop-1",
    price: 37000000,
    ratePerSqft: 14800,
    stage: "Public Launch",
    changedByUserId: "user-admin",
    changedByName: "Priya Patel (Sales Lead)",
    notes: "Official Public Launch with premium inventory release",
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "log-4",
    propertyId: "prop-1",
    price: 39500000,
    ratePerSqft: 15800,
    stage: "Quarterly Rate Increase",
    changedByUserId: "user-admin",
    changedByName: "Rajesh Sharma (Admin)",
    notes: "Q3 Price revision following 85% phase 1 sell-out",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "log-5",
    propertyId: "prop-1",
    price: 41200000,
    ratePerSqft: 16480,
    stage: "Infrastructure Hike",
    changedByUserId: "user-admin",
    changedByName: "Amit Verma (Asset Manager)",
    notes: "Metro link expansion announcement & club house inauguration",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "log-6",
    propertyId: "prop-1",
    price: 42500000,
    ratePerSqft: 17000,
    stage: "Current Market Rate",
    changedByUserId: "user-admin",
    changedByName: "Rajesh Sharma (Admin)",
    notes: "Current live rate reflecting recent high demand",
    createdAt: new Date().toISOString(),
  },
];

/**
 * Filter price logs by date range and calculate appreciation metrics dynamically
 */
export function getPriceAppreciationForRange(
  logs: PriceLogEntry[] = DEFAULT_GLOBAL_PRICE_LOGS,
  range: string = "30d"
) {
  const sortedLogs = [...logs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  if (sortedLogs.length === 0) {
    return {
      startPrice: 0,
      currentPrice: 0,
      priceChangeAmount: 0,
      appreciationPct: 0,
      startRatePerSqft: 0,
      currentRatePerSqft: 0,
      sqftChangePct: 0,
      filteredLogs: [],
      sparkline: [0, 0, 0, 0, 0, 0],
    };
  }

  const now = new Date().getTime();
  let daysCutoff = 30;
  if (range === "7d") daysCutoff = 7;
  else if (range === "30d") daysCutoff = 30;
  else if (range === "90d") daysCutoff = 90;
  else if (range === "12m" || range === "365d") daysCutoff = 365;
  else if (range === "ytd") {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime();
    daysCutoff = Math.max(1, Math.ceil((now - startOfYear) / (1000 * 60 * 60 * 24)));
  } else if (range === "all") {
    daysCutoff = 99999;
  }

  const cutoffTime = now - daysCutoff * 24 * 60 * 60 * 1000;
  const filteredLogs = sortedLogs.filter((l) => new Date(l.createdAt).getTime() >= cutoffTime);

  // Fallback to earliest log if cutoff yields empty list
  const baselineLog = sortedLogs.filter((l) => new Date(l.createdAt).getTime() <= cutoffTime).pop() || sortedLogs[0];
  const startLog = filteredLogs[0] || baselineLog;
  const latestLog = sortedLogs[sortedLogs.length - 1];

  const startPrice = startLog.price;
  const currentPrice = latestLog.price;
  const priceChangeAmount = currentPrice - startPrice;
  const appreciationPct = startPrice > 0 ? Number(((priceChangeAmount / startPrice) * 100).toFixed(2)) : 0;

  const startRatePerSqft = startLog.ratePerSqft || 0;
  const currentRatePerSqft = latestLog.ratePerSqft || 0;
  const sqftChangeAmount = currentRatePerSqft - startRatePerSqft;
  const sqftChangePct = startRatePerSqft > 0 ? Number(((sqftChangeAmount / startRatePerSqft) * 100).toFixed(2)) : 0;

  // Build sparkline array from filtered values
  const activeSeries = filteredLogs.length >= 2 ? filteredLogs : sortedLogs;
  const sparkline = activeSeries.map((l) => l.ratePerSqft || Math.round(l.price / 2500));

  return {
    startPrice,
    currentPrice,
    priceChangeAmount,
    appreciationPct,
    startRatePerSqft,
    currentRatePerSqft,
    sqftChangeAmount,
    sqftChangePct,
    filteredLogs: filteredLogs.length > 0 ? filteredLogs : sortedLogs,
    sparkline,
  };
}

/**
 * Recalculate appreciation and update Property model fields in DB
 */
export async function updatePropertyAppreciationMetrics(propertyId: string) {
  try {
    const metrics = await calculatePropertyAppreciation(propertyId);
    await prisma.property.update({
      where: { id: propertyId },
      data: {
        change7d: metrics.change7dPercent,
        change1m: metrics.change30dPercent,
        change6m: metrics.change90dPercent,
        changeYtd: metrics.changeAnnualPercent,
        priceHistory: JSON.stringify(metrics.logs),
      },
    });
  } catch (err) {
    console.error("Failed to update property appreciation metrics:", err);
  }
}
