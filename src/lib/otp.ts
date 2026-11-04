import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import {
  getMessagingIntegrations,
  normalizePhone,
} from "@/lib/messaging-settings";
import { sendWhatsAppApi, sendSms } from "@/lib/messaging";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

export type OtpDeliver = "email" | "phone";

/** 6-digit numeric code, zero-padded. */
function generateCode(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

/** Only expose the raw code to the client outside production (so OTP login is
 * testable without a live SMS/WhatsApp/email provider — mirrors forgot-password's
 * devResetUrl). NEVER returned in production. */
function devEcho(code: string): string | undefined {
  return process.env.NODE_ENV !== "production" ? code : undefined;
}

/**
 * Resolve a user from a login identifier that may be an email or a phone number.
 * Phone matching uses the last 10 digits to tolerate country-code/format drift.
 */
export async function resolveUserByIdentifier(identifier: string) {
  const id = identifier.trim();
  if (!id) return null;

  if (id.includes("@")) {
    return prisma.user.findUnique({
      where: { email: id.toLowerCase() },
      select: { id: true, email: true, name: true, phone: true, active: true, role: true, tenantId: true },
    });
  }

  const digits = id.replace(/\D/g, "");
  if (digits.length < 8) return null;
  const last10 = digits.slice(-10);
  return prisma.user.findFirst({
    where: { phone: { contains: last10 } },
    select: { id: true, email: true, name: true, phone: true, active: true, role: true, tenantId: true },
  });
}

/**
 * Create a login OTP for a user and deliver it over the chosen channel.
 * The code is keyed to the user's canonical email so verification works no matter
 * whether the user originally typed their email or phone to request it.
 */
export async function createLoginOtp(params: {
  user: { email: string; name: string; phone: string | null };
  deliver: OtpDeliver;
}): Promise<{ ok: boolean; channel: string; devCode?: string; error?: string }> {
  const { user, deliver } = params;
  const identifier = user.email.toLowerCase();
  const code = generateCode();

  // Invalidate any outstanding codes for this identifier, then issue a fresh one.
  await prisma.otpCode.deleteMany({ where: { identifier, purpose: "login", usedAt: null } });

  let channel: "email" | "whatsapp" | "sms" = "email";
  let sendError: string | undefined;

  if (deliver === "email") {
    channel = "email";
    try {
      await sendEmail({
        to: user.email,
        subject: "Your PlotsnHomes login code",
        html: otpEmailHtml(user.name, code),
      });
    } catch (e) {
      sendError = (e as Error)?.message;
      console.warn("[otp] email send failed:", sendError);
    }
  } else {
    // Phone: prefer WhatsApp Cloud API, fall back to Twilio SMS.
    if (!user.phone) {
      return { ok: false, channel: "sms", error: "No phone number on file for this account." };
    }
    const config = await getMessagingIntegrations();
    const body = `${code} is your PlotsnHomes login code. It expires in 10 minutes. Do not share it with anyone.`;
    const canWhatsApp = config.whatsappMode === "api" && !!config.whatsappApiToken && !!config.whatsappPhoneNumberId;
    const canSms = !!config.twilioAccountSid && !!config.twilioAuthToken && !!config.twilioFromPhone;
    try {
      if (canWhatsApp) {
        channel = "whatsapp";
        await sendWhatsAppApi(normalizePhone(user.phone), body, config);
      } else if (canSms) {
        channel = "sms";
        await sendSms(user.phone, body, config);
      } else {
        // No provider configured — rely on the dev echo below.
        channel = "sms";
        sendError = "No WhatsApp/SMS provider configured";
        console.warn("[otp] no phone provider configured; using dev echo");
      }
    } catch (e) {
      sendError = (e as Error)?.message;
      console.warn("[otp] phone send failed:", sendError);
    }
  }

  await prisma.otpCode.create({
    data: {
      identifier,
      channel,
      codeHash: hashCode(code),
      purpose: "login",
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  return { ok: true, channel, devCode: devEcho(code) };
}

/** Verify a login OTP keyed to the user's canonical email. Single-use, expiring,
 * attempt-limited. */
export async function verifyLoginOtp(params: {
  email: string;
  code: string;
}): Promise<{ ok: boolean; error?: string }> {
  const identifier = params.email.trim().toLowerCase();
  const code = String(params.code || "").trim();
  if (!identifier || !/^\d{4,8}$/.test(code)) {
    return { ok: false, error: "Enter the code sent to you." };
  }

  const record = await prisma.otpCode.findFirst({
    where: { identifier, purpose: "login", usedAt: null },
    orderBy: { createdAt: "desc" },
  });

  const invalid = { ok: false, error: "Invalid or expired code. Please request a new one." };
  if (!record) return invalid;
  if (record.expiresAt < new Date()) return invalid;
  if (record.attempts >= MAX_ATTEMPTS) {
    await prisma.otpCode.update({ where: { id: record.id }, data: { usedAt: new Date() } });
    return { ok: false, error: "Too many attempts. Please request a new code." };
  }

  const matches = crypto.timingSafeEqual(
    Buffer.from(record.codeHash, "hex"),
    Buffer.from(hashCode(code), "hex")
  );

  if (!matches) {
    await prisma.otpCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    return invalid;
  }

  await prisma.otpCode.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  // Clean up any other outstanding codes for this identifier.
  await prisma.otpCode.deleteMany({ where: { identifier, purpose: "login", usedAt: null } });
  return { ok: true };
}

function otpEmailHtml(name: string, code: string): string {
  return `
  <div style="font-family:system-ui,Arial,sans-serif;max-width:480px;margin:0 auto">
    <h2 style="color:#0f172a">Your login code</h2>
    <p>Hi ${name || "there"},</p>
    <p>Use the code below to sign in to PlotsnHomes. It expires in 10 minutes and can be used once.</p>
    <p style="margin:24px 0;font-size:32px;font-weight:800;letter-spacing:8px;color:#0f172a">${code}</p>
    <p style="color:#64748b;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
  </div>`;
}
