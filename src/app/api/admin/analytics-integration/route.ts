import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { SITE_SETTING_KEYS, getSiteSetting, saveSiteSetting, type AnalyticsIntegration } from "@/lib/site-settings";

export async function GET() {
  try {
    const auth = await requireAdminApi();
    if (auth.error) return auth.error;
    const v = await getSiteSetting<AnalyticsIntegration>(SITE_SETTING_KEYS.ANALYTICS_INTEGRATION);
    // Do not leak the raw key; report whether it is configured.
    return NextResponse.json({
      success: true,
      integration: {
        gaEnabled: !!v?.gaEnabled,
        hasServiceAccount: !!v?.gaServiceAccountJson,
        defaultGtmId: v?.defaultGtmId || "",
        defaultMetaPixelId: v?.defaultMetaPixelId || "",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdminApi();
    if (auth.error) return auth.error;
    const body = await req.json();
    const current = await getSiteSetting<AnalyticsIntegration>(SITE_SETTING_KEYS.ANALYTICS_INTEGRATION);
    const next: AnalyticsIntegration = {
      gaEnabled: body.gaEnabled ?? current?.gaEnabled ?? false,
      // Keep the existing key if the client sent a blank (unchanged) value.
      gaServiceAccountJson: typeof body.gaServiceAccountJson === "string" && body.gaServiceAccountJson.trim()
        ? body.gaServiceAccountJson.trim()
        : (body.clearServiceAccount ? "" : current?.gaServiceAccountJson || ""),
      defaultGtmId: body.defaultGtmId ?? current?.defaultGtmId ?? "",
      defaultMetaPixelId: body.defaultMetaPixelId ?? current?.defaultMetaPixelId ?? "",
    };
    if (next.gaServiceAccountJson) {
      try { JSON.parse(next.gaServiceAccountJson); } catch { return NextResponse.json({ success: false, error: "Service-account key must be valid JSON." }, { status: 400 }); }
    }
    await saveSiteSetting(SITE_SETTING_KEYS.ANALYTICS_INTEGRATION, next);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
