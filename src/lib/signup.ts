import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { periodEndFromInterval } from "@/lib/subscription";
import { writeAudit } from "@/lib/audit";
import { slugify } from "@/lib/utils";

/**
 * Self-serve white-label provisioning (Stage C).
 *
 * Creates a tenant (Organization) + its White Label Admin + an active
 * subscription in one transaction and activates it with an expiry computed from
 * the plan. Payment is simulated (test mode); a real gateway later confirms
 * payment and calls this same path.
 */
export type ProvisionInput = {
  planSlug: string;
  name: string;
  email: string;
  password: string;
  companyName: string;
  domain?: string | null;
  paymentRef?: string | null;
};

export type ProvisionResult =
  | { ok: true; orgId: string; adminId: string; planName: string; expiresAt: Date | null; email: string }
  | { ok: false; status: number; error: string };

async function uniqueOrgName(base: string): Promise<string> {
  let name = base;
  for (let i = 2; i < 50; i++) {
    const clash = await prisma.organization.findUnique({ where: { name }, select: { id: true } });
    if (!clash) return name;
    name = `${base} ${i}`;
  }
  return `${base} ${Date.now().toString().slice(-5)}`;
}

async function uniqueOrgCode(base: string): Promise<string> {
  const root = (slugify(base) || "org").replace(/-/g, "").slice(0, 20) || "org";
  let code = root;
  for (let i = 0; i < 50; i++) {
    const clash = await prisma.organization.findUnique({ where: { code }, select: { id: true } });
    if (!clash) return code;
    code = `${root}${Math.floor(1000 + Math.random() * 9000)}`;
  }
  return `${root}${Date.now().toString().slice(-6)}`;
}

function cleanDomain(raw: string | null | undefined): string {
  return (raw || "").toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim();
}

export async function provisionTenantSignup(input: ProvisionInput): Promise<ProvisionResult> {
  const email = input.email.trim().toLowerCase();

  const plan = await prisma.subscriptionPlan.findFirst({ where: { slug: input.planSlug, active: true } });
  if (!plan) return { ok: false, status: 404, error: "That plan is not available." };

  const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existingUser) {
    return { ok: false, status: 409, error: "An account with this email already exists. Please sign in instead." };
  }

  const domain = cleanDomain(input.domain);
  if (domain) {
    const domClash = await prisma.organization.findFirst({ where: { domain }, select: { id: true } });
    if (domClash) return { ok: false, status: 409, error: "That domain is already in use." };
  }

  const now = new Date();
  const endsAt = periodEndFromInterval(now, plan.interval, plan.durationMinutes);
  const name = await uniqueOrgName(input.companyName.trim());
  const code = await uniqueOrgCode(input.companyName);
  const passwordHash = await bcrypt.hash(input.password, 12);

  const result = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: { name, code, domain: domain || null, status: "ACTIVE", planId: plan.id, subscriptionEndsAt: endsAt },
    });
    const admin = await tx.user.create({
      data: {
        name: input.name.trim(),
        email,
        passwordHash,
        role: Role.WHITE_LABEL_ADMIN,
        active: true,
        tenantId: org.id,
        hierarchyLevel: "Tenant",
        dataScope: "WL",
      },
    });
    await tx.organization.update({ where: { id: org.id }, data: { whiteLabelAdminId: admin.id } });
    await tx.userSubscription.create({
      data: {
        userId: admin.id,
        organizationId: org.id,
        planId: plan.id,
        amount: plan.price,
        currency: plan.currency,
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: endsAt,
        notes: input.paymentRef && input.paymentRef !== "test-mode"
          ? `Signup payment ${input.paymentRef}`
          : "TEST-MODE signup (no real payment gateway)",
      },
    });
    return { orgId: org.id, adminId: admin.id };
  });

  await writeAudit({
    actorId: result.adminId,
    actorEmail: email,
    action: "TENANT_SIGNUP",
    detail: `${name} subscribed to ${plan.name} (test mode); ends ${endsAt ? endsAt.toISOString() : "never"}`,
  });

  return { ok: true, orgId: result.orgId, adminId: result.adminId, planName: plan.name, expiresAt: endsAt, email };
}
