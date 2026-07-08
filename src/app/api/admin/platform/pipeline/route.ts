import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { getPipelineConfig, savePipelineConfig } from "@/lib/pipeline-settings";

export async function PATCH(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  await savePipelineConfig(await req.json());
  return NextResponse.json({ ok: true, config: await getPipelineConfig() });
}
