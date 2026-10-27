import { prisma } from "@/lib/prisma";
import { periodEndFromInterval } from "@/lib/subscription";
import { createSubscriptionInvoice } from "@/lib/subscription-invoice";

/**
 * Renew or grant/extend a tenant's subscription (platform-owner action).
 *
 * - mode "renew": a fresh term from the tenant's current plan (from now).
 * - mode "grant": add `minutes`; with `extend` true it stacks onto the current
 *   term when that is still in the future, otherwise it starts from now.
 *
 * Either way the tenant is reactivated (status → ACTIVE, data untouched) and the
 * latest org subscription's period end is bumped. A LIFETIME/no-duration plan
 * yields no expiry (null).
 */
export type GrantInput =
  | { mode: "renew" }
  | { mode: "grant"; minutes: number; extend?: boolean };

export type GrantResult =
  | { ok: true; endsAt: Date | null }
  | { ok: false; status: number; error: string };

export async function applyTenantGrant(orgId: string, input: GrantInput): Promise<GrantResult> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, planId: true, subscriptionEndsAt: true, status: true },
  });
  if (!org) return { ok: false, status: 404, error: "Tenant not found." };

  const now = new Date();
  let endsAt: Date | null;

  // Plan details for the receipt (also used for the renew term).
  const plan = org.planId
    ? await prisma.subscriptionPlan.findUnique({
        where: { id: org.planId },
        select: { name: true, slug: true, price: true, currency: true, interval: true, durationMinutes: true },
      })
    : null;

  if (input.mode === "renew") {
    if (!org.planId) {
      return { ok: false, status: 400, error: "This tenant has no plan to renew — use a manual grant instead." };
    }
    if (!plan) return { ok: false, status: 400, error: "The tenant's plan no longer exists." };
    endsAt = periodEndFromInterval(now, plan.interval, plan.durationMinutes);
  } else {
    if (!input.minutes || input.minutes <= 0) {
      return { ok: false, status: 400, error: "Enter a positive duration." };
    }
    const base = input.extend && org.subscriptionEndsAt && org.subscriptionEndsAt > now ? org.subscriptionEndsAt : now;
    endsAt = new Date(base.getTime() + input.minutes * 60 * 1000);
  }

  await prisma.$transaction(async (tx) => {
    await tx.organization.update({
      where: { id: orgId },
      data: { subscriptionEndsAt: endsAt, status: "ACTIVE" },
    });
    const sub = await tx.userSubscription.findFirst({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (sub) {
      await tx.userSubscription.update({
        where: { id: sub.id },
        data: { currentPeriodEnd: endsAt, status: "ACTIVE" },
      });
    }

    // Record a receipt for the partner's billing history. Owner grants/renewals
    // are not in-app charges, so they are COMPLIMENTARY/manual (a renew carries
    // the plan price for reference; a bare grant carries no amount).
    await createSubscriptionInvoice(
      {
        organizationId: orgId,
        subscriptionId: sub?.id ?? null,
        planName: plan?.name ?? "Manual grant",
        planSlug: plan?.slug ?? null,
        amount: input.mode === "renew" ? plan?.price ?? 0 : 0,
        currency: plan?.currency ?? "usd",
        periodStart: now,
        periodEnd: endsAt,
        status: "COMPLIMENTARY",
        kind: input.mode === "renew" ? "renewal" : "grant",
        provider: "manual",
      },
      tx
    );
  });

  return { ok: true, endsAt };
}
