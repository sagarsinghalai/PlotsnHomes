import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth-options";
import {
  inquiryConfirmationHtml,
  inquiryEmailHtml,
  isEmailConfigured,
  sendEmail,
} from "@/lib/email";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Please enter a valid email address"),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  message: z.string().trim().min(1, "Please enter a message"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
      include: { agent: true },
    });
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const session = await getServerSession(authOptions);

    const inquiry = await prisma.inquiry.create({
      data: {
        propertyId: data.propertyId,
        userId: session?.user?.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        message: data.message,
      },
    });

    void Promise.all([
      sendEmail({
        to: property.agent.email,
        subject: `New inquiry: ${property.symbol} — ${property.title}`,
        html: inquiryEmailHtml(
          property.title,
          property.symbol,
          data.name,
          data.email,
          data.message,
          data.phone
        ),
      }),
      sendEmail({
        to: data.email,
        subject: "We received your inquiry — PlotsnHomes",
        html: inquiryConfirmationHtml(data.name, property.title),
      }),
    ]).catch((emailErr) => {
      console.error("[PlotsnHomes] inquiry email error:", emailErr);
    });

    return NextResponse.json({
      ok: true,
      inquiryId: inquiry.id,
      emailMode: isEmailConfigured() ? "resend" : "logged",
      message: isEmailConfigured()
        ? "Inquiry sent. Check your email for confirmation."
        : "Inquiry saved. Emails logged — view in Admin → Emails.",
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      const issue = e.issues[0];
      const field = issue?.path?.[0];
      const fallback =
        field === "message"
          ? "Please enter a message"
          : field === "email"
            ? "Please enter a valid email address"
            : "Please check the form and try again";
      const msg = issue?.message;
      return NextResponse.json(
        { error: msg && msg !== "Invalid input" ? msg : fallback },
        { status: 400 }
      );
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to send inquiry" }, { status: 500 });
  }
}
