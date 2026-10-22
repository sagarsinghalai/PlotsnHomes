import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, newPassword, confirmPassword } = await req.json();

    if (!email || !newPassword) {
      return NextResponse.json({ error: "Email and new password are required" }, { status: 400 });
    }

    if (newPassword.trim().length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json({ error: "User account not found" }, { status: 404 });
    }

    const cleanPassword = newPassword.trim();
    const passwordHash = await bcrypt.hash(cleanPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successful! You can now log in with your new password.",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: error.message || "Failed to reset password" }, { status: 500 });
  }
}
