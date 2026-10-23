import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/roles";
import { getPrimaryTenantId } from "@/lib/tenant";

type RowError = { field: string; message: string };

function field(row: Record<string, unknown>, ...names: string[]): string {
  const norm = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const key of Object.keys(row)) {
    const nk = norm(key);
    if (names.some((n) => norm(n) === nk)) {
      const v = row[key];
      return v === null || v === undefined ? "" : String(v).trim();
    }
  }
  return "";
}

const VALID = ["ORGANIZATION", "FRANCHISE", "BRANCH", "DEPARTMENT", "TEAM"];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isSuperAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized Super Admin access required" }, { status: 403 });
  }

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }

  const actionType = String(body?.actionType ?? "");
  const rows: Record<string, unknown>[] = Array.isArray(body?.rows) ? body.rows : [];
  if (!VALID.includes(actionType)) return NextResponse.json({ error: "Invalid entity type." }, { status: 400 });
  if (rows.length === 0) return NextResponse.json({ error: "No rows found in the file." }, { status: 400 });
  if (rows.length > 1000) return NextResponse.json({ error: "Import at most 1000 rows at a time." }, { status: 400 });

  // Parent lookups by name (case-insensitive).
  const [orgs, franchises, branches, departments] = await Promise.all([
    prisma.organization.findMany({ select: { id: true, name: true, code: true } }),
    prisma.franchise.findMany({ select: { id: true, name: true, code: true } }),
    prisma.branch.findMany({ select: { id: true, name: true, code: true } }),
    prisma.department.findMany({ select: { id: true, name: true, code: true } }),
  ]);
  const map = (list: { id: string; name: string; code: string }[]) => {
    const m = new Map<string, string>();
    for (const x of list) { m.set(x.name.trim().toLowerCase(), x.id); if (x.code) m.set(x.code.trim().toLowerCase(), x.id); }
    return m;
  };
  const orgMap = map(orgs), frMap = map(franchises), brMap = map(branches), deptMap = map(departments);

  // Track existing codes to flag duplicates.
  const existingCodes = new Set<string>();
  for (const x of [...orgs, ...franchises, ...branches, ...departments]) if (x.code) existingCodes.add(x.code.trim().toLowerCase());
  const teamsExisting = await prisma.team.findMany({ select: { code: true } });
  for (const t of teamsExisting) if (t.code) existingCodes.add(t.code.trim().toLowerCase());
  const codesInFile = new Set<string>();

  const created: { name: string; code: string }[] = [];
  const skipped: { row: number; name: string; errors: RowError[] }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNo = i + 2;
    const errors: RowError[] = [];
    const name = field(row, "name");
    const code = field(row, "code");
    const status = (field(row, "status") || "ACTIVE").toUpperCase();
    const domain = field(row, "domain");
    const location = field(row, "location");
    const city = field(row, "city");
    const parentName = field(row, "organization", "org", "franchise", "branch", "department", "parent");

    if (!name && !code && !parentName) continue; // blank row

    if (!name || name.length < 2) errors.push({ field: "Name", message: "Name is required (min 2 characters)" });
    if (!code) errors.push({ field: "Code", message: "Code is required" });
    else if (existingCodes.has(code.toLowerCase())) errors.push({ field: "Code", message: "A record with this code already exists" });
    else if (codesInFile.has(code.toLowerCase())) errors.push({ field: "Code", message: "Duplicate code within the file" });

    // Resolve parent per entity type.
    let parentId: string | null = null;
    if (actionType === "FRANCHISE" && parentName) {
      parentId = orgMap.get(parentName.toLowerCase()) ?? null;
      if (!parentId) errors.push({ field: "Organization", message: `No White Label / Organization named "${parentName}" exists` });
    } else if (actionType === "BRANCH" && parentName) {
      parentId = frMap.get(parentName.toLowerCase()) ?? null;
      if (!parentId) errors.push({ field: "Franchise", message: `No Franchise named "${parentName}" exists` });
    } else if (actionType === "DEPARTMENT" && parentName) {
      parentId = brMap.get(parentName.toLowerCase()) ?? null;
      if (!parentId) errors.push({ field: "Branch", message: `No Branch named "${parentName}" exists` });
    } else if (actionType === "TEAM" && parentName) {
      parentId = deptMap.get(parentName.toLowerCase()) ?? null;
      if (!parentId) errors.push({ field: "Department", message: `No Department named "${parentName}" exists` });
    }

    if (errors.length > 0) { skipped.push({ row: rowNo, name, errors }); continue; }

    // Resolve the tenant from the parent chain (falling back to the primary tenant).
    const primaryTenant = await getPrimaryTenantId();
    const parentTenant = async (model: "franchise" | "branch" | "department") =>
      (parentId
        ? (await (prisma as any)[model].findUnique({ where: { id: parentId }, select: { tenantId: true } }))?.tenantId
        : null) || primaryTenant;

    try {
      if (actionType === "ORGANIZATION") {
        await prisma.organization.create({ data: { name, code, domain: domain || null, status } });
      } else if (actionType === "FRANCHISE") {
        await prisma.franchise.create({ data: { tenantId: parentId || primaryTenant, name, code, organizationId: parentId, location: location || null, status } });
      } else if (actionType === "BRANCH") {
        await prisma.branch.create({ data: { tenantId: await parentTenant("franchise"), name, code, franchiseId: parentId, city: city || null, status } });
      } else if (actionType === "DEPARTMENT") {
        await prisma.department.create({ data: { tenantId: await parentTenant("branch"), name, code, branchId: parentId, status } });
      } else if (actionType === "TEAM") {
        await prisma.team.create({ data: { tenantId: await parentTenant("department"), name, code, departmentId: parentId, status } });
      }
      existingCodes.add(code.toLowerCase());
      codesInFile.add(code.toLowerCase());
      created.push({ name, code });
    } catch {
      skipped.push({ row: rowNo, name, errors: [{ field: "—", message: "Database error — could not save this row" }] });
    }
  }

  return NextResponse.json({ ok: true, createdCount: created.length, skippedCount: skipped.length, created, skipped });
}
