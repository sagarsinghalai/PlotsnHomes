import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { checkCredentialsReadiness } from "@/lib/readiness";

export const dynamic = "force-dynamic";

// Admin-gated deployment readiness probe for credential encryption.
// Returns only booleans, counts and generic messages — never the key or any
// stored credential. Use after deploy to confirm integrations are configured.
export async function GET() {
  try {
    const auth = await requireAdminApi();
    if (auth.error) return auth.error;
    const readiness = await checkCredentialsReadiness({ includeStoredSecrets: true });
    return NextResponse.json(
      { success: true, readiness },
      { status: readiness.ok ? 200 : 503 },
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "readiness check failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
