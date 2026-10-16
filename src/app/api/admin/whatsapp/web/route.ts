import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { setCentralMethod } from "@/lib/whatsapp-central";
import {
  getWhatsAppWebStatus,
  startWhatsAppWeb,
  stopWhatsAppWeb,
} from "@/lib/whatsapp-web-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  action: z.enum(["connect", "disconnect"]),
});

/** Drive the WhatsApp Web linked-device session. */
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
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid action." },
      { status: 400 },
    );
  }

  try {
    if (parsed.data.action === "connect") {
      const status = await startWhatsAppWeb();
      await setCentralMethod("web");
      return NextResponse.json({ ok: true, status });
    }
    const status = await stopWhatsAppWeb();
    return NextResponse.json({ ok: true, status });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "WhatsApp Web action failed." },
      { status: 500 },
    );
  }
}

/** Poll for the live session status (QR code, ready state, linked number). */
export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  return NextResponse.json(getWhatsAppWebStatus());
}
