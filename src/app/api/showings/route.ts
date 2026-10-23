import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth-options";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  propertyId: z.string(),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  tourDate: z.string(),
  tourTime: z.string(),
  tourType: z.enum(["IN_PERSON", "VIDEO"]).default("IN_PERSON"),
  message: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    const session = await getServerSession(authOptions);

    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
      include: { agent: true },
    });
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const showing = await prisma.propertyShowing.create({
      data: {
        tenantId: property.tenantId,
        propertyId: data.propertyId,
        userId: session?.user?.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        tourDate: new Date(data.tourDate),
        tourTime: data.tourTime,
        tourType: data.tourType,
        message: data.message,
      },
    });

    try {
      await sendEmail({
        to: property.agent.email,
        subject: `Tour request: ${property.title}`,
        html: `<p>${data.name} (${data.email}) requested a ${data.tourType} tour on ${data.tourDate} at ${data.tourTime} for ${property.title}.</p><p>${data.message ?? ""}</p>`,
      });
    } catch {
      /* dev log only */
    }

    return NextResponse.json({ ok: true, id: showing.id });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
