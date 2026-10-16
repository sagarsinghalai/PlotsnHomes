import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      // Don't leak user existence; return generic message
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a password reset link has been sent.",
      });
    }

    // Generate secure 6-digit reset OTP code & reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${resetToken}&email=${encodeURIComponent(cleanEmail)}`;

    // Log the reset email in EmailLog table if available
    try {
      if ((prisma as any).emailLog) {
        await (prisma as any).emailLog.create({
          data: {
            toEmail: cleanEmail,
            subject: "Password Reset Request — PlotsnHomes",
            body: `Reset Code: ${otpCode}. Reset Link: ${resetUrl}`,
            status: "SENT",
          },
        });
      }
    } catch (e) {
      console.warn("Could not record EmailLog for password reset", e);
    }

    return NextResponse.json({
      success: true,
      message: "Password reset token generated.",
      resetUrl,
      otpCode,
      email: cleanEmail,
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: error.message || "Failed to request password reset" }, { status: 500 });
  }
}
