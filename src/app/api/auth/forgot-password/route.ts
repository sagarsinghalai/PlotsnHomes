import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
// Generic response — never reveals whether an account exists (anti-enumeration).
const GENERIC = "If an account exists with this email, a password reset link has been sent.";

function resetEmailHtml(name: string, url: string): string {
  return `
  <div style="font-family:system-ui,Arial,sans-serif;max-width:480px;margin:0 auto">
    <h2 style="color:#0f172a">Reset your password</h2>
    <p>Hi ${name || "there"},</p>
    <p>We received a request to reset your PlotsnHomes password. Click the button below to choose a new one. This link expires in 1 hour and can be used once.</p>
    <p style="margin:24px 0">
      <a href="${url}" style="background:#f59e0b;color:#1c1301;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:700">Reset password</a>
    </p>
    <p style="color:#64748b;font-size:13px">If you didn't request this, you can safely ignore this email — your password won't change.</p>
  </div>`;
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: { id: true, name: true, email: true },
    });

    let devResetUrl: string | undefined;

    if (user) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      // Invalidate any previous unused tokens, then issue a fresh one.
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
      await prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
      });

      const base = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
      const resetUrl = `${base}/reset-password?token=${rawToken}&email=${encodeURIComponent(cleanEmail)}`;

      // Email the link (best-effort). In dev with no mail provider this is logged
      // to the EmailLog (Admin → Emails) rather than actually sent.
      try {
        await sendEmail({
          to: cleanEmail,
          subject: "Reset your PlotsnHomes password",
          html: resetEmailHtml(user.name, resetUrl),
        });
      } catch (e) {
        console.warn("[forgot-password] reset email send failed:", (e as Error)?.message);
      }

      // Dev-only convenience so you can test without a mail inbox. NEVER in prod.
      if (process.env.NODE_ENV !== "production") devResetUrl = resetUrl;
    }

    return NextResponse.json({ success: true, message: GENERIC, ...(devResetUrl ? { devResetUrl } : {}) });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Failed to process password reset request" }, { status: 500 });
  }
}
