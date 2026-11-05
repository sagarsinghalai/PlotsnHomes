import { NextResponse } from "next/server";
import { requireCrmApi } from "@/lib/crm-access";
import { getPendingSummary, getPendingItems } from "@/lib/pending-tasks";

export const dynamic = "force-dynamic";

// Staff-only. ?summary=1 returns just the counts (used by the sidebar badges);
// otherwise returns the counts + the full list of pending items.
export async function GET(req: Request) {
  const auth = await requireCrmApi();
  if (auth.error) return auth.error;
  // Super-admins aggregate across all tenants; others are scoped to their tenant.
  const tenantId = (auth as any).isAdmin ? null : ((auth as any).tenantId ?? null);

  if (new URL(req.url).searchParams.get("summary") === "1") {
    return NextResponse.json({ summary: await getPendingSummary(tenantId) });
  }
  const [summary, items] = await Promise.all([getPendingSummary(tenantId), getPendingItems(tenantId)]);
  return NextResponse.json({ summary, items });
}
