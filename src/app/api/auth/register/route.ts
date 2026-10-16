import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateNextUserId } from "@/lib/user-id";
import { checkUserExists4Params, validateUserDobAge } from "@/lib/user-validation";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional().nullable(),
  pan: z.string().optional().nullable(),
  aadhar: z.string().optional().nullable(),
  dob: z.string().optional().nullable(),
  role: z.enum(["BUYER", "SELLER", "AGENT", "EMPLOYEE", "SUPERADMIN"]).optional(),
});

export async function POST(req: Request) {
  try {
    const data = schema.parse(await req.json());

    // Validate DOB Age >= 18 from date of account creation
    if (data.dob) {
      const dobCheck = validateUserDobAge(data.dob);
      if (!dobCheck.valid) {
        return NextResponse.json({ error: dobCheck.message }, { status: 400 });
      }
    }

    // 4-Parameter User Exists Check (Email, Phone, PAN, Aadhaar)
    const check = await checkUserExists4Params({
      email: data.email,
      phone: data.phone,
      pan: data.pan,
      aadhar: data.aadhar,
    });

    if (check.exists) {
      return NextResponse.json({ error: check.message }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const roleMap: Record<string, Role> = {
      SUPERADMIN: Role.SUPERADMIN,
      EMPLOYEE: Role.EMPLOYEE,
      AGENT: Role.AGENT,
      SELLER: Role.SELLER,
      BUYER: Role.BUYER,
    };

    const role = roleMap[data.role ?? "BUYER"] ?? Role.BUYER;
    const nextUserId = await generateNextUserId();

    const user = await prisma.user.create({
      data: {
        userId: nextUserId,
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash,
        phone: data.phone ?? null,
        pan: data.pan?.trim().toUpperCase() ?? null,
        aadhar: data.aadhar?.trim() ?? null,
        dob: data.dob ? new Date(data.dob) : null,
        role,
      },
    });

    return NextResponse.json({ ok: true, userId: user.id, userCode: user.userId });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
