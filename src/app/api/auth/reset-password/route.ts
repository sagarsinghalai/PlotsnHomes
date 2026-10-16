import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isPasswordReused, recordPasswordEntry } from "@/lib/password-history-logger";

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

    // Check Password Reuse Memory
    if (isPasswordReused(user.email, cleanPassword)) {
      return NextResponse.json(
        {
          error: `Password Reuse Detected: The system detected that "${cleanPassword}" was previously used for ${user.email}. Please create a new password that has not been used in the past.`,
        },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(cleanPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        displayPassword: cleanPassword,
        updatedAt: new Date(),
      },
    });

    recordPasswordEntry(user.name || "User", user.email, cleanPassword, "UPDATED");

    return NextResponse.json({
      success: true,
      message: "Password reset successful! You can now log in with your new password.",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: error.message || "Failed to reset password" }, { status: 500 });
  }
}
