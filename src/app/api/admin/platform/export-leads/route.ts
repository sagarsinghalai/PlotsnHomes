import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { tenantScope, noTenantResponse } from "@/lib/data-access";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  if (!auth.tenantId) return noTenantResponse();

  const leads = await prisma.lead.findMany({
    where: { ...tenantScope(auth.tenantId) },
    include: { property: { select: { symbol: true } }, owner: { select: { name: true } } },
  });

  const header = "name,email,phone,source,stage,score,property,owner,createdAt\n";
  const rows = leads.map(
    (l) =>
      `"${l.name}","${l.email}","${l.phone ?? ""}","${l.source}","${l.stage}",${l.score},"${l.property?.symbol ?? ""}","${l.owner?.name ?? ""}","${l.createdAt.toISOString()}"`
  );

  await prisma.bulkJob.create({
    data: {
      tenantId: auth.tenantId,
      type: "EXPORT_LEADS",
      status: "COMPLETED",
      recordCount: leads.length,
      createdById: auth.session.user.id,
    },
  });

  return new NextResponse(header + rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="leads-export.csv"',
    },
  });
}
