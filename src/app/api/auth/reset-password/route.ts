import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Resets a password ONLY with a valid, unexpired, single-use token issued by
// /api/auth/forgot-password (emailed as a link). No token => no reset, so an
// email address alone can no longer be used to take over an account.
export async function POST(req: Request) {
  try {
    const { email, token, newPassword, confirmPassword } = await req.json();

    if (!email || !token || !newPassword) {
      return NextResponse.json(
        { error: "A valid reset link is required. Please use the link from your password reset email." },
        { status: 400 }
      );
    }
    if (String(newPassword).trim().length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 });
    }
    if (confirmPassword && newPassword !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail }, select: { id: true } });

    // Same generic error for every failure mode (no token / wrong user / expired
    // / used) so nothing is leaked.
    const invalid = () =>
      NextResponse.json({ error: "Invalid or expired reset link. Please request a new one." }, { status: 400 });

    if (!user) return invalid();

    const tokenHash = crypto.createHash("sha256").update(String(token)).digest("hex");
    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!record || record.userId !== user.id || record.usedAt || record.expiresAt < new Date()) {
      return invalid();
    }

    const passwordHash = await bcrypt.hash(String(newPassword).trim(), 10);
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { passwordHash, updatedAt: new Date() } }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      // Invalidate any other outstanding tokens for this user.
      prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Password reset successful! You can now log in with your new password.",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
