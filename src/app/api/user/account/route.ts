import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";

/**
 * Self-serve account deletion. This is a SOFT delete: the account is deactivated
 * (active=false, selfDeleted=true) and all data is retained. The user can no
 * longer sign in and can't reinstate it themselves — only the platform owner can
 * reactivate it later from the admin console. The deletion is audited so the
 * backend has a clear record ("deleted by user").
 */
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, active: true },
  });
  if (!user) return NextResponse.json({ ok: false, error: "Account not found." }, { status: 404 });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      active: false,
      selfDeleted: true,
      deactivatedAt: new Date(),
      deactivationReason: "Account deleted by user",
    },
  });

  await writeAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "USER_SELF_DELETED",
    targetUserId: user.id,
    targetEmail: user.email,
    detail: "User deleted their own account (soft delete — data retained; platform owner can reactivate).",
  });

  return NextResponse.json({ ok: true });
}
