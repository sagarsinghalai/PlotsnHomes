import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { getPipelines, savePipeline, deletePipeline, duplicatePipeline, reorderPipelines } from "@/lib/pipeline-store";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  const pipelines = await getPipelines();
  return NextResponse.json({ pipelines });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const saved = await savePipeline(body);
    return NextResponse.json({ ok: true, pipeline: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save pipeline" }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing pipeline ID" }, { status: 400 });

    await deletePipeline(id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete pipeline" }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { action, id, order } = body;

    if (action === "duplicate" && id) {
      const duplicated = await duplicatePipeline(id);
      return NextResponse.json({ ok: true, pipeline: duplicated });
    }

    if (action === "reorder" && Array.isArray(order)) {
      const reordered = await reorderPipelines(order);
      return NextResponse.json({ ok: true, pipelines: reordered });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Action failed" }, { status: 400 });
  }
}
