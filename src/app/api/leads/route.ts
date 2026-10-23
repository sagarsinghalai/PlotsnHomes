import { LeadStage } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth-options";
import { assignLeadOwner } from "@/lib/lead-routing";
import { calculateLeadScore } from "@/lib/lead-scoring";
import { prisma } from "@/lib/prisma";
import { resolvePublicTenantId } from "@/lib/public-tenant";
import { notifyAgentNewLead } from "@/lib/whatsapp-central";

// Public lead-capture endpoint used by the website lead-gen forms
// (home page + property pages). No authentication required — a visitor
// submits their Name + Phone and the lead lands directly in the CRM
// "All Leads" list. Email is optional.
const schema = z.object({
  name: z.string({ error: "Please enter your full name" }).trim().min(2, "Please enter your full name"),
  phone: z.string({ error: "Phone number is required" }).trim().min(6, "Please enter a valid phone number"),
  email: z
    .union([z.string().trim().email("Please enter a valid email"), z.literal("")])
    .optional(),
  propertyId: z.string().trim().optional(),
  message: z.string().trim().max(2000).optional(),
  source: z.string().trim().max(60).optional(),
});

export async function POST(req: Request) {
  try {
    const data = schema.parse(await req.json());

    // Resolve the property (if the form was submitted from a property page)
    // so we can attribute the lead and route it to the listing's agent.
    const property = data.propertyId
      ? await prisma.property.findUnique({
          where: { id: data.propertyId },
          select: { id: true, title: true, symbol: true, agentId: true, tenantId: true },
        })
      : null;

    const session = await getServerSession(authOptions);

    const ownerId = await assignLeadOwner(property?.agentId ?? undefined);

    const source = data.source?.trim() || (property ? "Property Page" : "Website");
    const lifecycleStage = "Lead";
    const leadStatus = "New";

    const score = calculateLeadScore({
      lifecycleStage,
      leadStatus,
      propertyId: property?.id,
    });

    const requirementParts: string[] = [];
    if (property) requirementParts.push(`Interested in ${property.symbol} — ${property.title}`);
    if (data.message) requirementParts.push(data.message);
    const requirements = requirementParts.length ? requirementParts.join("\n") : null;

    // Attribute to the property's tenant when the form came from a listing,
    // otherwise to the tenant whose domain the visitor is on (per-domain routing).
    const leadTenant = property?.tenantId ?? (await resolvePublicTenantId(req.headers.get("host")));
    const lead = await prisma.lead.create({
      data: {
        tenantId: leadTenant,
        name: data.name,
        email: data.email ? data.email.toLowerCase() : "",
        phone: data.phone,
        source,
        stage: LeadStage.NEW,
        score,
        propertyId: property?.id ?? null,
        ownerId,
        lifecycleStage,
        leadStatus,
        requirements,
      },
    });

    await prisma.leadActivity.create({
      data: {
        tenantId: leadTenant,
        leadId: lead.id,
        userId: session?.user?.id ?? null,
        type: "CREATED",
        message: `New website lead captured via ${source}.`,
      },
    });

    if (lead.ownerId) void notifyAgentNewLead(lead.id);

    return NextResponse.json({
      ok: true,
      message: "Thanks! Our team will reach out to you shortly.",
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: e.issues[0]?.message ?? "Please check the form and try again." },
        { status: 400 }
      );
    }
    console.error("[PlotsnHomes] public lead capture error:", e);
    return NextResponse.json({ error: "Could not submit. Please try again." }, { status: 500 });
  }
}
