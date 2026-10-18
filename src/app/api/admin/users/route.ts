import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { generateNextUserId } from "@/lib/user-id";
import { checkUserExists4Params, validateUserDobAge } from "@/lib/user-validation";

const createSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").regex(/^[a-zA-Z\s]+$/, "Name can only contain alphabets and spaces"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional().nullable().or(z.literal("")).refine(
    (val) => {
      if (!val) return true;
      // Exactly 10 digits — the country code is stored separately.
      return /^\d{10}$/.test(val.replace(/\D/g, "")) && val.replace(/\D/g, "").length === 10;
    },
    { message: "Phone number must be exactly 10 digits (country code is stored separately)." }
  ),
  countryCode: z.string().optional().nullable().or(z.literal("")),
  pan: z.string().optional().nullable().or(z.literal("")),
  aadhar: z.string().optional().nullable().or(z.literal("")),
  dob: z.string().optional().nullable().or(z.literal("")),
  role: z.nativeEnum(Role).default(Role.BUYER),
});

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const data = createSchema.parse(body);
    const email = data.email.toLowerCase();

    // Validate DOB Age >= 18 from account creation date
    if (data.dob) {
      const dobCheck = validateUserDobAge(data.dob);
      if (!dobCheck.valid) {
        return NextResponse.json({ error: dobCheck.message }, { status: 400 });
      }
    }

    // 4-Parameter User Exists Check (Email, Phone, PAN, Aadhaar)
    const check = await checkUserExists4Params({
      email,
      phone: data.phone,
      pan: data.pan,
      aadhar: data.aadhar,
    });

    if (check.exists) {
      return NextResponse.json({ error: check.message }, { status: 400 });
    }

    if (data.role === Role.SUPERADMIN && auth.session?.user?.role !== Role.SUPERADMIN) {
      return NextResponse.json({ error: "Only a Super Admin can assign the Super Admin role." }, { status: 403 });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const nextUserId = await generateNextUserId();

    const user = await prisma.user.create({
      data: {
        userId: nextUserId,
        name: data.name,
        email,
        passwordHash,
        phone: data.phone ? data.phone.replace(/\D/g, "") : null,
        countryCode: data.phone ? (data.countryCode || "+91") : undefined,
        pan: data.pan?.trim().toUpperCase() ?? null,
        aadhar: data.aadhar?.trim() ?? null,
        dob: data.dob ? new Date(data.dob) : null,
        role: data.role,
      },
    });

    return NextResponse.json({ ok: true, user: { id: user.id } });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Could not create user" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const url = new URL(req.url);
  const q = url.searchParams.get("search") || "";
  const role = url.searchParams.get("role") || "";

  const where: any = {};
  if (role && role !== "ALL") {
    where.role = role;
  }

  if (q.trim()) {
    const query = q.trim();
    where.OR = [
      { userId: { contains: query } },
      { name: { contains: query } },
      { email: { contains: query } },
      { phone: { contains: query } },
      { pan: { contains: query } },
      { aadhar: { contains: query } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      userId: true,
      name: true,
      email: true,
      phone: true,
      pan: true,
      aadhar: true,
      role: true,
      active: true,
      createdAt: true,
    },
    take: 200,
  });

  return NextResponse.json({ users });
}
