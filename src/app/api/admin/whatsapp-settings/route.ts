import { NextResponse } from "next/server";
import { requirePlatformApi } from "@/lib/platform-access";
import {
  getMaskedWhatsAppConfig,
  mergeWhatsAppUpdate,
  saveWhatsAppConfig,
  type WhatsAppConfig,
} from "@/lib/whatsapp-settings";

export const dynamic = "force-dynamic";

// Platform-owner only: holds the business WhatsApp credentials. GET returns a
// masked view (no secrets); POST preserves existing secrets when a field is
// blank/omitted and encrypts any new ones on save.
export async function GET() {
  const auth = await requirePlatformApi();
  if (auth.error) return auth.error;
  try {
    return NextResponse.json({ success: true, config: await getMaskedWhatsAppConfig(auth.tenantId) });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requirePlatformApi();
  if (auth.error) return auth.error;
  try {
    const body = (await req.json()) as Partial<WhatsAppConfig>;
    const merged = await mergeWhatsAppUpdate(body, auth.tenantId);
    await saveWhatsAppConfig(merged, auth.tenantId);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
