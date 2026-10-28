import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { canManageUser } from "@/lib/user-management";
import { writeAudit } from "@/lib/audit";

const HIER = {
  id: true,
  role: true,
  tenantId: true,
  franchiseId: true,
  branchId: true,
  departmentId: true,
  teamId: true,
} as const;

// Activate / deactivate an account. Scoped: the actor may only act on accounts
// strictly below them within their own subtree (see canManageUser). Audited.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  let active: boolean;
  try {
    ({ active } = z.object({ active: z.boolean() }).parse(await req.json()));
  } catch {
    return NextResponse.json({ error: "A boolean 'active' is required." }, { status: 400 });
  }

  const [actor, target] = await Promise.all([
    prisma.user.findUnique({ where: { id: auth.session.user.id }, select: HIER }),
    prisma.user.findUnique({ where: { id: params.id }, select: { ...HIER, email: true, name: true } }),
  ]);
  if (!actor || !target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (!canManageUser(actor, target)) {
    return NextResponse.json({ error: "You do not have permission to manage this account." }, { status: 403 });
  }

  await prisma.user.update({
    where: { id: target.id },
    data: active
      ? { active: true, deactivatedAt: null, deactivationReason: null, selfDeleted: false }
      : { active: false, deactivatedAt: new Date(), deactivationReason: "Deactivated by admin", selfDeleted: false },
  });

  await writeAudit({
    actorId: actor.id,
    actorEmail: auth.session.user.email ?? null,
    action: active ? "USER_ACTIVATED" : "USER_DEACTIVATED",
    targetUserId: target.id,
    targetEmail: target.email,
  });

  return NextResponse.json({ ok: true, active });
}
