import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCrmApi } from "@/lib/crm-access";
import { tenantScope, noTenantResponse } from "@/lib/data-access";

export const dynamic = "force-dynamic";

// GET: recent campaign log (name, who launched, when, counts, results for download).
export async function GET() {
  const auth = await requireCrmApi();
  if (auth.error) return auth.error;
  try {
    const campaigns = await prisma.whatsAppCampaign.findMany({
      where: { ...tenantScope(auth.tenantId) },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ success: true, campaigns });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// POST: record a launched campaign. The actor + timestamp are set server-side.
export async function POST(req: Request) {
  const auth = await requireCrmApi();
  if (auth.error) return auth.error;
  if (!auth.tenantId) return noTenantResponse();
  try {
    const b = await req.json();
    const results = Array.isArray(b.results) ? b.results : [];
    const sentCount = Number(b.sentCount ?? results.filter((r: any) => r.status === "SENT").length) || 0;
    const failedCount = Number(b.failedCount ?? results.filter((r: any) => r.status !== "SENT").length) || 0;
    const campaign = await prisma.whatsAppCampaign.create({
      data: {
        tenantId: auth.tenantId,
        name: (b.name || "Untitled campaign").toString().slice(0, 200),
        templateName: b.templateName ? String(b.templateName).slice(0, 200) : null,
        channels: Array.isArray(b.channels) ? b.channels.join(",") : (b.channels ? String(b.channels) : null),
        sourceType: b.sourceType ? String(b.sourceType).slice(0, 40) : null,
        audienceCount: Number(b.audienceCount ?? results.length) || 0,
        sentCount,
        failedCount,
        createdById: auth.session.user.id,
        createdByName: auth.session.user.name || auth.session.user.email || "Admin",
        createdByEmail: auth.session.user.email || null,
        createdByRole: auth.session.user.role || null,
        resultsJson: results.length ? JSON.stringify(results).slice(0, 500000) : null,
      },
      select: { id: true, createdAt: true },
    });
    return NextResponse.json({ success: true, id: campaign.id });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
