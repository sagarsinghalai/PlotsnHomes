import { NextResponse } from "next/server";
import { getCrmSettings, saveCrmSettings } from "@/lib/crm-settings";
import { MessageTemplate } from "@/lib/crm-template-utils";
import { requireCrmApi } from "@/lib/crm-access";

export async function GET() {
  const auth = await requireCrmApi();
  if (auth.error) return auth.error;
  try {
    const crmSettings = await getCrmSettings(auth.tenantId);
    return NextResponse.json({
      templates: crmSettings.messageTemplates,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireCrmApi();
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const crmSettings = await getCrmSettings(auth.tenantId);
    let currentTemplates = crmSettings.messageTemplates || [];

    if (body.template) {
      const newOrEdit: MessageTemplate = body.template;
      const idx = currentTemplates.findIndex((t) => t.id === newOrEdit.id);
      if (idx >= 0) {
        currentTemplates[idx] = newOrEdit;
      } else {
        currentTemplates.unshift(newOrEdit);
      }
      await saveCrmSettings({ messageTemplates: currentTemplates }, auth.tenantId);
    } else if (Array.isArray(body.templates)) {
      await saveCrmSettings({ messageTemplates: body.templates }, auth.tenantId);
    }

    return NextResponse.json({ success: true, templates: currentTemplates });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save template" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireCrmApi();
  if (auth.error) return auth.error;
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const crmSettings = await getCrmSettings(auth.tenantId);
    const filtered = (crmSettings.messageTemplates || []).filter((t) => t.id !== id);
    await saveCrmSettings({ messageTemplates: filtered }, auth.tenantId);

    return NextResponse.json({ success: true, templates: filtered });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}
