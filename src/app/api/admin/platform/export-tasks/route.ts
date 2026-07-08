import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const tasks = await prisma.leadTask.findMany({
    include: { lead: { select: { name: true, email: true } } },
  });

  const header = "leadName,leadEmail,title,completed,dueAt\n";
  const rows = tasks.map(
    (t) =>
      `"${t.lead.name}","${t.lead.email}","${t.title}",${t.completed},"${t.dueAt?.toISOString() ?? ""}"`
  );

  return new NextResponse(header + rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="tasks-export.csv"',
    },
  });
}
