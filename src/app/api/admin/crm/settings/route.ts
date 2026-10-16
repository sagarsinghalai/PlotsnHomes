export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { getCrmSettings, saveCrmSettings } from "@/lib/crm-settings";

const patchSchema = z.object({
  routingMode: z.enum(["property_agent", "round_robin", "manual"]).optional(),
  autoAssign: z.boolean().optional(),
  defaultOwnerId: z.string().optional(),
  leadSources: z.array(z.string()).optional(),
  messageTemplates: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        channel: z.enum(["whatsapp", "email", "sms"]),
        subject: z.string().optional(),
        body: z.string(),
        templateType: z.string().optional(),
        mediaUrl: z.string().optional(),
        buttons: z.array(z.union([
          z.string().transform(s => ({ label: s, url: undefined })),
          z.object({ label: z.string(), url: z.string().optional() })
        ])).optional(),
        listItems: z.array(z.union([
          z.string().transform(s => ({ label: s, url: undefined })),
          z.object({ label: z.string(), url: z.string().optional() })
        ])).optional(),
      })
    )
    .optional(),
});

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  const settings = await getCrmSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const data = patchSchema.parse(await req.json());
    await saveCrmSettings(data);
    const settings = await getCrmSettings();
    return NextResponse.json({ ok: true, settings });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}
