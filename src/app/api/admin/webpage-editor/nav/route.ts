import { NextResponse } from "next/server";
import { getNavSettings, saveNavSettings } from "@/lib/webpage-editor-store";
import { requireCrmApi } from "@/lib/crm-access";

export async function GET() {
  const nav = await getNavSettings();
  return NextResponse.json({ nav });
}

export async function POST(req: Request) {
  const auth = await requireCrmApi();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const savedNav = await saveNavSettings(body);
    return NextResponse.json({ ok: true, nav: savedNav });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to save navigation" }, { status: 500 });
  }
}
