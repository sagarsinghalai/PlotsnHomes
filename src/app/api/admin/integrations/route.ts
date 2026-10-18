import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import {
  getMessagingIntegrations,
  saveMessagingIntegrations,
} from "@/lib/messaging-settings";

const schema = z.object({
  whatsappMode: z.enum(["api", "web"]).optional(),
  whatsappApiToken: z.string().optional(),
  whatsappPhoneNumberId: z.string().optional(),
  whatsappFromNumber: z.string().optional(),
  whatsappWebNumber: z.string().optional(),
  telegramBotToken: z.string().optional(),
  twilioAccountSid: z.string().optional(),
  twilioAuthToken: z.string().optional(),
  twilioFromPhone: z.string().optional(),
  calendlyUrl: z.string().optional(),
  customMeetingUrl: z.string().optional(),
  notificationEmail: z.string().optional(),
  gmailSmtpHost: z.string().optional(),
  gmailSmtpPort: z.string().optional(),
  gmailSmtpUser: z.string().optional(),
  gmailSmtpPass: z.string().optional(),
  gmailSmtpFrom: z.string().optional(),
  companyName: z.string().optional(),
});

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const config = await getMessagingIntegrations();
  return NextResponse.json({
    ...config,
    gmailSmtpPass: config.gmailSmtpPass ? "••••••••" : "",
    whatsappApiToken: config.whatsappApiToken ? "••••••••" : "",
    twilioAuthToken: config.twilioAuthToken ? "••••••••" : "",
    telegramBotToken: config.telegramBotToken ? "••••••••" : "",
  });
}

export async function PATCH(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const data = schema.parse(body);
    const current = await getMessagingIntegrations();

    await saveMessagingIntegrations({
      ...data,
      whatsappApiToken:
        data.whatsappApiToken && data.whatsappApiToken !== "••••••••"
          ? data.whatsappApiToken
          : current.whatsappApiToken,
      twilioAuthToken:
        data.twilioAuthToken && data.twilioAuthToken !== "••••••••"
          ? data.twilioAuthToken
          : current.twilioAuthToken,
      telegramBotToken:
        data.telegramBotToken && data.telegramBotToken !== "••••••••"
          ? data.telegramBotToken
          : current.telegramBotToken,
      gmailSmtpPass:
        data.gmailSmtpPass && data.gmailSmtpPass !== "••••••••"
          ? data.gmailSmtpPass
          : current.gmailSmtpPass,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}
