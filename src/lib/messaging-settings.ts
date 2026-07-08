import { normalizePhoneE164 } from "@/lib/phone-utils";
import { getSetting, setSetting } from "@/lib/system-settings";

export const INTEGRATION_KEYS = {
  WHATSAPP_MODE: "whatsapp_mode",
  WHATSAPP_API_TOKEN: "whatsapp_api_token",
  WHATSAPP_PHONE_NUMBER_ID: "whatsapp_phone_number_id",
  WHATSAPP_FROM_NUMBER: "whatsapp_from_number",
  WHATSAPP_WEB_NUMBER: "whatsapp_web_number",
  TELEGRAM_BOT_TOKEN: "telegram_bot_token",
  TWILIO_ACCOUNT_SID: "twilio_account_sid",
  TWILIO_AUTH_TOKEN: "twilio_auth_token",
  TWILIO_FROM_PHONE: "twilio_from_phone",
  CALENDLY_URL: "calendly_url",
  CUSTOM_MEETING_URL: "custom_meeting_url",
  NOTIFICATION_EMAIL: "notification_email",
  GMAIL_SMTP_HOST: "gmail_smtp_host",
  GMAIL_SMTP_USER: "gmail_smtp_user",
  GMAIL_SMTP_PASS: "gmail_smtp_pass",
  GMAIL_SMTP_FROM: "gmail_smtp_from",
  COMPANY_NAME: "company_name",
} as const;

export type MessagingIntegrations = {
  whatsappMode: "api" | "web";
  whatsappApiToken: string;
  whatsappPhoneNumberId: string;
  whatsappFromNumber: string;
  whatsappWebNumber: string;
  telegramBotToken: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioFromPhone: string;
  calendlyUrl: string;
  customMeetingUrl: string;
  notificationEmail: string;
  gmailSmtpHost: string;
  gmailSmtpUser: string;
  gmailSmtpPass: string;
  gmailSmtpFrom: string;
  companyName: string;
};

export async function getMessagingIntegrations(): Promise<MessagingIntegrations> {
  const keys = Object.values(INTEGRATION_KEYS);
  const values = await Promise.all(keys.map((k) => getSetting(k)));
  const map = Object.fromEntries(keys.map((k, i) => [k, values[i] ?? ""]));

  return {
    whatsappMode: (map[INTEGRATION_KEYS.WHATSAPP_MODE] || "web") as "api" | "web",
    whatsappApiToken: map[INTEGRATION_KEYS.WHATSAPP_API_TOKEN] ?? "",
    whatsappPhoneNumberId: map[INTEGRATION_KEYS.WHATSAPP_PHONE_NUMBER_ID] ?? "",
    whatsappFromNumber: map[INTEGRATION_KEYS.WHATSAPP_FROM_NUMBER] ?? "",
    whatsappWebNumber: map[INTEGRATION_KEYS.WHATSAPP_WEB_NUMBER] ?? "",
    telegramBotToken: map[INTEGRATION_KEYS.TELEGRAM_BOT_TOKEN] ?? "",
    twilioAccountSid: map[INTEGRATION_KEYS.TWILIO_ACCOUNT_SID] ?? "",
    twilioAuthToken: map[INTEGRATION_KEYS.TWILIO_AUTH_TOKEN] ?? "",
    twilioFromPhone: map[INTEGRATION_KEYS.TWILIO_FROM_PHONE] ?? "",
    calendlyUrl: map[INTEGRATION_KEYS.CALENDLY_URL] || "https://cal.com/plotsnhomes/consultation",
    customMeetingUrl: map[INTEGRATION_KEYS.CUSTOM_MEETING_URL] ?? "",
    notificationEmail: map[INTEGRATION_KEYS.NOTIFICATION_EMAIL] ?? "",
    gmailSmtpHost: map[INTEGRATION_KEYS.GMAIL_SMTP_HOST] ?? "smtp.gmail.com",
    gmailSmtpUser: map[INTEGRATION_KEYS.GMAIL_SMTP_USER] ?? "",
    gmailSmtpPass: map[INTEGRATION_KEYS.GMAIL_SMTP_PASS] ?? "",
    gmailSmtpFrom: map[INTEGRATION_KEYS.GMAIL_SMTP_FROM] ?? "",
    companyName: map[INTEGRATION_KEYS.COMPANY_NAME] ?? "PlotsnHomes",
  };
}

export async function saveMessagingIntegrations(data: Partial<MessagingIntegrations>) {
  const entries: [string, string][] = [];
  if (data.whatsappMode !== undefined)
    entries.push([INTEGRATION_KEYS.WHATSAPP_MODE, data.whatsappMode]);
  if (data.whatsappApiToken !== undefined)
    entries.push([INTEGRATION_KEYS.WHATSAPP_API_TOKEN, data.whatsappApiToken]);
  if (data.whatsappPhoneNumberId !== undefined)
    entries.push([INTEGRATION_KEYS.WHATSAPP_PHONE_NUMBER_ID, data.whatsappPhoneNumberId]);
  if (data.whatsappFromNumber !== undefined)
    entries.push([INTEGRATION_KEYS.WHATSAPP_FROM_NUMBER, data.whatsappFromNumber]);
  if (data.whatsappWebNumber !== undefined)
    entries.push([INTEGRATION_KEYS.WHATSAPP_WEB_NUMBER, data.whatsappWebNumber]);
  if (data.telegramBotToken !== undefined)
    entries.push([INTEGRATION_KEYS.TELEGRAM_BOT_TOKEN, data.telegramBotToken]);
  if (data.twilioAccountSid !== undefined)
    entries.push([INTEGRATION_KEYS.TWILIO_ACCOUNT_SID, data.twilioAccountSid]);
  if (data.twilioAuthToken !== undefined)
    entries.push([INTEGRATION_KEYS.TWILIO_AUTH_TOKEN, data.twilioAuthToken]);
  if (data.twilioFromPhone !== undefined)
    entries.push([INTEGRATION_KEYS.TWILIO_FROM_PHONE, data.twilioFromPhone]);
  if (data.calendlyUrl !== undefined)
    entries.push([INTEGRATION_KEYS.CALENDLY_URL, data.calendlyUrl]);
  if (data.customMeetingUrl !== undefined)
    entries.push([INTEGRATION_KEYS.CUSTOM_MEETING_URL, data.customMeetingUrl]);
  if (data.notificationEmail !== undefined)
    entries.push([INTEGRATION_KEYS.NOTIFICATION_EMAIL, data.notificationEmail]);
  if (data.gmailSmtpHost !== undefined)
    entries.push([INTEGRATION_KEYS.GMAIL_SMTP_HOST, data.gmailSmtpHost]);
  if (data.gmailSmtpUser !== undefined)
    entries.push([INTEGRATION_KEYS.GMAIL_SMTP_USER, data.gmailSmtpUser]);
  if (data.gmailSmtpPass !== undefined)
    entries.push([INTEGRATION_KEYS.GMAIL_SMTP_PASS, data.gmailSmtpPass]);
  if (data.gmailSmtpFrom !== undefined)
    entries.push([INTEGRATION_KEYS.GMAIL_SMTP_FROM, data.gmailSmtpFrom]);
  if (data.companyName !== undefined)
    entries.push([INTEGRATION_KEYS.COMPANY_NAME, data.companyName]);

  await Promise.all(entries.map(([k, v]) => setSetting(k, v)));
}

export function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) {
    return `+${trimmed.replace(/\D/g, "")}`;
  }
  return normalizePhoneE164(trimmed);
}

export function whatsAppWebUrl(toPhone: string, message: string): string {
  const digits = normalizePhone(toPhone).replace(/^\+/, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
