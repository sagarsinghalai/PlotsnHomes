import { prisma } from "@/lib/prisma";
import { PricingSharesManager, PropertyPricingItem } from "@/components/admin/pricing-shares-manager";
import { getServerTenantId } from "@/lib/tenant";

export default async function AdminPricingPage() {
  const tenantId = await getServerTenantId();
  const properties = await prisma.property.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      symbol: true,
      title: true,
      city: true,
      state: true,
      country: true,
      price: true,
      yieldRate: true,
      brokerageRate: true,
      status: true,
      images: true,
      customFields: true,
    },
  });

  const formattedProperties: PropertyPricingItem[] = properties.map((p) => ({
    id: p.id,
    symbol: p.symbol || `BKV-PROP-${p.id.substring(0, 4)}`,
    title: p.title,
    city: p.city || "Mumbai",
    state: p.state || "MH",
    country: p.country || "IN",
    price: p.price,
    yieldRate: p.yieldRate || 7.0,
    brokerageRate: p.brokerageRate || 0.5,
    status: p.status || "ACTIVE",
    images: p.images || "[]",
    customFields: p.customFields || "{}",
  }));

  return <PricingSharesManager initialProperties={formattedProperties} />;
}
