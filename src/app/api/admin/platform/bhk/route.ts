import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { getBhkConfigurations, saveBhkConfigurations } from "@/lib/system-settings";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  
  const configs = await getBhkConfigurations();
  return NextResponse.json({ configs });
}

export async function PATCH(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const { configs } = await req.json();
    if (!Array.isArray(configs)) {
      return NextResponse.json({ error: "Invalid payload, configs must be an array" }, { status: 400 });
    }
    
    const cleanConfigs = configs.map(c => String(c).trim()).filter(Boolean);
    await saveBhkConfigurations(cleanConfigs);
    
    return NextResponse.json({ ok: true, configs: cleanConfigs });
  } catch (e) {
    console.error("Failed to update BHK configurations", e);
    return NextResponse.json({ error: "Failed to update BHK configurations" }, { status: 500 });
  }
}
