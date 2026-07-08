import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { BillingSubNav } from "@/components/admin/billing/billing-sub-nav";
import { SubscriptionPlansManager } from "@/components/admin/billing/subscription-plans-manager";
import { prisma } from "@/lib/prisma";

export default async function SubscriptionPlansPage() {
  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
    include: { _count: { select: { subscriptions: true } } },
  });

  return (
    <div>
      <AdminPageHeader
        title="Subscription plans"
        description="Create and manage monthly, quarterly, yearly (annual), and lifetime plans"
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Billing", href: "/admin/billing" },
          { label: "Plans" },
        ]}
      />
      <BillingSubNav active="plans" />
      <SubscriptionPlansManager
        plans={plans.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          interval: p.interval,
          price: p.price,
          currency: p.currency,
          featuresJson: p.featuresJson,
          targetRole: p.targetRole,
          trialDays: p.trialDays,
          active: p.active,
          sortOrder: p.sortOrder,
          subscriberCount: p._count.subscriptions,
        }))}
      />
    </div>
  );
}
