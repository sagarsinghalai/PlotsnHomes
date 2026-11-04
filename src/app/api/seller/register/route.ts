import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateNextUserId } from "@/lib/user-id";
import { checkUserExists4Params } from "@/lib/user-validation";

export const dynamic = "force-dynamic";

// Public seller signup. Role is HARD-PINNED to SELLER server-side so this endpoint
// can never be used to self-provision a staff/admin account. The chosen account
// "kind" (Individual / Developer / Agent) is a cosmetic sub-type stored in
// customFields — it does not grant any extra access.
const schema = z.object({
  name: z.string().min(2, "Enter your full name."),
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  phone: z.string().optional().nullable(),
  countryCode: z.string().optional().nullable(),
  sellerKind: z.enum(["INDIVIDUAL", "DEVELOPER", "AGENT"]).default("INDIVIDUAL"),
});

export async function POST(req: Request) {
  try {
    const data = schema.parse(await req.json());

    const phone = data.phone?.trim() || null;

    // Duplicate check (email + phone) — the client shows a "User already exists"
    // popup when `exists` is true.
    const check = await checkUserExists4Params({ email: data.email, phone });
    if (check.exists) {
      return NextResponse.json(
        { exists: true, field: check.field, message: check.message },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const nextUserId = await generateNextUserId();

    const user = await prisma.user.create({
      data: {
        userId: nextUserId,
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash,
        phone,
        countryCode: data.countryCode?.trim() || "+91",
        role: Role.SELLER,
        customFields: JSON.stringify({ sellerKind: data.sellerKind }),
      },
    });

    return NextResponse.json({ ok: true, userId: user.id, userCode: user.userId });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    }
    console.error("[seller/register] error:", e);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
