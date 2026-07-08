import { prisma } from "@/lib/prisma";
import { getCrmSettings } from "@/lib/crm-settings";

let roundRobinIndex = 0;

/** Pick an owner for a new lead based on CRM routing settings. */
export async function assignLeadOwner(propertyAgentId?: string | null): Promise<string | null> {
  const settings = await getCrmSettings();
  if (!settings.autoAssign) return settings.defaultOwnerId || null;

  if (settings.routingMode === "manual") {
    return settings.defaultOwnerId || null;
  }

  if (settings.routingMode === "property_agent" && propertyAgentId) {
    const agent = await prisma.user.findFirst({
      where: { id: propertyAgentId, role: "AGENT", active: true },
      select: { id: true },
    });
    if (agent) return agent.id;
  }

  const agents = await prisma.user.findMany({
    where: { role: "AGENT", active: true },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (agents.length === 0) {
    const admin = await prisma.user.findFirst({
      where: { role: "SUPERADMIN", active: true },
      select: { id: true },
    });
    return settings.defaultOwnerId || admin?.id || null;
  }

  const pick = agents[roundRobinIndex % agents.length];
  roundRobinIndex += 1;
  return pick?.id ?? settings.defaultOwnerId ?? null;
}
