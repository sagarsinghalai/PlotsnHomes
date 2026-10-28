import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { generateNextUserId } from "@/lib/user-id";
import { validateUserDobAge, parseDobDate } from "@/lib/user-validation";
import { assignableRoles } from "@/lib/roles";

// Accepts many human-friendly spellings for each role/account type.
const ROLE_MAP: Record<string, Role> = {
  "super admin": Role.SUPERADMIN, superadmin: Role.SUPERADMIN,
  "platform admin": Role.PLATFORM_ADMIN, platform_admin: Role.PLATFORM_ADMIN,
  "white label admin": Role.WHITE_LABEL_ADMIN, "white label": Role.WHITE_LABEL_ADMIN,
  whitelabel: Role.WHITE_LABEL_ADMIN, white_label_admin: Role.WHITE_LABEL_ADMIN,
  "franchise admin": Role.FRANCHISE_ADMIN, franchise: Role.FRANCHISE_ADMIN,
  franchisee: Role.FRANCHISE_ADMIN, franchise_admin: Role.FRANCHISE_ADMIN,
  "branch manager": Role.BRANCH_MANAGER, branch: Role.BRANCH_MANAGER, branch_manager: Role.BRANCH_MANAGER,
  "department head": Role.DEPARTMENT_HEAD, department: Role.DEPARTMENT_HEAD, department_head: Role.DEPARTMENT_HEAD,
  "team leader": Role.TEAM_LEADER, team: Role.TEAM_LEADER, team_leader: Role.TEAM_LEADER,
  executive: Role.EXECUTIVE,
  employee: Role.EMPLOYEE, staff: Role.EMPLOYEE,
  agent: Role.AGENT,
  seller: Role.SELLER,
  buyer: Role.BUYER, customer: Role.BUYER,
  demo: Role.DEMO, "demo user": Role.DEMO,
};

function parseRoleKey(raw: string): Role | undefined {
  return ROLE_MAP[raw.trim().toLowerCase()];
}

function genPassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$%";
  const b = randomBytes(12);
  let out = "";
  for (let i = 0; i < 12; i++) out += chars[b[i] % chars.length];
  return out;
}

// Pull a field from a row regardless of header casing / spacing / punctuation.
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

type RowError = { field: string; message: string };

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const rows: Record<string, unknown>[] = Array.isArray(body?.users) ? body.users : [];
  const defaultRole = parseRoleKey(String(body?.defaultRole ?? "")) ?? Role.BUYER;
  if (rows.length === 0) {
    return NextResponse.json({ error: "No rows found in the file." }, { status: 400 });
  }
  if (rows.length > 1000) {
    return NextResponse.json({ error: "Too many rows — import at most 1000 users at a time." }, { status: 400 });
  }

  // Roles this importer is allowed to create (strictly below their own rank).
  const allowedRoles = assignableRoles(auth.session?.user?.role);
  const created: { name: string; email: string; userId: string; tempPassword: string | null }[] = [];
  const skipped: { row: number; name: string; email: string; errors: RowError[] }[] = [];

  // Pre-load lookups for hierarchy associations (match by name) and manager (by email).
  const [existingUsers, orgs, franchises, branches, departments, teams] = await Promise.all([
    prisma.user.findMany({ select: { id: true, email: true } }),
    prisma.organization.findMany({ select: { id: true, name: true } }),
    prisma.franchise.findMany({ select: { id: true, name: true } }),
    prisma.branch.findMany({ select: { id: true, name: true } }),
    prisma.department.findMany({ select: { id: true, name: true } }),
    prisma.team.findMany({ select: { id: true, name: true } }),
  ]);
  const seen = new Set(existingUsers.map((u) => u.email.toLowerCase()));
  const emailsInFile = new Set<string>();
  const userByEmail = new Map(existingUsers.map((u) => [u.email.toLowerCase(), u.id]));
  const byName = (list: { id: string; name: string }[]) =>
    new Map(list.map((x) => [x.name.trim().toLowerCase(), x.id]));
  const orgMap = byName(orgs), frMap = byName(franchises), brMap = byName(branches),
    deptMap = byName(departments), teamMap = byName(teams);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNo = i + 2; // +2 for the header row + 1-based indexing
    const errors: RowError[] = [];

    const name = field(row, "name", "fullname", "full name", "user name", "username");
    const email = field(row, "email", "email address", "e-mail").toLowerCase();
    const phoneRaw = field(row, "phone", "mobile", "phone number", "contact");
    const phone = phoneRaw.replace(/\D/g, "");
    // Accept the country code with or without a leading "+". We take whatever
    // digits were entered and auto-prefix a "+" (e.g. "91" -> "+91", "+1" -> "+1").
    const ccDigits = field(row, "country code", "countrycode", "dial code", "code").replace(/\D/g, "");
    const countryCode = ccDigits ? "+" + ccDigits : "";
    const roleRaw = field(row, "role", "account type", "type");
    const providedPw = field(row, "password", "temp password");
    const pan = field(row, "pan", "pan card").toUpperCase();
    const aadhar = field(row, "aadhar", "aadhaar").replace(/[\s-]/g, "");
    const dobRaw = field(row, "dob", "date of birth", "dobyyyymmdd");
    const address = field(row, "address", "street address");
    const city = field(row, "city");
    const state = field(row, "state", "state region");
    const zip = field(row, "zip", "pin", "pincode", "zip postal code", "postal code");
    const country = field(row, "country");
    const commissionRaw = field(row, "commission rate", "commission", "commission rate percent");
    const managerEmail = field(row, "manager email", "manager").toLowerCase();
    const orgName = field(row, "organization", "org");
    const frName = field(row, "franchise");
    const brName = field(row, "branch");
    const deptName = field(row, "department");
    const teamName = field(row, "team");

    // A fully blank row — ignore silently.
    const anyValue = [name, email, phone, pan, aadhar, dobRaw, address, city, state, roleRaw].some((v) => v);
    if (!anyValue) continue;

    // ── Name ──
    if (!name) errors.push({ field: "Name", message: "Name is required" });
    else if (name.length < 2) errors.push({ field: "Name", message: "Name must be at least 2 characters" });
    else if (!/^[a-zA-Z\s.'-]+$/.test(name)) errors.push({ field: "Name", message: "Name can only contain letters, spaces, . ' and -" });

    // ── Email ──
    if (!email) errors.push({ field: "Email", message: "Email is required" });
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.push({ field: "Email", message: "Email format is invalid (e.g. name@domain.com)" });
    else if (seen.has(email)) errors.push({ field: "Email", message: "A user with this email already exists" });
    else if (emailsInFile.has(email)) errors.push({ field: "Email", message: "Duplicate email within the file" });

    // ── Phone (exactly 10 digits, country code stored separately) ──
    if (phone && phone.length !== 10) {
      errors.push({ field: "Phone", message: "Phone must be exactly 10 digits (no country code — put that in the Country Code column)" });
    }
    // Country code accepts any value (with or without +); only flag it when the
    // digits clearly aren't a dial code (too long).
    if (ccDigits && ccDigits.length > 4) {
      errors.push({ field: "Country Code", message: "Country code looks too long — enter just the dial code digits (e.g. 91, 1, 44)" });
    }

    // ── PAN ──
    if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
      errors.push({ field: "PAN", message: "PAN must be 5 letters, 4 digits, then 1 letter (e.g. ABCDE1234F)" });
    }

    // ── Aadhaar ──
    if (aadhar && !/^[2-9][0-9]{11}$/.test(aadhar)) {
      errors.push({ field: "Aadhaar", message: "Aadhaar must be 12 digits and cannot start with 0 or 1" });
    }

    // ── DOB (valid + 18+) ──
    let dob: Date | null = null;
    if (dobRaw) {
      const chk = validateUserDobAge(dobRaw);
      if (!chk.valid) errors.push({ field: "DOB", message: chk.message ?? "Invalid date of birth" });
      else dob = parseDobDate(dobRaw);
    }

    // ── Commission Rate ──
    let commissionRate: number | null = null;
    if (commissionRaw) {
      const n = Number(commissionRaw.replace(/[^\d.]/g, ""));
      if (isNaN(n) || n < 0 || n > 100) errors.push({ field: "Commission Rate", message: "Must be a number between 0 and 100" });
      else commissionRate = n;
    }

    // ── ZIP (6 digits for India / 3–10 alphanumerics otherwise) ──
    if (zip && !/^[A-Za-z0-9\s-]{3,10}$/.test(zip)) {
      errors.push({ field: "ZIP", message: "ZIP / PIN code looks invalid" });
    }

    // ── Role ──
    let role = defaultRole;
    if (roleRaw) {
      const mapped = parseRoleKey(roleRaw);
      if (!mapped) errors.push({ field: "Role", message: `Unknown account type "${roleRaw}"` });
      else role = mapped;
    }
    if (!allowedRoles.includes(role)) {
      errors.push({ field: "Role", message: `You are not allowed to create ${role} accounts` });
    }

    // ── Manager email must resolve ──
    let managerId: string | null = null;
    if (managerEmail) {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(managerEmail)) errors.push({ field: "Manager Email", message: "Manager email format is invalid" });
      else {
        managerId = userByEmail.get(managerEmail) ?? null;
        if (!managerId) errors.push({ field: "Manager Email", message: "No existing user found with this manager email" });
      }
    }

    // ── Hierarchy names must resolve if provided ──
    const resolve = (val: string, map: Map<string, string>, label: string): string | null => {
      if (!val) return null;
      const id = map.get(val.toLowerCase());
      if (!id) errors.push({ field: label, message: `No ${label.toLowerCase()} named "${val}" exists` });
      return id ?? null;
    };
    const tenantId = resolve(orgName, orgMap, "Organization");
    const franchiseId = resolve(frName, frMap, "Franchise");
    const branchId = resolve(brName, brMap, "Branch");
    const departmentId = resolve(deptName, deptMap, "Department");
    const teamId = resolve(teamName, teamMap, "Team");

    if (errors.length > 0) {
      skipped.push({ row: rowNo, name, email, errors });
      continue;
    }

    const password = providedPw && providedPw.length >= 6 ? providedPw : genPassword();
    const generated = !(providedPw && providedPw.length >= 6);

    try {
      const passwordHash = await bcrypt.hash(password, 12);
      const userId = await generateNextUserId();
      await prisma.user.create({
        data: {
          userId,
          name,
          email,
          passwordHash,
          phone: phone || null,
          countryCode: phone ? (countryCode || "+91") : undefined,
          role,
          pan: pan || null,
          aadhar: aadhar || null,
          dob,
          address: address || null,
          city: city || null,
          state: state || null,
          zip: zip || null,
          country: country || undefined,
          commissionRate: commissionRate ?? undefined,
          tenantId,
          franchiseId,
          branchId,
          departmentId,
          teamId,
          managerId,
        },
      });
      seen.add(email);
      emailsInFile.add(email);
      created.push({ name, email, userId, tempPassword: generated ? password : null });
    } catch {
      skipped.push({ row: rowNo, name, email, errors: [{ field: "—", message: "Database error — could not save this row" }] });
    }
  }

  return NextResponse.json({
    ok: true,
    createdCount: created.length,
    skippedCount: skipped.length,
    created,
    skipped,
  });
}
