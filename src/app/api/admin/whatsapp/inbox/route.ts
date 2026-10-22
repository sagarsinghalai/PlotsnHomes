import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCrmApi } from "@/lib/crm-access";

export const dynamic = "force-dynamic";

const WINDOW_MS = 24 * 60 * 60 * 1000;
const CUSTOMER_ROLES = new Set(["BUYER", "SELLER", "DEMO"]);

// Agent WhatsApp inbox: one row per contact who has WhatsApp activity, with the
// last message, assigned agent, and whether the 24-hour free-reply window is
// still open. Agents see only conversations for leads assigned to them; admins
// can pass ?scope=all. Replies happen in the existing conversation workspace.
export async function GET(req: Request) {
  const auth = await requireCrmApi();
  if (auth.error) return auth.error;

  try {
    const scope = new URL(req.url).searchParams.get("scope") || "mine";
    const wantAll = scope === "all" && auth.isAdmin;

    const logs = await prisma.messageLog.findMany({
      where: { channel: "WHATSAPP" },
      orderBy: { createdAt: "desc" },
      take: 600,
      include: {
        sentBy: { select: { id: true, name: true, email: true, role: true, phone: true } },
        recipient: { select: { id: true, name: true, email: true, role: true, phone: true } },
      },
    });

    type Conv = {
      contactId: string;
      contactName: string;
      contactEmail: string;
      phone: string;
      lastBody: string;
      lastAt: string;
      lastInboundAt: string | null;
      count: number;
    };
    const byContact = new Map<string, Conv>();

    for (const m of logs) {
      // The contact is the customer party; skip staff-to-staff rows.
      const sentIsCustomer = m.sentBy && CUSTOMER_ROLES.has(m.sentBy.role);
      const recvIsCustomer = m.recipient && CUSTOMER_ROLES.has(m.recipient.role);
      const contact = sentIsCustomer ? m.sentBy : recvIsCustomer ? m.recipient : null;
      if (!contact) continue;

      const inbound = sentIsCustomer; // customer -> us
      const at = m.createdAt.toISOString();
      const existing = byContact.get(contact.id);
      if (!existing) {
        byContact.set(contact.id, {
          contactId: contact.id,
          contactName: contact.name,
          contactEmail: contact.email,
          phone: m.toPhone || contact.phone || "",
          lastBody: m.body.slice(0, 140),
          lastAt: at,
          lastInboundAt: inbound ? at : null,
          count: 1,
        });
      } else {
        existing.count += 1;
        if (at > existing.lastAt) { existing.lastAt = at; existing.lastBody = m.body.slice(0, 140); }
        if (inbound && (!existing.lastInboundAt || at > existing.lastInboundAt)) existing.lastInboundAt = at;
      }
    }

    // Map contacts to leads (by email) to get the assigned agent + lead id.
    const emails = Array.from(byContact.values()).map((c) => c.contactEmail).filter(Boolean);
    const leads = emails.length
      ? await prisma.lead.findMany({
          where: { email: { in: emails } },
          select: { id: true, name: true, email: true, ownerId: true, owner: { select: { name: true } }, property: { select: { symbol: true, title: true } } },
        })
      : [];
    const leadByEmail = new Map(leads.map((l) => [l.email, l]));

    const now = Date.now();
    let conversations = Array.from(byContact.values()).map((c) => {
      const lead = leadByEmail.get(c.contactEmail);
      const windowOpen = !!c.lastInboundAt && now - new Date(c.lastInboundAt).getTime() < WINDOW_MS;
      return {
        ...c,
        leadId: lead?.id ?? null,
        leadName: lead?.name ?? c.contactName,
        assignedAgentId: lead?.ownerId ?? null,
        assignedAgentName: lead?.owner?.name ?? null,
        property: lead?.property ? `${lead.property.title} (${lead.property.symbol})` : null,
        windowOpen,
      };
    });

    if (!wantAll) {
      conversations = conversations.filter((c) => c.assignedAgentId === auth.userId);
    }
    conversations.sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1));

    return NextResponse.json({ success: true, scope: wantAll ? "all" : "mine", conversations });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || "Failed to load inbox" }, { status: 500 });
  }
}
