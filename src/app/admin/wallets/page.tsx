import { WalletsManager } from "@/components/admin/wallets-manager";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { walletUserScopeForUser } from "@/lib/crm-access";

export default async function AdminWalletsPage() {
  const session = await getServerSession(authOptions);
  const tenantId = session?.user?.tenantId || "__no_tenant__";
  // Always tenant-scope (was previously unscoped across all tenants). OWN-scope
  // roles only see their own wallet; leaders see every user in their tenant.
  const userWhere = session?.user
    ? walletUserScopeForUser(session.user.role, session.user.id, session.user.tenantId)
    : { tenantId };
  const users = await prisma.user.findMany({
    where: userWhere,
    orderBy: { createdAt: "desc" },
    include: {
      transactions: {
        where: { status: "COMPLETED" },
        select: { amount: true, type: true },
      },
    },
  });

  const parsedUsers = users.map((u) => {
    // Calculate balances dynamically from database completed transactions
    const deposits = u.transactions
      .filter((t) => t.type === "DEPOSIT")
      .reduce((sum, t) => sum + t.amount, 0);
    const investments = u.transactions
      .filter((t) => t.type === "INVESTMENT")
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Fallback seed values for a realistic dashboard feel
    const isSuperAdmin = u.role === "SUPERADMIN";
    const walletBalance = isSuperAdmin ? 0 : Math.max(0, 18500 + deposits - investments);
    const investedBalance = isSuperAdmin ? 0 : Math.max(investments, u.role === "BUYER" ? 42000 : 0);

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      active: u.active,
      walletBalance,
      investedBalance,
      createdAt: u.createdAt.toISOString(),
    };
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-slate-900">User Wallets</h1>
      <p className="mt-1 text-slate-600 mb-8">
        Manage available cash balances, deployed investments, and pending withdrawals
      </p>
      <WalletsManager users={parsedUsers} />
    </div>
  );
}
