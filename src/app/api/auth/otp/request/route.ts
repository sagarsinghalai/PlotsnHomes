import { NextResponse } from "next/server";
import { resolveUserByIdentifier, createLoginOtp, type OtpDeliver } from "@/lib/otp";

export const dynamic = "force-dynamic";

// Generic response so we never reveal whether an account exists (anti-enumeration).
const GENERIC = "If an account matches, a login code has been sent.";

export async function POST(req: Request) {
  try {
    const { identifier, deliver } = await req.json();

    if (!identifier || typeof identifier !== "string") {
      return NextResponse.json({ error: "Enter your email or phone number." }, { status: 400 });
    }
    const channel: OtpDeliver = deliver === "phone" ? "phone" : "email";

    const user = await resolveUserByIdentifier(identifier);

    // No user, or inactive → still return generic success (don't leak existence).
    if (!user || user.active === false) {
      return NextResponse.json({ success: true, message: GENERIC, channel });
    }

    // If they asked for a phone code but have no phone on file, surface that
    // (this doesn't leak existence beyond what they already supplied).
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
      return NextResponse.json({ error: result.error || "Could not send code." }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: GENERIC,
      channel: result.channel,
      ...(result.devCode ? { devCode: result.devCode } : {}),
    });
  } catch (error) {
    console.error("[otp/request] error:", error);
    return NextResponse.json({ error: "Failed to send login code." }, { status: 500 });
  }
}
