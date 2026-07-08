import { LeadStage, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SMART_LISTS, type SmartListId } from "@/lib/smart-list-defs";

export { SMART_LISTS, type SmartListId };

export async function countSmartList(listId: SmartListId, ownerId?: string): Promise<number> {
  const where = await smartListWhere(listId, ownerId);
  return prisma.lead.count({ where });
}

export async function smartListWhere(
  listId: SmartListId,
  ownerId?: string
): Promise<Prisma.LeadWhereInput> {
  const now = new Date();
  const base: Prisma.LeadWhereInput = ownerId ? { ownerId } : {};

  switch (listId) {
    case "new_enquiries":
      return { ...base, stage: LeadStage.NEW };
    case "missed_followups":
      return {
        ...base,
        nextFollowUpAt: { lt: now },
        stage: { notIn: [LeadStage.WON, LeadStage.LOST] },
      };
    case "untouched_1":
      return { ...base, stage: LeadStage.NEW, activities: { some: {} } };
    case "untouched_2": {
      const leads = await prisma.lead.findMany({
        where: { ...base, stage: LeadStage.NEW },
        select: { id: true, _count: { select: { activities: true } } },
      });
      const ids = leads.filter((l) => l._count.activities === 2).map((l) => l.id);
      return { id: { in: ids } };
    }
    case "untouched_3": {
      const leads = await prisma.lead.findMany({
        where: { ...base, stage: LeadStage.NEW },
        select: { id: true, _count: { select: { activities: true } } },
      });
      const ids = leads.filter((l) => l._count.activities >= 3).map((l) => l.id);
      return { id: { in: ids } };
    }
    case "call_later":
      return {
        ...base,
        nextFollowUpAt: { gt: now },
        stage: { notIn: [LeadStage.WON, LeadStage.LOST] },
      };
    case "reassigned":
      return {
        ...base,
        updatedAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      };
    case "site_visit":
      return { ...base, stage: LeadStage.SITE_VISIT };
    case "won_deals":
      return { ...base, stage: LeadStage.WON };
    case "active_pipeline":
      return { ...base, stage: { notIn: [LeadStage.WON, LeadStage.LOST] } };
    default:
      return base;
  }
}
