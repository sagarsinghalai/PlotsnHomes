import { NextResponse } from "next/server";
import { resolveUserByIdentifier, createLoginOtp, type OtpDeliver } from "@/lib/otp";

export const dynamic = "force-dynamic";

// Seller onboarding wants a clear answer: if the account doesn't exist we say so
// (so the user knows to create one); if it does, we send a real login code.
export async function POST(req: Request) {
  try {
    const { identifier, deliver } = await req.json();

    if (!identifier || typeof identifier !== "string") {
      return NextResponse.json({ error: "Enter your email or phone number." }, { status: 400 });
    }
    const channel: OtpDeliver = deliver === "phone" ? "phone" : "email";
    const looksEmail = identifier.includes("@");

    const user = await resolveUserByIdentifier(identifier);

    if (!user) {
      const kind = looksEmail ? "email" : "phone number";
      return NextResponse.json(
        { notFound: true, error: `No account exists with this ${kind}. Please create an account first.` },
        { status: 404 }
      );
    }
    if (user.active === false) {
      return NextResponse.json({ error: "This account is inactive. Please contact support." }, { status: 403 });
    }
    if (channel === "phone" && !user.phone) {
      return NextResponse.json(
        { error: "No phone number is on file for this account. Try email instead." },
        { status: 400 }
      );
    }

    const result = await createLoginOtp({
      user: { email: user.email, name: user.name, phone: user.phone },
      deliver: channel,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error || "Could not send the code." }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      channel: result.channel,
      realSent: result.realSent ?? false,
      message: result.realSent
        ? channel === "email"
          ? `We've emailed a 6-digit code to ${maskEmail(user.email)}.`
          : "We've sent a 6-digit code to your phone."
        : "A 6-digit code has been generated.",
      ...(result.devCode ? { devCode: result.devCode } : {}),
    });
  } catch (error) {
    console.error("[otp/request] error:", error);
    return NextResponse.json({ error: "Failed to send the login code." }, { status: 500 });
  }
}

function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  const shown = name.length <= 2 ? name[0] : name.slice(0, 2);
  return `${shown}${"*".repeat(Math.max(1, name.length - shown.length))}@${domain}`;
}
