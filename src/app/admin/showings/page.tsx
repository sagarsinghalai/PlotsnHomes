import { ShowingsManager } from "@/components/admin/showings-manager";
import { prisma } from "@/lib/prisma";
import { getServerTenantId } from "@/lib/tenant";

export default async function AdminShowingsPage() {
  const tenantId = await getServerTenantId();
  const showings = await prisma.propertyShowing.findMany({
    where: { tenantId },
    orderBy: { tourDate: "desc" },
    take: 100,
    include: {
      property: { select: { title: true, symbol: true, slug: true } },
      lead: { select: { id: true, stage: true } },
    },
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-slate-900">Site visits</h1>
      <p className="mt-1 text-slate-600">Tour requests from property pages — convert to CRM leads</p>
      <div className="mt-8">
        <ShowingsManager
          showings={showings.map((s) => ({
            ...s,
            tourDate: s.tourDate.toISOString(),
            createdAt: s.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
