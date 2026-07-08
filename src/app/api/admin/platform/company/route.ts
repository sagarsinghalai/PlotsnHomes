import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { getCompanySettings, saveCompanySettings } from "@/lib/company-settings";

export async function PATCH(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  await saveCompanySettings(await req.json());
  return NextResponse.json({ ok: true, settings: await getCompanySettings() });
}
