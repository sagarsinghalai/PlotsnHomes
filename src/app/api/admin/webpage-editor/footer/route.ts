import { NextResponse } from "next/server";
import { getFooterSettings, saveFooterSettings } from "@/lib/webpage-editor-store";
import { requireCrmApi } from "@/lib/crm-access";

export const dynamic = "force-dynamic";

export async function GET() {
  const footer = await getFooterSettings();
  return NextResponse.json({ footer });
}

export async function POST(req: Request) {
  const auth = await requireCrmApi();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const savedFooter = await saveFooterSettings(body);
    return NextResponse.json({ ok: true, footer: savedFooter });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to save footer settings" }, { status: 500 });
  }
}
