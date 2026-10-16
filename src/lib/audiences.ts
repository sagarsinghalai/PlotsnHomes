import { Prisma, LeadStage, PropertyType, Role, TransactionType } from "@prisma/client";
import { z } from "zod";
import { getCrmSettings } from "@/lib/crm-settings";
import { prisma } from "@/lib/prisma";
import { getSetting, setSetting } from "@/lib/system-settings";
import type { Recipient } from "@/lib/whatsapp-central";

/**
 * Audience segmentation engine.
 *
 * An audience is a `base` (who we message) plus a set of optional filters that
 * narrow it. Filters are resolved live against the DB at preview/send time, so
 * a saved audience always reflects current data.
 *
 *   - "leads"     → Lead records (by stage, source, owner, date, property)
 *   - "customers" → Users (buyers/sellers; KYC, transactions, payment, interest)
 *   - "agents"    → Users (agents/staff)
 */

export type AudienceBase = "leads" | "customers" | "agents";
export type PaymentStatus = "pending" | "partial" | "paid" | "rejected";
export type KycFilter = "APPROVED" | "PENDING" | "REJECTED" | "NONE";
export type ActiveStatus = "active" | "inactive" | "any";

export type AudienceFilters = {
  base: AudienceBase;

  // Leads
  leadStages?: LeadStage[];
  sources?: string[];
  ownerIds?: string[]; // agent owners
  createdFrom?: string; // ISO date (yyyy-mm-dd)
  createdTo?: string;

  // Customers (users)
  roles?: ("BUYER" | "SELLER")[];
  activeStatus?: ActiveStatus;
  kycStatus?: KycFilter[];
  city?: string; // customer location
  nameSearch?: string; // person / seller / buyer name
  transactionTypes?: TransactionType[];
  paymentStatus?: PaymentStatus[];

  // Property attributes / interest (leads + customers)
  propertySearch?: string; // property name / location / project
  propertyTypes?: PropertyType[];
  developerIds?: string[]; // builder (exact)
  projectIds?: string[]; // project (exact)

  // Agents
  agentIds?: string[];
};

export type SavedAudience = {
  id: string;
  name: string;
  filters: AudienceFilters;
  createdAt: string;
};

const AUDIENCES_KEY = "whatsapp_saved_audiences";
const TAKE = 2000;

export const audienceFiltersSchema = z.object({
  base: z.enum(["leads", "customers", "agents"]),
  leadStages: z.array(z.nativeEnum(LeadStage)).optional(),
  sources: z.array(z.string()).optional(),
  ownerIds: z.array(z.string()).optional(),
  createdFrom: z.string().optional(),
  createdTo: z.string().optional(),
  roles: z.array(z.enum(["BUYER", "SELLER"])).optional(),
  activeStatus: z.enum(["active", "inactive", "any"]).optional(),
  kycStatus: z.array(z.enum(["APPROVED", "PENDING", "REJECTED", "NONE"])).optional(),
  city: z.string().optional(),
  nameSearch: z.string().optional(),
  transactionTypes: z.array(z.nativeEnum(TransactionType)).optional(),
  paymentStatus: z.array(z.enum(["pending", "partial", "paid", "rejected"])).optional(),
  propertySearch: z.string().optional(),
  propertyTypes: z.array(z.nativeEnum(PropertyType)).optional(),
  developerIds: z.array(z.string()).optional(),
  projectIds: z.array(z.string()).optional(),
  agentIds: z.array(z.string()).optional(),
});

// ─── Where-clause builders ───────────────────────────────────────────────────

function endOfDay(iso: string): Date {
  return new Date(`${iso}T23:59:59.999`);
}

/** Match a property by name / location / project / type. */
function propertyWhere(f: AudienceFilters): Prisma.PropertyWhereInput | undefined {
  const w: Prisma.PropertyWhereInput = {};
  const s = f.propertySearch?.trim();
  if (s) {
    w.OR = [
      { title: { contains: s } },
      { symbol: { contains: s } },
      { city: { contains: s } },
      { state: { contains: s } },
      { address: { contains: s } },
      { area: { contains: s } },
      { category: { contains: s } },
    ];
  }
  if (f.propertyTypes?.length) w.type = { in: f.propertyTypes };
  if (f.developerIds?.length) w.developerId = { in: f.developerIds };
  if (f.projectIds?.length) w.projectId = { in: f.projectIds };
  return Object.keys(w).length ? w : undefined;
}

/** Transaction predicate for a set of payment statuses. */
function paymentWhere(statuses: PaymentStatus[]): Prisma.TransactionWhereInput[] {
  const conds: Prisma.TransactionWhereInput[] = [];
  for (const s of statuses) {
    if (s === "pending") conds.push({ OR: [{ status: "PENDING" }, { received: "no" }] });
    else if (s === "partial") conds.push({ received: "partial" });
    else if (s === "paid") conds.push({ OR: [{ status: "COMPLETED" }, { received: "yes" }] });
    else if (s === "rejected") conds.push({ status: { in: ["FAILED", "REFUNDED"] } });
  }
  return conds;
}

function activeClause(status: ActiveStatus | undefined): boolean | undefined {
  if (status === "active") return true;
  if (status === "inactive") return false;
  return undefined;
}

// ─── Resolver ────────────────────────────────────────────────────────────────

function toRecipients(rows: { id: string; name: string; phone: string | null }[]): Recipient[] {
  return rows
    .filter((r) => r.phone && r.phone.trim())
    .map((r) => ({ id: r.id, name: r.name, phone: r.phone! }));
}

async function resolveLeads(f: AudienceFilters): Promise<Recipient[]> {
  const where: Prisma.LeadWhereInput = { phone: { not: null } };
  if (f.leadStages?.length) where.stage = { in: f.leadStages };
  if (f.sources?.length) where.source = { in: f.sources };
  if (f.ownerIds?.length) where.ownerId = { in: f.ownerIds };
  if (f.createdFrom || f.createdTo) {
    where.createdAt = {
      ...(f.createdFrom && { gte: new Date(`${f.createdFrom}T00:00:00`) }),
      ...(f.createdTo && { lte: endOfDay(f.createdTo) }),
    };
  }
  const pw = propertyWhere(f);
  if (pw) where.property = { is: pw };

  const rows = await prisma.lead.findMany({
    where,
    select: { id: true, name: true, phone: true },
    take: TAKE,
  });
  return toRecipients(rows);
}

async function resolveCustomers(f: AudienceFilters): Promise<Recipient[]> {
  const where: Prisma.UserWhereInput = { phone: { not: null } };
  where.role = { in: (f.roles?.length ? f.roles : ["BUYER", "SELLER"]) as Role[] };

  const active = activeClause(f.activeStatus);
  if (active !== undefined) where.active = active;
  if (f.city?.trim()) where.city = { contains: f.city.trim() };
  if (f.nameSearch?.trim()) where.name = { contains: f.nameSearch.trim() };

  const and: Prisma.UserWhereInput[] = [];

  // KYC status (specific statuses and/or "no KYC on file")
  if (f.kycStatus?.length) {
    const specific = f.kycStatus.filter((s) => s !== "NONE") as ("APPROVED" | "PENDING" | "REJECTED")[];
    const or: Prisma.UserWhereInput[] = [];
    if (specific.length) or.push({ kycProfile: { status: { in: specific } } });
    if (f.kycStatus.includes("NONE")) or.push({ kycProfile: { is: null } });
    if (or.length) and.push({ OR: or });
  }

  // Transactions (type + payment status)
  if (f.transactionTypes?.length || f.paymentStatus?.length) {
    const tw: Prisma.TransactionWhereInput = {};
    if (f.transactionTypes?.length) tw.type = { in: f.transactionTypes };
    if (f.paymentStatus?.length) tw.OR = paymentWhere(f.paymentStatus);
    where.transactions = { some: tw };
  }

  // Property interest (inquiry / favorite / showing on a matching property)
  const pw = propertyWhere(f);
  if (pw) {
    and.push({
      OR: [
        { inquiries: { some: { property: { is: pw } } } },
        { favorites: { some: { property: { is: pw } } } },
        { showings: { some: { property: { is: pw } } } },
      ],
    });
  }

  if (and.length) where.AND = and;

  const rows = await prisma.user.findMany({
    where,
    select: { id: true, name: true, phone: true },
    take: TAKE,
  });
  return toRecipients(rows);
}

async function resolveAgents(f: AudienceFilters): Promise<Recipient[]> {
  const where: Prisma.UserWhereInput = {
    phone: { not: null },
    role: { in: [Role.AGENT, Role.EMPLOYEE] },
  };
  if (f.agentIds?.length) where.id = { in: f.agentIds };
  const active = activeClause(f.activeStatus);
  if (active !== undefined) where.active = active;

  const rows = await prisma.user.findMany({
    where,
    select: { id: true, name: true, phone: true },
    take: TAKE,
  });
  return toRecipients(rows);
}

/** Resolve a filter set into a deduped list of message recipients. */
export async function resolveAudienceFilters(f: AudienceFilters): Promise<Recipient[]> {
  let recipients: Recipient[];
  if (f.base === "leads") recipients = await resolveLeads(f);
  else if (f.base === "agents") recipients = await resolveAgents(f);
  else recipients = await resolveCustomers(f);

  // Dedupe by phone digits.
  const seen = new Set<string>();
  const out: Recipient[] = [];
  for (const r of recipients) {
    const key = r.phone.replace(/\D/g, "");
    if (key.length < 10 || seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

// ─── Email Audience Resolver ──────────────────────────────────────────────────

export type EmailRecipient = { id: string; name: string; email: string };

function toEmailRecipients(rows: { id: string; name: string; phone: string | null; email: string | null }[]): EmailRecipient[] {
  return rows
    .filter((r) => r.email && r.email.trim())
    .map((r) => ({ id: r.id, name: r.name, email: r.email!.trim() }));
}

async function resolveLeadsByEmail(f: AudienceFilters): Promise<EmailRecipient[]> {
  const where: Prisma.LeadWhereInput = { email: { not: "" } };
  if (f.leadStages?.length) where.stage = { in: f.leadStages };
  if (f.sources?.length) where.source = { in: f.sources };
  if (f.ownerIds?.length) where.ownerId = { in: f.ownerIds };
  if (f.createdFrom || f.createdTo) {
    where.createdAt = {
      ...(f.createdFrom && { gte: new Date(`${f.createdFrom}T00:00:00`) }),
      ...(f.createdTo && { lte: endOfDay(f.createdTo) }),
    };
  }
  const pw = propertyWhere(f);
  if (pw) where.property = { is: pw };

  const rows = await prisma.lead.findMany({
    where,
    select: { id: true, name: true, phone: true, email: true },
    take: TAKE,
  });
  return toEmailRecipients(rows);
}

async function resolveCustomersByEmail(f: AudienceFilters): Promise<EmailRecipient[]> {
  const where: Prisma.UserWhereInput = { email: { not: "" } };
  where.role = { in: (f.roles?.length ? f.roles : ["BUYER", "SELLER"]) as Role[] };

  const active = activeClause(f.activeStatus);
  if (active !== undefined) where.active = active;
  if (f.city?.trim()) where.city = { contains: f.city.trim() };
  if (f.nameSearch?.trim()) where.name = { contains: f.nameSearch.trim() };

  const and: Prisma.UserWhereInput[] = [];

  if (f.kycStatus?.length) {
    const specific = f.kycStatus.filter((s) => s !== "NONE") as ("APPROVED" | "PENDING" | "REJECTED")[];
    const or: Prisma.UserWhereInput[] = [];
    if (specific.length) or.push({ kycProfile: { status: { in: specific } } });
    if (f.kycStatus.includes("NONE")) or.push({ kycProfile: { is: null } });
    if (or.length) and.push({ OR: or });
  }

  if (f.transactionTypes?.length || f.paymentStatus?.length) {
    const tw: Prisma.TransactionWhereInput = {};
    if (f.transactionTypes?.length) tw.type = { in: f.transactionTypes };
    if (f.paymentStatus?.length) tw.OR = paymentWhere(f.paymentStatus);
    where.transactions = { some: tw };
  }

  const pw = propertyWhere(f);
  if (pw) {
    and.push({
      OR: [
        { inquiries: { some: { property: { is: pw } } } },
        { favorites: { some: { property: { is: pw } } } },
        { showings: { some: { property: { is: pw } } } },
      ],
    });
  }

  if (and.length) where.AND = and;

  const rows = await prisma.user.findMany({
    where,
    select: { id: true, name: true, phone: true, email: true },
    take: TAKE,
  });
  return toEmailRecipients(rows);
}

async function resolveAgentsByEmail(f: AudienceFilters): Promise<EmailRecipient[]> {
  const where: Prisma.UserWhereInput = {
    email: { not: "" },
    role: { in: [Role.AGENT, Role.EMPLOYEE] },
  };
  if (f.agentIds?.length) where.id = { in: f.agentIds };
  const active = activeClause(f.activeStatus);
  if (active !== undefined) where.active = active;

  const rows = await prisma.user.findMany({
    where,
    select: { id: true, name: true, phone: true, email: true },
    take: TAKE,
  });
  return toEmailRecipients(rows);
}

/** Resolve a filter set into a deduped list of email message recipients. */
export async function resolveAudienceFiltersByEmail(f: AudienceFilters): Promise<EmailRecipient[]> {
  let recipients: EmailRecipient[];
  if (f.base === "leads") recipients = await resolveLeadsByEmail(f);
  else if (f.base === "agents") recipients = await resolveAgentsByEmail(f);
  else recipients = await resolveCustomersByEmail(f);

  // Dedupe by lowercased email.
  const seen = new Set<string>();
  const out: EmailRecipient[] = [];
  for (const r of recipients) {
    const key = r.email.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

// ─── Saved audiences (stored as JSON in SystemSetting) ───────────────────────

export async function getSavedAudiences(): Promise<SavedAudience[]> {
  const raw = await getSetting(AUDIENCES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedAudience[]) : [];
  } catch {
    return [];
  }
}

export async function saveAudience(input: {
  id?: string;
  name: string;
  filters: AudienceFilters;
}): Promise<SavedAudience> {
  const list = await getSavedAudiences();
  const id = input.id || crypto.randomUUID();
  const existing = list.find((a) => a.id === id);
  const record: SavedAudience = {
    id,
    name: input.name,
    filters: input.filters,
    createdAt: existing?.createdAt || new Date().toISOString(),
  };
  const next = existing ? list.map((a) => (a.id === id ? record : a)) : [...list, record];
  await setSetting(AUDIENCES_KEY, JSON.stringify(next));
  return record;
}

export async function deleteAudience(id: string): Promise<void> {
  const list = await getSavedAudiences();
  await setSetting(AUDIENCES_KEY, JSON.stringify(list.filter((a) => a.id !== id)));
}

// ─── Filter options for the builder UI ───────────────────────────────────────

export async function getAudienceFilterOptions() {
  const [crm, agents, developers, projects, distinctSources] = await Promise.all([
    getCrmSettings(),
    prisma.user.findMany({
      where: { role: { in: [Role.AGENT, Role.EMPLOYEE] } },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    }),
    prisma.developer.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.project.findMany({
      select: { id: true, name: true, developerId: true },
      orderBy: { name: "asc" },
    }),
    prisma.lead.findMany({ select: { source: true }, distinct: ["source"], take: 100 }),
  ]);

  const sources = Array.from(
    new Set([...crm.leadSources, ...distinctSources.map((s) => s.source)].filter(Boolean)),
  ).sort();

  return {
    sources,
    agents,
    developers,
    projects,
    leadStages: Object.values(LeadStage),
    transactionTypes: Object.values(TransactionType),
    propertyTypes: Object.values(PropertyType),
    roles: ["BUYER", "SELLER"] as const,
    kycStatuses: ["APPROVED", "PENDING", "REJECTED", "NONE"] as const,
    paymentStatuses: ["pending", "partial", "paid", "rejected"] as const,
  };
}
