export const dynamic = "force-dynamic";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminDashboardOverview } from "@/components/admin/admin-dashboard-overview";
import { prisma } from "@/lib/prisma";

export default async function AdminOverviewPage() {
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);

  const [
    userCount,
    onlineUsers,
    propertyCount,
    txAgg,
    inquiryCount,
    marketAvg,
    recentInquiries,
    topMovers,
    recentUsers,
    recentProperties,
    recentTx,
    recentInq,
    recentDevs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: { active: true, lastActiveAt: { gte: fifteenMinAgo } },
    }),
    prisma.property.count({ where: { status: "ACTIVE" } }),
    prisma.transaction.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
    }),
    prisma.inquiry.count(),
    prisma.property.aggregate({
      where: { status: "ACTIVE" },
      _avg: { yieldRate: true, changeYtd: true },
    }),
    prisma.inquiry.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { property: { select: { title: true, symbol: true } } },
    }),
    prisma.property.findMany({
      where: { status: "ACTIVE" },
      orderBy: { changeYtd: "desc" },
      take: 5,
      select: { id: true, symbol: true, title: true, changeYtd: true, price: true },
    }),
    prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.property.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, symbol: true, submittedBy: { select: { name: true, role: true } }, createdAt: true },
    }),
    prisma.transaction.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, role: true } } },
    }),
    prisma.inquiry.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { property: { select: { symbol: true } } },
    }),
    prisma.developer.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, createdAt: true },
    }),
  ]);

  const revenue = txAgg._sum.amount ?? 0;
  const yieldAvg = marketAvg._avg.yieldRate ?? 0;
  const changeYtdAvg = marketAvg._avg.changeYtd ?? 0;

  // Build real-time activity audit logs
  const logs: Array<{ id: string; type: string; details: string; actor: string; role: string; timestamp: string }> = [];

  recentUsers.forEach((u) => {
    logs.push({
      id: `user-${u.id}`,
      type: "User Registration",
      details: `Registered account: ${u.name} (${u.email})`,
      actor: u.name,
      role: u.role,
      timestamp: u.createdAt.toISOString(),
    });
  });

  recentProperties.forEach((p) => {
    logs.push({
      id: `property-${p.id}`,
      type: "Property Listed",
      details: `Listed property ${p.title} [${p.symbol}]`,
      actor: p.submittedBy?.name ?? "System",
      role: p.submittedBy?.role ?? "SYSTEM",
      timestamp: p.createdAt.toISOString(),
    });
  });

  recentTx.forEach((t) => {
    logs.push({
      id: `tx-${t.id}`,
      type: "Transaction Completed",
      details: `${t.type} transaction executed (Status: ${t.status})`,
      actor: t.user?.name ?? "System",
      role: t.user?.role ?? "SYSTEM",
      timestamp: t.createdAt.toISOString(),
    });
  });

  recentInq.forEach((q) => {
    logs.push({
      id: `inquiry-${q.id}`,
      type: "Buyer Inquiry",
      details: `Inquiry submitted by ${q.name} on ${q.property.symbol}`,
      actor: q.name,
      role: "BUYER",
      timestamp: q.createdAt.toISOString(),
    });
  });

  recentDevs.forEach((d) => {
    logs.push({
      id: `dev-${d.id}`,
      type: "Developer Registered",
      details: `Brand registered: ${d.name}`,
      actor: "Admin",
      role: "SUPERADMIN",
      timestamp: d.createdAt.toISOString(),
    });
  });

  logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const activityLogs = logs.slice(0, 10);

  return (
    <div>
      <AdminPageHeader
        title="Dashboard Overview"
        description={`${propertyCount} active property listings · ${userCount} registered users · Real-time platform metrics`}
      />

      <AdminDashboardOverview
        userCount={userCount}
        onlineUsers={onlineUsers}
        propertyCount={propertyCount}
        revenue={revenue}
        inquiryCount={inquiryCount}
        yieldAvg={yieldAvg}
        changeYtdAvg={changeYtdAvg}
        topMovers={topMovers}
        recentInquiries={recentInquiries}
        activityLogs={activityLogs}
      />
    </div>
  );
}
