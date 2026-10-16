import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { getAudienceFilterOptions } from "@/lib/audiences";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  return NextResponse.json(await getAudienceFilterOptions());
}
