import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { isSuperAdmin } from "@/lib/roles";

/**
 * Guard for platform-owner-only endpoints (the control plane): user directory,
 * impersonation, platform settings. SUPERADMIN / PLATFORM_ADMIN only.
 *
 * Note: while a platform owner is impersonating another user, their effective
 * session role is that user's role, so this guard correctly denies — the owner
 * must exit impersonation to use the control plane.
 */
export async function requirePlatformApi() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  }
  if (!isSuperAdmin(session.user.role)) {
    return { error: NextResponse.json({ error: "Platform owner access required" }, { status: 403 }) } as const;
  }
  return { session, actorId: session.user.id } as const;
}
