import { CommissionStatus, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

const updateAgentRateSchema = z.object({
  action: z.literal("UPDATE_AGENT_RATE"),
  agentId: z.string(),
  commissionRate: z.number().min(0).max(100),
});

const updateCommissionSchema = z.object({
  action: z.literal("UPDATE_COMMISSION"),
  agentId: z.string(),
  commissionId: z.string(),
  commissionPct: z.number().min(0).max(100).optional(),
  status: z.enum(["PENDING", "PAID", "CANCELLED"]).optional(),
  paymentRef: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const createCommissionSchema = z.object({
  action: z.literal("CREATE_COMMISSION"),
  agentId: z.string(),
  propertyId: z.string().nullable().optional(),
  leadId: z.string().nullable().optional(),
  propertyTitle: z.string(),
  propertyValue: z.number().min(0),
  commissionPct: z.number().min(0).max(100),
  status: z.enum(["PENDING", "PAID", "CANCELLED"]).default("PENDING"),
  paymentRef: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  soldAt: z.string().nullable().optional(),
});

const postSchema = z.discriminatedUnion("action", [
  updateAgentRateSchema,
  updateCommissionSchema,
  createCommissionSchema,
]);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get("agentId");

  if (!agentId) {
    return NextResponse.json({ error: "Agent ID is required" }, { status: 400 });
  }

  try {
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        commissionRate: true,
      },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const defaultAgentRate = agent.commissionRate ?? 3.0;

    // Fetch properties assigned to agent
    const agentProperties = await prisma.property.findMany({
      where: { agentId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        symbol: true,
        title: true,
        price: true,
        listedPrice: true,
        status: true,
        brokerageRate: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { leads: true } },
      },
    });

    // Fetch leads attached to agent or agent properties with full relational property details
    const propertyIds = agentProperties.map((p) => p.id);
    const assignedLeads = await prisma.lead.findMany({
      where: {
        OR: [
          { ownerId: agentId },
          { propertyId: { in: propertyIds } },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        property: { select: { id: true, title: true, symbol: true, price: true, brokerageRate: true, updatedAt: true } },
        inquiry: { include: { property: { select: { id: true, title: true, symbol: true, price: true, brokerageRate: true, updatedAt: true } } } },
        showing: { include: { property: { select: { id: true, title: true, symbol: true, price: true, brokerageRate: true, updatedAt: true } } } },
      },
    });

    // Fetch existing commission records
    let commissions = await prisma.agentCommission.findMany({
      where: { agentId },
      include: {
        property: { select: { id: true, title: true, symbol: true, price: true, status: true, brokerageRate: true, createdAt: true, updatedAt: true } },
        lead: { select: { id: true, name: true, email: true, phone: true, stage: true, createdAt: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Auto-sync: Create/ensure commission records for QUALIFIED / WON / Customer leads
    for (const lead of assignedLeads) {
      const isQualifiedOrCustomer =
        lead.stage === "QUALIFIED" ||
        lead.stage === "WON" ||
        (lead.leadStatus && lead.leadStatus.toLowerCase() === "customer") ||
        (lead.lifecycleStage && lead.lifecycleStage.toLowerCase() === "customer");

      if (isQualifiedOrCustomer) {
        const linkedProp = lead.property || lead.inquiry?.property || lead.showing?.property;
        const existing = commissions.find(
          (c) => c.leadId === lead.id || (linkedProp && c.propertyId === linkedProp.id)
        );

        if (!existing) {
          const propValue = linkedProp?.price || lead.budgetMax || 0;
          const commPct = linkedProp?.brokerageRate || defaultAgentRate;
          const commAmount = (propValue * commPct) / 100;

          const created = await prisma.agentCommission.create({
            data: {
              agentId,
              leadId: lead.id,
              propertyId: linkedProp?.id || null,
              propertyTitle: linkedProp?.title || `Property Purchase by ${lead.name}`,
              propertyValue: propValue,
              commissionPct: commPct,
              commissionAmount: commAmount,
              status: "PENDING",
              soldAt: lead.updatedAt || new Date(),
            },
            include: {
              property: { select: { id: true, title: true, symbol: true, price: true, status: true, brokerageRate: true, createdAt: true, updatedAt: true } },
              lead: { select: { id: true, name: true, email: true, phone: true, stage: true, createdAt: true } },
            },
          });
          commissions.push(created);
        }
      }
    }

    // Auto-sync: Create/ensure commission records for sold properties if missing
    for (const prop of agentProperties) {
      if (prop.status === "SOLD") {
        const existing = commissions.find((c) => c.propertyId === prop.id);
        if (!existing) {
          const propValue = prop.price || prop.listedPrice || 0;
          const commPct = prop.brokerageRate || defaultAgentRate;
          const commAmount = (propValue * commPct) / 100;

          const created = await prisma.agentCommission.create({
            data: {
              agentId,
              propertyId: prop.id,
              propertyTitle: prop.title,
              propertyValue: propValue,
              commissionPct: commPct,
              commissionAmount: commAmount,
              status: "PENDING",
              soldAt: prop.updatedAt,
            },
            include: {
              property: { select: { id: true, title: true, symbol: true, price: true, status: true, brokerageRate: true, createdAt: true, updatedAt: true } },
              lead: { select: { id: true, name: true, email: true, phone: true, stage: true, createdAt: true } },
            },
          });
          commissions.push(created);
        }
      }
    }

    // Auto-check Transactions: Verify if commission payout transfer to agent is COMPLETED
    const completedTransactions = await prisma.transaction.findMany({
      where: {
        status: "COMPLETED",
        OR: [
          { userId: agentId },
          { propertyId: { in: propertyIds } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    for (let i = 0; i < commissions.length; i++) {
      const comm = commissions[i];
      if (comm.status !== "PAID") {
        const matchingTx = completedTransactions.find((tx) => {
          if (comm.transactionId && tx.id === comm.transactionId) return true;
          if (comm.propertyId && tx.propertyId && tx.propertyId === comm.propertyId) return true;
          if (tx.description && tx.description.includes(comm.id)) return true;
          if (tx.notes && tx.notes.includes(comm.id)) return true;
          return false;
        });

        if (matchingTx) {
          const paidAt = matchingTx.completedAt || matchingTx.createdAt || new Date();
          const paymentRef = matchingTx.referenceNo || matchingTx.razorpayPaymentId || matchingTx.stripeSessionId || matchingTx.id;

          const updated = await prisma.agentCommission.update({
            where: { id: comm.id },
            data: {
              status: "PAID",
              paidAt,
              paymentRef,
              transactionId: matchingTx.id,
            },
            include: {
              property: { select: { id: true, title: true, symbol: true, price: true, status: true, brokerageRate: true, createdAt: true, updatedAt: true } },
              lead: { select: { id: true, name: true, email: true, phone: true, stage: true, createdAt: true } },
            },
          });
          commissions[i] = updated;
        }
      }
    }

    // Summaries
    const soldProperties = agentProperties.filter((p) => p.status === "SOLD");
    const totalSoldPropsCount = Math.max(soldProperties.length, commissions.length);
    const totalPropertiesValue = commissions.reduce((sum, c) => sum + (c.propertyValue || 0), 0);
    const totalCommissionEarned = commissions.reduce((sum, c) => sum + (c.commissionAmount || 0), 0);

    // Calculate exact paid amount from commissions and payout transactions
    const totalPayoutsDisbursed = completedTransactions
      .filter(
        (tx) =>
          tx.userId === agentId &&
          (tx.type === "COMMISSION_PAYOUT" ||
            tx.description?.toLowerCase().includes("commission payout") ||
            tx.notes?.toLowerCase().includes("disbursed"))
      )
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    const explicitPaidFromStatus = commissions.reduce((sum, c) => {
      const cAny = c as any;
      if (cAny.paidAmount !== undefined && cAny.paidAmount !== null) return sum + Number(cAny.paidAmount);
      if (c.status === "PAID") return sum + (c.commissionAmount || 0);
      return sum;
    }, 0);

    const commissionPaid = Math.min(
      totalCommissionEarned,
      Math.max(totalPayoutsDisbursed, explicitPaidFromStatus)
    );
    const commissionPending = Math.max(0, totalCommissionEarned - commissionPaid);

    const leadEmails = Array.from(new Set([
      ...assignedLeads.map((l) => l.email),
      ...commissions.map((c) => c.lead?.email).filter(Boolean) as string[],
    ])).filter(Boolean);

    const matchingLeadUsers = leadEmails.length > 0
      ? await prisma.user.findMany({
          where: { email: { in: leadEmails } },
          select: { id: true, email: true },
        })
      : [];

    const leadEmailToUserIdMap = new Map(matchingLeadUsers.map((u) => [u.email, u.id]));

    return NextResponse.json({
      ok: true,
      agent: {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        role: agent.role,
        commissionRate: defaultAgentRate,
      },
      summary: {
        totalAssignedProperties: Math.max(agentProperties.length, commissions.length),
        totalSoldProperties: totalSoldPropsCount,
        totalPropertiesValue,
        totalLeadsCount: assignedLeads.length,
        totalCommissionEarned,
        commissionPaid,
        commissionPending,
      },
      commissions: commissions.map((c) => ({
        id: c.id,
        agentId: c.agentId,
        propertyId: c.propertyId,
        propertyTitle: c.propertyTitle || c.property?.title || "N/A",
        propertySymbol: c.property?.symbol || null,
        propertyValue: c.propertyValue,
        commissionPct: c.commissionPct,
        commissionAmount: c.commissionAmount,
        status: c.status,
        paidAt: c.paidAt?.toISOString() ?? null,
        paymentRef: c.paymentRef ?? null,
        notes: c.notes ?? null,
        soldAt: c.soldAt?.toISOString() ?? c.property?.updatedAt?.toISOString() ?? null,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        propertyListedAt: c.property?.createdAt?.toISOString() ?? null,
        lead: c.lead
          ? {
              id: c.lead.id,
              userId: leadEmailToUserIdMap.get(c.lead.email) || null,
              name: c.lead.name,
              email: c.lead.email,
              phone: c.lead.phone,
              stage: c.lead.stage,
              createdAt: c.lead.createdAt.toISOString(),
            }
          : null,
      })),
      properties: agentProperties.map((p) => ({
        id: p.id,
        title: p.title,
        symbol: p.symbol,
        price: p.price,
        status: p.status,
        brokerageRate: p.brokerageRate,
        leadsCount: p._count.leads,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      leads: assignedLeads.map((l) => ({
        id: l.id,
        userId: leadEmailToUserIdMap.get(l.email) || null,
        name: l.name,
        email: l.email,
        phone: l.phone,
        stage: l.stage,
        propertyId: l.propertyId,
        propertyTitle: l.property?.title || null,
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("GET /api/admin/commission error:", error);
    return NextResponse.json({ error: "Failed to load commission data" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const parsed = postSchema.parse(body);

    if (parsed.action === "UPDATE_AGENT_RATE") {
      await prisma.user.update({
        where: { id: parsed.agentId },
        data: { commissionRate: parsed.commissionRate },
      });
      return NextResponse.json({ ok: true, message: "Agent base commission rate updated" });
    }

    if (parsed.action === "UPDATE_COMMISSION") {
      const existing = await prisma.agentCommission.findUnique({
        where: { id: parsed.commissionId },
      });
      if (!existing) {
        return NextResponse.json({ error: "Commission record not found" }, { status: 404 });
      }

      const newPct = parsed.commissionPct ?? existing.commissionPct;
      const newAmount = (existing.propertyValue * newPct) / 100;
      const newStatus = parsed.status ?? existing.status;

      let paidAt = existing.paidAt;
      if (newStatus === "PAID" && existing.status !== "PAID") {
        paidAt = new Date();
      } else if (newStatus === "PENDING") {
        paidAt = null;
      }

      const updated = await prisma.agentCommission.update({
        where: { id: parsed.commissionId },
        data: {
          commissionPct: newPct,
          commissionAmount: newAmount,
          status: newStatus,
          paidAt,
          paymentRef: parsed.paymentRef !== undefined ? parsed.paymentRef : existing.paymentRef,
          notes: parsed.notes !== undefined ? parsed.notes : existing.notes,
        },
      });

      if (existing.propertyId) {
        await prisma.property.update({
          where: { id: existing.propertyId },
          data: { brokerageRate: newPct },
        });
      }

      return NextResponse.json({ ok: true, commission: updated });
    }

    if (parsed.action === "CREATE_COMMISSION") {
      const commAmount = (parsed.propertyValue * parsed.commissionPct) / 100;
      const created = await prisma.agentCommission.create({
        data: {
          agentId: parsed.agentId,
          propertyId: parsed.propertyId || null,
          leadId: parsed.leadId || null,
          propertyTitle: parsed.propertyTitle,
          propertyValue: parsed.propertyValue,
          commissionPct: parsed.commissionPct,
          commissionAmount: commAmount,
          status: parsed.status,
          paidAt: parsed.status === "PAID" ? new Date() : null,
          paymentRef: parsed.paymentRef || null,
          notes: parsed.notes || null,
          soldAt: parsed.soldAt ? new Date(parsed.soldAt) : new Date(),
        },
      });
      return NextResponse.json({ ok: true, commission: created });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error("POST /api/admin/commission error:", error);
    return NextResponse.json({ error: "Failed to process commission update" }, { status: 500 });
  }
}
