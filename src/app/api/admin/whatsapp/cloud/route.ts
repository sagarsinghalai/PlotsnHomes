import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { getMessagingIntegrations } from "@/lib/messaging-settings";
import { connectWhatsAppCloud, getWhatsAppCloudInfo } from "@/lib/whatsapp-central";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  token: z.string().min(1, "Access token is required.").optional(),
  phoneNumberId: z.string().min(1, "Phone number ID is required.").optional(),
});

/** Connect + verify the WhatsApp Cloud API central number. */
export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  // Fall back to already-saved credentials when a field is left blank (e.g. the
  // token was masked in the UI and the admin only edited the phone number ID).
  const current = await getMessagingIntegrations();
  const token = parsed.data.token?.trim() || current.whatsappApiToken;
  const phoneNumberId = parsed.data.phoneNumberId?.trim() || current.whatsappPhoneNumberId;

  if (!token || !phoneNumberId) {
    return NextResponse.json(
      { ok: false, error: "Both an access token and a phone number ID are required." },
      { status: 400 },
    );
  }

  try {
    const info = await connectWhatsAppCloud(token, phoneNumberId);
    return NextResponse.json({ ok: true, info });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Verification failed." },
      { status: 400 },
    );
  }
}

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const info = await getWhatsAppCloudInfo();
  return NextResponse.json(info);
}
