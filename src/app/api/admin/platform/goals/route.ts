import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { noTenantResponse } from "@/lib/data-access";

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  if (!auth.tenantId) return noTenantResponse();
  const { title, target, period } = await req.json();
  const goal = await prisma.crmGoal.create({
    data: {
      tenantId: auth.tenantId,
      title: String(title),
      target: Number(target) || 10,
      period: period ?? "monthly",
      ownerId: auth.session.user.id,
    },
  });
  return NextResponse.json({ ok: true, goal });
}
