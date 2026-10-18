import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import {
  getEmailSendersState,
  saveEmailSendersState,
  type EmailSender,
} from "@/lib/email-senders";

const senderSchema = z.object({
  id: z.string().optional(),
  label: z.string().trim().min(1).max(100),
  fromName: z.string().trim().max(100).optional().default(""),
  fromEmail: z.string().trim().email().max(200),
  apiKey: z.string().trim().max(200).optional().default(""),
});

const saveSchema = z.object({
  senders: z.array(senderSchema),
  activeId: z.string().optional().default(""),
});

function genId(): string {
  return `snd-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// Mask stored API keys so they are never sent back to the browser.
function mask(senders: EmailSender[]) {
  return senders.map((s) => ({
    id: s.id,
    label: s.label,
    fromName: s.fromName,
    fromEmail: s.fromEmail,
    apiKey: "",
    hasApiKey: Boolean(s.apiKey),
  }));
}

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  const state = await getEmailSendersState();
  return NextResponse.json({ senders: mask(state.senders), activeId: state.activeId });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const data = saveSchema.parse(await req.json());
    const existing = await getEmailSendersState();
    const prevById = new Map(existing.senders.map((s) => [s.id, s]));

    const senders: EmailSender[] = data.senders.map((s) => {
      const id = s.id && prevById.has(s.id) ? s.id : (s.id || genId());
      // Keep the previously stored key when the field is left blank.
      const apiKey = s.apiKey ? s.apiKey : (s.id ? prevById.get(s.id)?.apiKey ?? "" : "");
      return { id, label: s.label, fromName: s.fromName || "", fromEmail: s.fromEmail, apiKey };
    });

    const ids = new Set(senders.map((s) => s.id));
    const activeId = ids.has(data.activeId) ? data.activeId : (senders[0]?.id ?? "");

    await saveEmailSendersState({ senders, activeId });
    return NextResponse.json({ ok: true, senders: mask(senders), activeId });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "Could not save email accounts" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const state = await getEmailSendersState();
  const senders = state.senders.filter((s) => s.id !== id);
  const activeId = state.activeId === id ? (senders[0]?.id ?? "") : state.activeId;
  await saveEmailSendersState({ senders, activeId });
  return NextResponse.json({ ok: true, senders: mask(senders), activeId });
}
