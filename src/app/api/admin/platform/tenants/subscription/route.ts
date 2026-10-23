import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformApi } from "@/lib/platform-access";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { applyTenantGrant } from "@/lib/subscription-grant";

export const dynamic = "force-dynamic";

const schema = z.object({
  orgId: z.string().min(1),
  mode: z.enum(["renew", "grant"]),
  minutes: z.number().int().nonnegative().optional(),
  days: z.number().int().nonnegative().optional(),
  extend: z.boolean().optional(),
});

// Platform-owner only: renew a tenant from its plan, or grant/extend its
// subscription by a manual duration (minutes + days). Reactivates the tenant.
export async function POST(req: Request) {
  const auth = await requirePlatformApi();
  if (auth.error) return auth.error;

  let data: z.infer<typeof schema>;
  try {
    data = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: "orgId and a valid mode are required." }, { status: 400 });
  }

  const org = await prisma.organization.findUnique({ where: { id: data.orgId }, select: { id: true, name: true } });
  if (!org) return NextResponse.json({ ok: false, error: "Tenant not found." }, { status: 404 });

  const minutes = (data.minutes ?? 0) + (data.days ?? 0) * 1440;
  const result =
    data.mode === "renew"
      ? await applyTenantGrant(org.id, { mode: "renew" })
      : await applyTenantGrant(org.id, { mode: "grant", minutes, extend: data.extend });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  await writeAudit({
    actorId: auth.actorId,
    actorEmail: auth.session.user.email ?? null,
    action: data.mode === "renew" ? "TENANT_SUBSCRIPTION_RENEW" : "TENANT_SUBSCRIPTION_GRANT",
    detail: `${org.name} (${org.id}): ${data.mode === "renew" ? "renewed from plan" : `granted ${minutes} min${data.extend ? " (extend)" : ""}`}; ends ${result.endsAt ? result.endsAt.toISOString() : "never"}`,
  });

  return NextResponse.json({ ok: true, status: "ACTIVE", endsAt: result.endsAt ? result.endsAt.toISOString() : null });
}
