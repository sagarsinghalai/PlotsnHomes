import { LeadStage } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { assignLeadOwner } from "@/lib/lead-routing";
import { prisma } from "@/lib/prisma";
import { noTenantResponse } from "@/lib/data-access";

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  if (!auth.tenantId) return noTenantResponse();

  const { csv, fileName } = (await req.json()) as { csv: string; fileName?: string };
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    return NextResponse.json({ error: "CSV needs header + at least one row" }, { status: 400 });
  }

  const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
  const idx = (k: string) => header.indexOf(k);

  let count = 0;
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const name = cols[idx("name")];
    const email = cols[idx("email")];
    if (!name || !email || idx("name") < 0 || idx("email") < 0) continue;

    const ownerId = await assignLeadOwner();
    await prisma.lead.create({
      data: {
        tenantId: auth.tenantId,
        name,
        email,
        phone: idx("phone") >= 0 ? cols[idx("phone")] || null : null,
        source: idx("source") >= 0 ? cols[idx("source")] || "Import" : "Import",
        stage: (idx("stage") >= 0 ? cols[idx("stage")] : "NEW") as LeadStage,
        notes: idx("notes") >= 0 ? cols[idx("notes")] || null : null,
        ownerId,
      },
    });
    count += 1;
  }

  await prisma.bulkJob.create({
    data: {
      tenantId: auth.tenantId,
      type: "IMPORT_LEADS",
      status: "COMPLETED",
      fileName: fileName ?? "import.csv",
      recordCount: count,
      createdById: auth.session.user.id,
    },
  });

  return NextResponse.json({ ok: true, count });
}
