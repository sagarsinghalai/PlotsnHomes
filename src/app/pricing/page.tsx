import { prisma } from "@/lib/prisma";
import { PricingPlans, type PricingPlan } from "@/components/public/pricing-plans";
import { parseFeatures, INTERVAL_LABELS, intervalShort, formatDurationMinutes } from "@/lib/subscription";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Plans & pricing",
  description: "Launch your own white-label real-estate platform — pick a plan and go live in minutes.",
};

export default async function PricingPage() {
  const rows = await prisma.subscriptionPlan.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
  });

  const plans: PricingPlan[] = rows.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    currency: (p.currency || "usd").toUpperCase(),
    interval: p.interval,
    intervalLabel: INTERVAL_LABELS[p.interval] ?? p.interval,
    priceSuffix: p.interval === "CUSTOM" ? ` / ${formatDurationMinutes(p.durationMinutes)}` : intervalShort(p.interval),
    trialDays: p.trialDays,
    features: parseFeatures(p.featuresJson),
  }));

  return <PricingPlans plans={plans} />;
}
