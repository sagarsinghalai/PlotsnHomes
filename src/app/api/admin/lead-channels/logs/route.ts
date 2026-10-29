import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";

export async function GET(req: Request) {
  try {
    const auth = await requireAdminApi();
    if (auth.error) return auth.error;
    const url = new URL(req.url);
    const channel = url.searchParams.get("channel") || undefined;
    const logs = await prisma.inboundLeadLog.findMany({
      where: channel ? { channel } : undefined,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, channel: true, status: true, leadId: true, name: true, phone: true, error: true, createdAt: true },
    });
    return NextResponse.json({ success: true, logs });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
