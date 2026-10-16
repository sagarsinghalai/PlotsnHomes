import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import {
  audienceFiltersSchema,
  deleteAudience,
  getSavedAudiences,
  saveAudience,
} from "@/lib/audiences";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  return NextResponse.json({ audiences: await getSavedAudiences() });
}

const saveSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required."),
  filters: audienceFiltersSchema,
});

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid audience." },
      { status: 400 },
    );
  }

  const saved = await saveAudience(parsed.data);
  return NextResponse.json({ ok: true, audience: saved });
}

export async function DELETE(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  await deleteAudience(id);
  return NextResponse.json({ ok: true });
}
