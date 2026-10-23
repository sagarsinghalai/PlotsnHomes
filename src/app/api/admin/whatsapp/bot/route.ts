import { NextResponse } from "next/server";
import { requireCrmApi } from "@/lib/crm-access";
import { getBotConfig, saveBotConfig, DEFAULT_BOT_CONFIG, type WhatsAppBotConfig } from "@/lib/whatsapp-bot";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireCrmApi();
  if (auth.error) return auth.error;
  try {
    return NextResponse.json({ success: true, config: await getBotConfig(auth.tenantId) });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireCrmApi();
  if (auth.error) return auth.error;
  try {
    const body = (await req.json()) as Partial<WhatsAppBotConfig>;
    // Normalise against defaults so a partial payload can't corrupt the shape.
    const cfg: WhatsAppBotConfig = {
      enabled: !!body.enabled,
      welcomeMessage: (body.welcomeMessage ?? DEFAULT_BOT_CONFIG.welcomeMessage).toString(),
      fallbackMessage: (body.fallbackMessage ?? DEFAULT_BOT_CONFIG.fallbackMessage).toString(),
      handoffMessage: (body.handoffMessage ?? DEFAULT_BOT_CONFIG.handoffMessage).toString(),
      handoffKeywords: Array.isArray(body.handoffKeywords) ? body.handoffKeywords.map(String).map((s) => s.trim()).filter(Boolean) : DEFAULT_BOT_CONFIG.handoffKeywords,
      rules: Array.isArray(body.rules)
        ? body.rules
            .map((r, i) => ({
              id: (r?.id || `rule-${i}`).toString(),
              keywords: Array.isArray(r?.keywords) ? r.keywords.map(String).map((s) => s.trim()).filter(Boolean) : [],
              reply: (r?.reply || "").toString(),
            }))
            .filter((r) => r.keywords.length && r.reply.trim())
        : [],
    };
    await saveBotConfig(cfg, auth.tenantId);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
