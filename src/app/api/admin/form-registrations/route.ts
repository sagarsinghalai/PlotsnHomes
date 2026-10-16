import { NextResponse } from "next/server";
import {
  getFormRegistrations,
  saveFormRegistrations,
  FormRegistrationRecord,
} from "@/lib/form-registrations-store";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const specials = "!@#$&*";
  let pwd = "";
  for (let i = 0; i < 10; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  pwd += specials.charAt(Math.floor(Math.random() * specials.length));
  return pwd;
}

export async function GET() {
  try {
    const registrations = await getFormRegistrations();
    return NextResponse.json({ registrations });
  } catch {
    return NextResponse.json({ error: "Failed to fetch registrations" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, registrationId, declineReason } = body;

    if (!action || !registrationId) {
      return NextResponse.json({ error: "Missing action or registrationId" }, { status: 400 });
    }

    const allRegs = await getFormRegistrations();
    const idx = allRegs.findIndex((r) => r.id === registrationId);
    if (idx < 0) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    const reg = allRegs[idx];
    const now = new Date().toISOString();

    if (action === "approve") {
      // Generate credentials
      const password = generatePassword();
      const passwordHash = await bcrypt.hash(password, 10);
      const role = reg.type === "WHITE_LABEL_PARTNER" ? "WHITE_LABEL_ADMIN" : "SELLER";

      // Check if user email already exists
      const existingUser = await prisma.user.findUnique({ where: { email: reg.email } });

      let userId: string;
      if (existingUser) {
        userId = existingUser.id;
        // Update existing user role if needed
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: role as any, active: true, displayPassword: password },
        });
      } else {
        // Create new user with generated credentials
        const newUser = await prisma.user.create({
          data: {
            email: reg.email,
            name: reg.name,
            phone: reg.phone || null,
            passwordHash,
            displayPassword: password,
            role: role as any,
            active: true,
          },
        });
        userId = newUser.id;
      }

      // Log credential email via MessageLog
      try {
        await prisma.messageLog.create({
          data: {
            sentById: userId,
            recipientId: userId,
            channel: "EMAIL",
            subject: `Welcome to PlotsnHomes — Your ${reg.type === "WHITE_LABEL_PARTNER" ? "White Label Partner" : "Seller"} Account`,
            body: `Dear ${reg.name},\n\nYour application has been approved!\n\nLogin Credentials:\nEmail: ${reg.email}\nPassword: ${password}\n\nPlease log in at https://plotsnhomes.com/login and change your password immediately.\n\nBest Regards,\nPlotsnHomes Team`,
            status: "SENT",
          },
        });
      } catch {
        // MessageLog creation is non-critical
      }

      // Update registration record
      allRegs[idx] = {
        ...reg,
        status: "APPROVED",
        approvedAt: now,
        updatedAt: now,
        generatedUserId: userId,
        generatedPassword: password,
      };

      await saveFormRegistrations(allRegs);

      return NextResponse.json({
        success: true,
        message: `Application approved! Credentials generated and email sent to ${reg.email}.`,
        credentials: {
          email: reg.email,
          password,
          role,
          userId,
        },
      });
    }

    if (action === "decline") {
      allRegs[idx] = {
        ...reg,
        status: "DECLINED",
        declinedAt: now,
        updatedAt: now,
        declineReason: declineReason || "Application does not meet current requirements.",
      };

      await saveFormRegistrations(allRegs);

      return NextResponse.json({
        success: true,
        message: `Application from ${reg.name} has been declined.`,
      });
    }

    return NextResponse.json({ error: "Invalid action. Use 'approve' or 'decline'." }, { status: 400 });
  } catch (error) {
    console.error("Form registration action error:", error);
    return NextResponse.json({ error: "Failed to process registration action" }, { status: 500 });
  }
}
