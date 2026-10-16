import { UserDetailEditor } from "@/components/admin/user-detail-editor";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const targetId = params.id;
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { id: targetId },
        { email: targetId },
        { userId: targetId },
      ],
    },
    include: {
      manager: { select: { id: true, name: true, role: true, email: true } },
      kycProfile: true,
      loanApplications: {
        orderBy: { createdAt: "desc" },
        include: { property: { select: { title: true, symbol: true } } },
      },
      leadsOwned: {
        orderBy: { createdAt: "desc" },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              symbol: true,
              slug: true,
              price: true,
              city: true,
              state: true,
              address: true,
              images: true,
            },
          },
          inquiry: {
            include: {
              property: {
                select: {
                  id: true,
                  title: true,
                  symbol: true,
                  slug: true,
                  price: true,
                  city: true,
                  state: true,
                  address: true,
                  images: true,
                },
              },
            },
          },
          showing: {
            include: {
              property: {
                select: {
                  id: true,
                  title: true,
                  symbol: true,
                  slug: true,
                  price: true,
                  city: true,
                  state: true,
                  address: true,
                  images: true,
                },
              },
            },
          },
        },
      },
      _count: { select: { properties: true, transactions: true, inquiries: true } },
    },
  });

  if (!user) {
    user = await prisma.user.findFirst({
      where: { active: true },
      include: {
        manager: { select: { id: true, name: true, role: true, email: true } },
        kycProfile: true,
        loanApplications: {
          orderBy: { createdAt: "desc" },
          include: { property: { select: { title: true, symbol: true } } },
        },
        leadsOwned: {
          orderBy: { createdAt: "desc" },
          include: {
            property: {
              select: {
                id: true,
                title: true,
                symbol: true,
                slug: true,
                price: true,
                city: true,
                state: true,
                address: true,
                images: true,
              },
            },
            inquiry: {
              include: {
                property: {
                  select: {
                    id: true,
                    title: true,
                    symbol: true,
                    slug: true,
                    price: true,
                    city: true,
                    state: true,
                    address: true,
                    images: true,
                  },
                },
              },
            },
            showing: {
              include: {
                property: {
                  select: {
                    id: true,
                    title: true,
                    symbol: true,
                    slug: true,
                    price: true,
                    city: true,
                    state: true,
                    address: true,
                    images: true,
                  },
                },
              },
            },
          },
        },
        _count: { select: { properties: true, transactions: true, inquiries: true } },
      },
    });
  }

  if (!user) notFound();

  const activeUserId = user.id;

  const [
    allManagers,
    userTransactions,
    userProperties,
    userCommissions,
    organizations,
    franchises,
    branches,
    departments,
    teams,
  ] = await Promise.all([
    prisma.user.findMany({
      where: { id: { not: activeUserId }, active: true },
      select: { id: true, name: true, role: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.transaction.findMany({
      where: { userId: activeUserId },
      orderBy: { createdAt: "desc" },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            symbol: true,
            slug: true,
            price: true,
            city: true,
            state: true,
            address: true,
            images: true,
            status: true,
          },
        },
      },
    }),
    prisma.property.findMany({
      where: { agentId: activeUserId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        symbol: true,
        slug: true,
        price: true,
        city: true,
        state: true,
        address: true,
        images: true,
        status: true,
        updatedAt: true,
      },
    }),
    prisma.agentCommission.findMany({
      where: { agentId: activeUserId },
      orderBy: { updatedAt: "desc" },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            symbol: true,
            slug: true,
            price: true,
            city: true,
            state: true,
            address: true,
            images: true,
            status: true,
          },
        },
      },
    }),
    prisma.organization.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
    prisma.franchise.findMany({
      select: { id: true, name: true, code: true, organizationId: true },
      orderBy: { name: "asc" },
    }),
    prisma.branch.findMany({
      select: { id: true, name: true, code: true, franchiseId: true },
      orderBy: { name: "asc" },
    }),
    prisma.department.findMany({
      select: { id: true, name: true, code: true, branchId: true },
      orderBy: { name: "asc" },
    }),
    prisma.team.findMany({
      select: { id: true, name: true, code: true, departmentId: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const leadEmails = (user.leadsOwned || []).map((l) => l.email).filter(Boolean);
  const matchingLeadUsers = leadEmails.length > 0
    ? await prisma.user.findMany({
        where: { email: { in: leadEmails } },
        select: { id: true, email: true },
      })
    : [];

  const leadEmailToUserIdMap = new Map(matchingLeadUsers.map((u) => [u.email, u.id]));

  // Construct Bought Properties Portfolio
  const boughtPropertiesMap = new Map<string, any>();
  for (const tx of userTransactions) {
    if (tx.status === "COMPLETED" && tx.property) {
      if (!boughtPropertiesMap.has(tx.property.id)) {
        boughtPropertiesMap.set(tx.property.id, {
          id: tx.id,
          propertyId: tx.property.id,
          title: tx.property.title,
          symbol: tx.property.symbol,
          slug: tx.property.slug,
          price: tx.property.price,
          city: tx.property.city,
          state: tx.property.state,
          address: tx.property.address,
          images: tx.property.images,
          type: "BOUGHT",
          status: tx.status,
          timestamp: (tx.completedAt || tx.createdAt).toISOString(),
          amount: tx.amount,
          paymentRef: tx.referenceNo || tx.id,
        });
      }
    }
  }
  const boughtProperties = Array.from(boughtPropertiesMap.values());

  // Construct Sold Properties Portfolio
  const soldPropertiesMap = new Map<string, any>();
  for (const p of userProperties) {
    if (p.status === "SOLD") {
      soldPropertiesMap.set(p.id, {
        id: p.id,
        propertyId: p.id,
        title: p.title,
        symbol: p.symbol,
        slug: p.slug,
        price: p.price,
        city: p.city,
        state: p.state,
        address: p.address,
        images: p.images,
        type: "SOLD",
        status: p.status,
        timestamp: p.updatedAt.toISOString(),
        amount: p.price,
      });
    }
  }

  for (const c of userCommissions) {
    if (c.property && !soldPropertiesMap.has(c.property.id)) {
      soldPropertiesMap.set(c.property.id, {
        id: c.id,
        propertyId: c.property.id,
        title: c.propertyTitle || c.property.title,
        symbol: c.property.symbol,
        slug: c.property.slug,
        price: c.propertyValue,
        city: c.property.city,
        state: c.property.state,
        address: c.property.address,
        images: c.property.images,
        type: "SOLD",
        status: c.status,
        timestamp: (c.soldAt || c.updatedAt).toISOString(),
        amount: c.propertyValue,
        paymentRef: c.paymentRef,
      });
    }
  }
  const soldProperties = Array.from(soldPropertiesMap.values());

  const rawTxList = userTransactions.map((tx) => ({
    id: tx.id,
    userId: tx.userId,
    propertyId: tx.propertyId,
    propertyTitle: tx.property?.title || null,
    propertySymbol: tx.property?.symbol || null,
    amount: tx.amount,
    type: tx.type,
    status: tx.status,
    paymentMethod: tx.paymentMethod || "Direct Bank Transfer",
    description: tx.description,
    referenceNo: tx.referenceNo,
    notes: tx.notes,
    buyerName: tx.buyerName,
    sellerName: tx.sellerName,
    completedAt: tx.completedAt ? tx.completedAt.toISOString() : null,
    createdAt: tx.createdAt.toISOString(),
  }));

  // Merge Commission Payouts into transactions list if not already present
  for (const comm of userCommissions) {
    const isPaid = comm.status === "PAID" || comm.paidAt || comm.notes?.includes("Disbursed");
    if (isPaid) {
      const refNo = comm.paymentRef || `COMM-${comm.id}`;
      const exists = rawTxList.some((t) => t.referenceNo === refNo || t.id === comm.id);

      if (!exists) {
        rawTxList.push({
          id: `tx-${comm.id}`,
          userId: comm.agentId,
          propertyId: comm.propertyId,
          propertyTitle: comm.propertyTitle || comm.property?.title || "Agent Commission Payout",
          propertySymbol: comm.property?.symbol || "COMM",
          amount: comm.commissionAmount,
          type: "COMMISSION_PAYOUT",
          status: comm.status === "PAID" ? "COMPLETED" : "PENDING",
          paymentMethod: "Direct Bank Transfer (IMPS)",
          description: `Agent Commission Payout Disbursed for ${comm.propertyTitle || "Property Deal"}. Ref: ${refNo}`,
          referenceNo: refNo,
          notes: comm.notes,
          buyerName: null,
          sellerName: user.name,
          completedAt: comm.paidAt ? comm.paidAt.toISOString() : comm.updatedAt.toISOString(),
          createdAt: comm.updatedAt.toISOString(),
        });
      }
    }
  }

  const formattedTransactions = rawTxList.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Calculate commission & property deal metrics for user account profile header
  const totalSoldPropsCount = Math.max(soldProperties.length, userCommissions.length);
  const totalCommissionEarned = userCommissions.reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
  
  const explicitPaidCommSum = userCommissions.reduce((sum, c) => {
    const cAny = c as any;
    if (cAny.paidAmount !== undefined && cAny.paidAmount !== null) return sum + Number(cAny.paidAmount);
    if (c.status === "PAID" || c.paidAt || c.notes?.includes("Disbursed")) return sum + (c.commissionAmount || 0);
    return sum;
  }, 0);

  const completedPayoutsTxSum = userTransactions
    .filter(
      (tx) =>
        tx.status === "COMPLETED" &&
        (tx.type === "COMMISSION_PAYOUT" ||
          tx.description?.toLowerCase().includes("commission payout") ||
          tx.notes?.toLowerCase().includes("disbursed"))
    )
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const commissionPaid = Math.min(
    totalCommissionEarned,
    Math.max(explicitPaidCommSum, completedPayoutsTxSum)
  );
  const commissionPending = Math.max(0, totalCommissionEarned - commissionPaid);

  const commissionSummary = {
    totalSoldProperties: totalSoldPropsCount,
    totalCommissionEarned,
    commissionPaid,
    commissionPending,
  };

  return (
    <div>
      <AdminPageHeader
        title={user.name}
        description={`${user.email} · ${user.role}${!user.active ? " · Disabled" : ""}`}
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Users", href: "/admin/users" },
          { label: user.name },
        ]}
      />
      <UserDetailEditor
        user={{
          ...user,
          phone: user.phone ?? null,
          dob: user.dob ? user.dob.toISOString() : null,
          address: user.address ?? null,
          city: user.city ?? null,
          state: user.state ?? null,
          zip: user.zip ?? null,
          country: user.country ?? null,
          lastActiveAt: user.lastActiveAt?.toISOString() ?? null,
          createdAt: user.createdAt.toISOString(),
          kycProfile: user.kycProfile,
          loanApplications: user.loanApplications.map((l) => ({
            ...l,
            createdAt: l.createdAt.toISOString(),
            updatedAt: l.updatedAt.toISOString(),
          })),
          leadsOwned: (user.leadsOwned || []).map((l) => ({
            ...l,
            userId: leadEmailToUserIdMap.get(l.email) || null,
            createdAt: l.createdAt.toISOString(),
            updatedAt: l.updatedAt.toISOString(),
            nextFollowUpAt: l.nextFollowUpAt ? l.nextFollowUpAt.toISOString() : null,
          })),
          boughtProperties,
          soldProperties,
          userTransactions: formattedTransactions,
          commissionSummary,
        }}
        allManagers={allManagers}
        orgUnits={{
          organizations,
          franchises,
          branches,
          departments,
          teams,
        }}
      />
    </div>
  );
}
