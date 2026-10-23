import { PriceHistoryManager } from "@/components/admin/price-history-manager";
import { prisma } from "@/lib/prisma";
import { getServerTenantId } from "@/lib/tenant";

export default async function AdminPriceHistoryPage() {
  let properties: Array<{ id: string; title: string; symbol: string; price: number }> = [];

  try {
    const tenantId = await getServerTenantId();
    const rawProps = await prisma.property.findMany({
      where: { tenantId },
      select: {
        id: true,
        title: true,
        symbol: true,
        price: true,
      },
      orderBy: { createdAt: "desc" },
    });

    properties = rawProps.map((p) => ({
      id: p.id,
      title: p.title,
      symbol: p.symbol,
      price: p.price,
    }));
  } catch (e) {
    console.error("AdminPriceHistoryPage fetch error:", e);
  }

  return <PriceHistoryManager initialProperties={properties} />;
}
