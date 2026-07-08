import { PayoutsManager } from "@/components/admin/payouts-manager";
import { prisma } from "@/lib/prisma";

export default async function AdminPayoutsPage() {
  // Query active properties to schedule dividends
  const properties = await prisma.property.findMany({
    where: { status: "ACTIVE" },
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
    // Generate static/deterministic investor counts for UI fidelity
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

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-slate-900">Dividend Payouts</h1>
      <p className="mt-1 text-slate-600 mb-8">
        Manage dividend schedules, calculate yields, and execute monthly pool payouts
      </p>
      <PayoutsManager properties={parsedProperties} />
    </div>
  );
}
