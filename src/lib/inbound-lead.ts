import { LeadStage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assignLeadOwner } from "@/lib/lead-routing";
import { calculateLeadScore } from "@/lib/lead-scoring";
import { notifyAgentNewLead } from "@/lib/whatsapp-central";
import { getChannel, type LeadChannelConfig } from "@/lib/lead-channels";
import { resolveTenantForOwnerOrProperty } from "@/lib/tenant";

const teamRoundRobin: Record<string, number> = {};

async function resolveOwner(cfg: LeadChannelConfig | null): Promise<string | null> {
  if (cfg?.assignOwnerId) return cfg.assignOwnerId;
  if (cfg?.assignTeamId) {
    const members = await prisma.user.findMany({
      where: { teamId: cfg.assignTeamId, active: true },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (members.length) {
      const i = (teamRoundRobin[cfg.assignTeamId] ?? 0) % members.length;
      teamRoundRobin[cfg.assignTeamId] = i + 1;
      return members[i].id;
    }
  }
  // Fall back to the global CRM auto-assign (round-robin among agents / default owner)
  return assignLeadOwner();
}

export type InboundLeadInput = {
  channel: string;
  name?: string;
  phone?: string;
  email?: string;
  message?: string;
  sourceLabel?: string;
  propertyId?: string; // link the lead to the property the person enquired about
  tenantId?: string | null; // owning tenant (resolved by the webhook); falls back to property/owner/primary
  rawPayload?: any;
};

export type InboundLeadResult = { status: "CREATED" | "DUPLICATE" | "IGNORED" | "ERROR"; leadId?: string; error?: string };

/**
 * Create a CRM lead from an inbound channel (Meta / Google / portal / generic),
 * reusing the website lead pipeline: per-channel assignment (owner or team
 * round-robin, else global auto-assign), scoring, activity log, agent WhatsApp
 * notification, de-duplication, and an InboundLeadLog audit row.
 */
export async function createInboundLead(input: InboundLeadInput): Promise<InboundLeadResult> {
  const { channel } = input;
  const payloadStr = (() => { try { return JSON.stringify(input.rawPayload ?? {}).slice(0, 8000); } catch { return "{}"; } })();
  const name = (input.name || "").trim();
  const phone = (input.phone || "").trim();

  async function log(status: string, extra: { leadId?: string; error?: string } = {}) {
    try {
      const logTenant = input.tenantId ?? (await resolveTenantForOwnerOrProperty(null, input.propertyId ?? null));
      await prisma.inboundLeadLog.create({
        data: { tenantId: logTenant, channel, status, name: name || null, phone: phone || null, payload: payloadStr, leadId: extra.leadId ?? null, error: extra.error ?? null },
      });
    } catch { /* logging must never break ingestion */ }
  }

  try {
    const cfg = await getChannel(channel, input.tenantId);
    if (!name && !phone) {
      await log("IGNORED", { error: "Missing name and phone" });
      return { status: "IGNORED", error: "Missing name and phone" };
    }

    // De-dupe: same phone + channel within the last 10 minutes
    if (phone) {
      const recent = await prisma.lead.findFirst({
        where: { phone, source: cfg?.label || channel, createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) } },
        select: { id: true },
      });
      if (recent) {
        await log("DUPLICATE", { leadId: recent.id });
        return { status: "DUPLICATE", leadId: recent.id };
      }
    }

    const ownerId = await resolveOwner(cfg);
    const lifecycleStage = "Lead";
    const leadStatus = "New";
    const score = calculateLeadScore({ lifecycleStage, leadStatus });
    const stage = (cfg?.defaultStage && (LeadStage as any)[cfg.defaultStage]) ? (cfg!.defaultStage as LeadStage) : LeadStage.NEW;
    const source = input.sourceLabel || cfg?.label || channel;

    // Only attach the property if it still exists (avoid FK errors on a bad ref).
    let propertyId: string | null = null;
    if (input.propertyId) {
      const prop = await prisma.property.findUnique({ where: { id: input.propertyId }, select: { id: true } });
      propertyId = prop?.id ?? null;
    }

    const tenantId = input.tenantId ?? (await resolveTenantForOwnerOrProperty(ownerId, propertyId));

    const lead = await prisma.lead.create({
      data: {
        tenantId,
        name: name || "Unknown",
        email: (input.email || "").trim().toLowerCase(),
        phone: phone || null,
        source,
        stage,
        score,
        ownerId,
        propertyId,
        lifecycleStage,
        leadStatus,
        requirements: input.message?.trim() || null,
      },
    });

    await prisma.leadActivity.create({
      data: { tenantId, leadId: lead.id, type: "CREATED", message: `New lead received from ${source}.` },
    });

    if (lead.ownerId) void notifyAgentNewLead(lead.id);

    await log("CREATED", { leadId: lead.id });
    return { status: "CREATED", leadId: lead.id };
  } catch (e: any) {
    await log("ERROR", { error: e?.message || "Unknown error" });
    return { status: "ERROR", error: e?.message || "Unknown error" };
  }
}
