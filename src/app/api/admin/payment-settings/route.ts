import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { isSuperAdmin } from "@/lib/roles";
import { hasEncKey } from "@/lib/credentials-crypto";
import { writeAudit } from "@/lib/audit";
import {
  getPaymentConfig,
  getMaskedPaymentConfig,
  savePaymentConfig,
  mergePaymentConfigUpdate,
} from "@/lib/payment-settings";

export const dynamic = "force-dynamic";

/**
 * Per-tenant payment gateway configuration.
 *  - GET  returns the caller's tenant config (secrets masked), plus the platform
 *         (global) config when the caller is the platform owner.
 *  - POST saves the tenant config, or — with scope "platform" and platform-owner
 *         rights — the global subscription gateway. Secrets are preserved when
 *         left blank and encrypted at rest on save.
 */
export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const isOwner = isSuperAdmin(auth.session.user.role);
  const tenant = await getMaskedPaymentConfig(auth.tenantId);
  const platform = isOwner ? await getMaskedPaymentConfig(null) : null;

  return NextResponse.json({
    success: true,
    encReady: hasEncKey(),
    canEditPlatform: isOwner,
    tenantId: auth.tenantId,
    tenant,
    platform,
  });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  if (!hasEncKey()) {
    return NextResponse.json(
      { success: false, error: "Server encryption key (CREDENTIALS_ENC_KEY) is not set — cannot store payment secrets safely." },
      { status: 503 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  const scope = body?.scope === "platform" ? "platform" : "tenant";
  if (scope === "platform" && !isSuperAdmin(auth.session.user.role)) {
    return NextResponse.json({ success: false, error: "Platform owner access required for the platform gateway." }, { status: 403 });
  }

  const targetTenant = scope === "platform" ? null : auth.tenantId;
  const current = await getPaymentConfig(targetTenant);
  const merged = mergePaymentConfigUpdate(current, body?.config ?? {});
  await savePaymentConfig(merged, targetTenant);

  await writeAudit({
    actorId: auth.session.user.id,
    actorEmail: auth.session.user.email ?? null,
    action: "PAYMENT_GATEWAY_CONFIG_UPDATE",
    detail:
      `scope=${scope}` +
      (scope === "tenant" ? ` tenant=${targetTenant ?? "global"}` : "") +
      ` razorpay=${merged.razorpay.enabled ? "on" : "off"} stripe=${merged.stripe.enabled ? "on" : "off"} preferred=${merged.preferred}`,
  });

  return NextResponse.json({ success: true });
}
