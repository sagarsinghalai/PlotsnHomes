import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const leads = await prisma.lead.findMany({
    include: { property: { select: { symbol: true } }, owner: { select: { name: true } } },
  });

  const header = "name,email,phone,source,stage,score,property,owner,createdAt\n";
  const rows = leads.map(
    (l) =>
      `"${l.name}","${l.email}","${l.phone ?? ""}","${l.source}","${l.stage}",${l.score},"${l.property?.symbol ?? ""}","${l.owner?.name ?? ""}","${l.createdAt.toISOString()}"`
  );

  await prisma.bulkJob.create({
    data: {
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
