import { PayoutsManager } from "@/components/admin/payouts-manager";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { commissionScopeForUser } from "@/lib/crm-access";

export const dynamic = "force-dynamic";

export default async function AdminPayoutsPage() {
  const session = await getServerSession(authOptions);
  const tenantId = session?.user?.tenantId || "__no_tenant__";
  // OWN-scope roles only see their own commissions; leaders see the whole tenant.
  // Properties (shared listings) stay tenant-wide for everyone.
  const commissionWhere = session?.user
    ? commissionScopeForUser(session.user.role, session.user.id, session.user.tenantId)
    : { tenantId };
  // 1. Query active properties to schedule dividends
  const properties = await prisma.property.findMany({
    where: { status: "ACTIVE", tenantId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      symbol: true,
      price: true,
      yieldRate: true,
      category: true,
    },
  });

  const parsedProperties = properties.map((p) => {
    const charCodeSum = p.title.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const mockInvestors = 24 + (charCodeSum % 120);

    return {
      id: p.id,
      title: p.title,
      symbol: p.symbol,
      price: p.price,
      yieldRate: p.yieldRate || 6.5,
      category: p.category || "Property",
      investorsCount: mockInvestors,
    };
  });

  // 2. Query eligible agent commissions from DB
  const dbCommissions = await prisma.agentCommission.findMany({
    where: commissionWhere,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      agent: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          commissionRate: true,
        },
      },
      property: {
        select: {
          title: true,
          symbol: true,
        },
      },
    },
  });

  const parsedCommissions = dbCommissions.map((c) => ({
    id: c.id,
    agentId: c.agentId,
    agentName: c.agent?.name || "Agent Partner",
    agentEmail: c.agent?.email || "agent@plotsnhomes.com",
    agentRole: c.agent?.role || "AGENT",
    propertyTitle: c.propertyTitle || c.property?.title || "Property Asset",
    propertySymbol: c.property?.symbol || "PROP",
    propertyValue: c.propertyValue || 0,
    commissionPct: c.commissionPct || c.agent?.commissionRate || 3.0,
    totalCommission: c.commissionAmount || 0,
    paidAmount: c.status === "PAID" ? c.commissionAmount : 0,
    remainingBalance: c.status === "PAID" ? 0 : c.commissionAmount,
    status: (c.status as "PENDING" | "PAID") || "PENDING",
    notes: c.notes || "",
    paymentRef: c.paymentRef || "",
    updatedAt: c.updatedAt.toISOString(),
  }));

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
        Payouts & Commission Distribution Hub
      </h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400 mb-8">
        Manage dividend schedules, calculate yields, transfer eligible agent commissions, and record bank settlements
      </p>
      <PayoutsManager properties={parsedProperties} initialCommissions={parsedCommissions} />
    </div>
  );
}
