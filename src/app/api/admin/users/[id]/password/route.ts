import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

import { isPasswordReused, recordPasswordEntry } from "@/lib/password-history-logger";

// GET: Allow SUPER ADMIN ONLY to reveal / view the user's actual registered password
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Strictly restrict password viewing to SUPERADMIN role only
  if (session.user.role !== "SUPERADMIN") {
    return NextResponse.json(
      { error: "Access Denied: Only Super Admin is authorized to view user passwords." },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        displayPassword: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Determine plain text registered password
    const plainTextPassword = user.displayPassword || "Password123!";

    return NextResponse.json({
      success: true,
      email: user.email,
      name: user.name,
      registeredPassword: plainTextPassword,
    });
  } catch (error: any) {
    console.error("GET user password error:", error);
    return NextResponse.json({ error: error.message || "Failed to retrieve password" }, { status: 500 });
  }
}

// POST: Allow Admin & Super Admin to change/reset password for any user
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const { newPassword } = await req.json();

    if (!newPassword || typeof newPassword !== "string" || newPassword.trim().length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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
      where: { id },
      data: {
        passwordHash,
        displayPassword: cleanPassword,
        updatedAt: new Date(),
      },
    });

    recordPasswordEntry(user.name || "User", user.email, cleanPassword, "UPDATED");

    return NextResponse.json({
      success: true,
      message: `Password for ${user.name || user.email} successfully updated by Admin.`,
      registeredPassword: cleanPassword,
    });
  } catch (error: any) {
    console.error("Admin user password update error:", error);
    return NextResponse.json({ error: error.message || "Failed to update password" }, { status: 500 });
  }
}
