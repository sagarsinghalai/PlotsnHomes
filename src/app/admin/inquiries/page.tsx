import { InquiriesManager } from "@/components/admin/inquiries-manager";
import { prisma } from "@/lib/prisma";
import { getServerTenantId } from "@/lib/tenant";

export default async function AdminInquiriesPage() {
  const tenantId = await getServerTenantId();
  const inquiries = await prisma.inquiry.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      property: { select: { title: true, symbol: true } },
      lead: { select: { id: true, stage: true } },
    },
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-slate-900">Inquiries</h1>
      <p className="mt-1 text-slate-600">
        {inquiries.length} inquiries · convert to CRM or delete spam
      </p>

      <div className="mt-8">
        <InquiriesManager
          inquiries={inquiries.map((q) => ({
            ...q,
            createdAt: q.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
