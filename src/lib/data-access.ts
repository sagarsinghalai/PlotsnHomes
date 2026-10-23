import { NextResponse } from "next/server";

/**
 * Phase B tenant-scoping helpers. The rule: every query against a tenant-owned
 * model must be filtered by the caller's tenantId, taken from the session —
 * never from client input. These helpers fail CLOSED: no tenant → no access.
 */

/** 403 response for a request with no tenant context. */
export function noTenantResponse() {
  return NextResponse.json({ error: "No tenant context for this account." }, { status: 403 });
}

/**
 * A `where` fragment that scopes a query to one tenant. When tenantId is missing
 * it returns an impossible match so a forgotten guard still leaks nothing.
 */
export function tenantScope(tenantId: string | null | undefined): { tenantId: string } {
  return { tenantId: tenantId || "__no_tenant__" };
}
