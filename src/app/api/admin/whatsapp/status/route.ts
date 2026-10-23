import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { getCentralStatus } from "@/lib/whatsapp-central";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const status = await getCentralStatus(auth.tenantId);
  return NextResponse.json(status);
}
