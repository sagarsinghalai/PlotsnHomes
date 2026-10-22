import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireCrmApi } from "@/lib/crm-access";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";

// GET: account info only. Passwords are stored as one-way bcrypt hashes and are
// NEVER readable — not even by the platform owner. To give a user access, reset
// to a temporary password (POST below) or use "Login as user" (impersonation).
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireCrmApi();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, active: true, lastActiveAt: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      user,
      passwordStored: false,
      note: "Passwords are not stored in readable form. Use Reset password or Login as user.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to retrieve user" }, { status: 500 });
  }
}

// POST: reset a user's password to a new value (staff only). Stores only the
// bcrypt hash; records an audit event; never persists or returns... the new
// value is returned once so the admin can share it, but it is not stored.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireCrmApi();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const { newPassword } = await req.json();

    if (!newPassword || typeof newPassword !== "string" || newPassword.trim().length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const cleanPassword = newPassword.trim();
    const passwordHash = await bcrypt.hash(cleanPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { passwordHash, updatedAt: new Date() },
    });

    await writeAudit({
      actorId: auth.session.user.id,
      actorEmail: auth.session.user.email,
      action: "PASSWORD_RESET",
      targetUserId: user.id,
      targetEmail: user.email,
    });

    return NextResponse.json({
      success: true,
      message: `Password for ${user.name || user.email} successfully reset.`,
      // Returned once so the admin can hand it over; not stored anywhere.
      temporaryPassword: cleanPassword,
    });
  } catch (error: any) {
    console.error("Admin user password reset error:", error);
    return NextResponse.json({ error: error.message || "Failed to reset password" }, { status: 500 });
  }
}
