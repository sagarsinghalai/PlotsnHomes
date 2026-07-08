import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { sendAdminMessage } from "@/lib/messaging";

const schema = z.object({
  channel: z.enum(["whatsapp", "whatsapp_web", "email", "telegram", "sms", "platform"]),
  recipientUserId: z.string(),
  recipientPhone: z.string().optional(),
  body: z.string().min(1),
  subject: z.string().optional(),
  meetingId: z.string().optional(),
});

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const data = schema.parse(await req.json());
    const result = await sendAdminMessage({
      ...data,
      sentById: auth.session!.user.id,
    });
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : "Send failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
