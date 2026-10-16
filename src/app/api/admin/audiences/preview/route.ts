import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { audienceFiltersSchema, resolveAudienceFilters } from "@/lib/audiences";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Resolve a filter set and return the count + a small name sample. */
export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = audienceFiltersSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid filters." },
      { status: 400 },
    );
  }

  const recipients = await resolveAudienceFilters(parsed.data);
  return NextResponse.json({
    count: recipients.length,
    sample: recipients.slice(0, 8).map((r) => ({ name: r.name, phone: r.phone })),
  });
}
