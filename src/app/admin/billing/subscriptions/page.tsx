import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { BillingSubNav } from "@/components/admin/billing/billing-sub-nav";
import { SubscriptionsTable } from "@/components/admin/billing/subscriptions-table";
import { prisma } from "@/lib/prisma";

export default async function SubscribersPage() {
  const [subscriptions, plans, users] = await Promise.all([
    prisma.userSubscription.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        plan: { select: { id: true, name: true, interval: true, slug: true } },
      },
    }),
    prisma.subscriptionPlan.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, interval: true, price: true },
    }),
    prisma.user.findMany({
      where: { role: { notIn: ["SUPERADMIN", "EMPLOYEE"] }, active: true },
      orderBy: { name: "asc" },
      take: 200,
      select: { id: true, name: true, email: true, role: true },
    }),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="Subscribers"
        description="View and manage who has which subscription — monthly, quarterly, annual, or lifetime"
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Billing", href: "/admin/billing" },
          { label: "Subscribers" },
        ]}
      />
      <BillingSubNav active="subscriptions" />
      <SubscriptionsTable
        subscriptions={subscriptions.map((s) => ({
          id: s.id,
          status: s.status,
          amount: s.amount,
          currency: s.currency,
          currentPeriodStart: s.currentPeriodStart.toISOString(),
          currentPeriodEnd: s.currentPeriodEnd?.toISOString() ?? null,
          cancelAtPeriodEnd: s.cancelAtPeriodEnd,
          notes: s.notes,
          user: s.user,
          plan: s.plan,
        }))}
        plans={plans}
        users={users}
      />
    </div>
  );
}
