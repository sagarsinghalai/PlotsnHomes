// src/lib/commission.ts

import { prisma } from "@/lib/prisma";
import { CommissionStatus } from "@prisma/client";

/**
 * Calculate and record agent commission for a completed transaction.
 * Uses the user's `commissionRate` (percentage) to compute the commission amount.
 * Creates an AgentCommission record linked to the transaction, property and agent.
 */
export async function calculateAndRecordCommission(transactionId: string) {
  // Fetch transaction with related property and agent
  const tx = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      property: { select: { id: true, title: true, symbol: true, slug: true, price: true, city: true, state: true, address: true, images: true, agentId: true } },
      user: true,
    },
  });

  if (!tx || !tx.property) return null;

  // Find agent (owner of the property)
  const agent = await prisma.user.findUnique({
    where: { id: tx.property.agentId },
    select: { id: true, commissionRate: true },
  });

  if (!agent) return null;

  const rate = agent.commissionRate ?? 0;
  const commissionAmount = Number((tx.amount * rate) / 100).toFixed(2);

  // Create commission record
  const commission = await prisma.agentCommission.create({
    data: {
      tenantId: tx.tenantId,
      agentId: agent.id,
      propertyId: tx.property.id,
      transactionId: tx.id,
      propertyTitle: tx.property.title,
      propertyValue: tx.property.price,
      commissionPct: rate,
      commissionAmount: Number(commissionAmount),
      status: CommissionStatus.PENDING,
    },
  });

  return commission;
}
