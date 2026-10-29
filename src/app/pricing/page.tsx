import { prisma } from "@/lib/prisma";
import { PricingPlans, type PricingPlan } from "@/components/public/pricing-plans";
import { parseFeatures, INTERVAL_LABELS, intervalShort, formatDurationMinutes } from "@/lib/subscription";
import { activeSignupGateway } from "@/lib/signup-payment";
import { getPublishedPageForRoute, getNavSettings, getFooterSettings } from "@/lib/webpage-editor-store";
import { BuilderPageView } from "@/components/public/builder-page-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Plans & pricing",
  description: "Launch your own white-label real-estate platform — pick a plan and go live in minutes.",
};

export default async function PricingPage() {
  // Admin-built override takes over /pricing when published (reversible).
  {
    const override = await getPublishedPageForRoute("/pricing");
    if (override) {
      const [nav, footer] = await Promise.all([getNavSettings(), getFooterSettings()]);
      return <BuilderPageView page={override} nav={nav} footer={footer} />;
    }
  }

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

  const testMode = (await activeSignupGateway()) === "test";
  return <PricingPlans plans={plans} testMode={testMode} />;
}
