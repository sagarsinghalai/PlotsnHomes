import { NextResponse } from "next/server";
import { z } from "zod";
import { provisionTenantSignup } from "@/lib/signup";

/**
 * Public self-serve white-label signup (Stage C). Validates input and delegates
 * to provisionTenantSignup, which creates the tenant + White Label Admin +
 * active subscription. Payment is TEST MODE (simulated — no gateway).
 */
const schema = z.object({
  planSlug: z.string().min(1, "Choose a plan"),
  name: z.string().trim().min(2, "Enter your full name"),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  companyName: z.string().trim().min(2, "Enter your company / agency name"),
  domain: z.string().trim().optional().or(z.literal("")),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  try {
    const result = await provisionTenantSignup(parsed.data);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    }
    return NextResponse.json({
      ok: true,
      testMode: true,
      email: result.email,
      plan: result.planName,
      expiresAt: result.expiresAt ? result.expiresAt.toISOString() : null,
      message: "Your workspace is ready. Sign in to get started.",
    });
  } catch (e: any) {
    console.error("[signup] provisioning failed:", e?.message);
    return NextResponse.json({ ok: false, error: "Could not complete signup. Please try again." }, { status: 500 });
  }
}
