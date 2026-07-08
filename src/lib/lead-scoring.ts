import { prisma } from "@/lib/prisma";

type ScoringLeadInput = {
  lifecycleStage?: string | null;
  leadStatus?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  propertyId?: string | null;
  tasks?: { completed: boolean }[];
  activities?: { type: string }[];
};

export function calculateLeadScore(lead: ScoringLeadInput): number {
  let score = 10; // Base score

  // 1. Lifecycle Stage Weighting
  const stage = (lead.lifecycleStage || "").trim().toLowerCase();
  if (stage.includes("subscriber")) {
    score += 5;
  } else if (stage.includes("mql") || stage.includes("marketing qualified")) {
    score += 30;
  } else if (stage.includes("sql") || stage.includes("sales qualified")) {
    score += 45;
  } else if (stage.includes("opportunity")) {
    score += 65;
  } else if (stage.includes("success") || stage.includes("customer")) {
    score += 90;
  } else if (stage.includes("failed")) {
    score += 0;
  } else if (stage === "lead") {
    score += 15;
  } else if (stage.includes("other")) {
    score += 10;
  } else if (stage) {
    score += 10; // Generic fallback for custom stages
  }

  // 2. Lead Status Weighting
  const status = (lead.leadStatus || "").trim().toLowerCase();
  if (status === "new") {
    score += 5;
  } else if (status === "open") {
    score += 10;
  } else if (status.includes("assigned")) {
    score += 15;
  } else if (status.includes("in progress")) {
    score += 20;
  } else if (status.includes("open deal")) {
    score += 30;
  } else if (status.includes("unqualified")) {
    score += 0;
  } else if (status.includes("qualified")) {
    score += 40;
  } else if (status.includes("calling attempt")) {
    score += 10;
  } else if (status.includes("answered")) {
    score += 25;
  } else if (status.includes("no response")) {
    score += 5;
  } else if (status.includes("site visit")) {
    score += 35;
  } else if (status.includes("eoi") || status.includes("expression of interest")) {
    score += 45;
  } else if (status === "buy") {
    score += 50;
  } else if (status === "sell") {
    score += 50;
  } else if (status.includes("ask for refund")) {
    score -= 10;
  } else if (status === "allotted") {
    score += 75;
  } else if (status.includes("not - allotted") || status.includes("not allotted")) {
    score += 10;
  } else if (status === "refund") {
    score -= 20;
  }

  // 3. Budgets & Properties
  if (lead.budgetMin != null || lead.budgetMax != null) {
    score += 10;
  }
  if (lead.propertyId) {
    score += 15;
  }

  // 4. Completed Tasks
  if (lead.tasks && lead.tasks.length > 0) {
    const completedCount = lead.tasks.filter((t) => t.completed).length;
    score += Math.min(25, completedCount * 5);
  }

  // 5. Activities (timeline engagement)
  if (lead.activities && lead.activities.length > 0) {
    let activityPoints = 0;
    lead.activities.forEach((act) => {
      const type = (act.type || "").toUpperCase();
      if (type.includes("CALL")) {
        activityPoints += 5;
      } else if (type.includes("MEETING") || type.includes("MEET")) {
        activityPoints += 5;
      } else if (type.includes("NOTE")) {
        activityPoints += 2;
      } else if (type.includes("EMAIL")) {
        activityPoints += 3;
      } else {
        activityPoints += 1;
      }
    });
    score += Math.min(25, activityPoints);
  }

  // Normalize and return between 0 and 100
  return Math.max(0, Math.min(100, score));
}

// Recalculates lead score and updates it in DB
export async function refreshLeadScore(leadId: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { tasks: true, activities: true },
  });
  if (lead) {
    const newScore = calculateLeadScore(lead);
    await prisma.lead.update({
      where: { id: leadId },
      data: { score: newScore },
    });
  }
}
