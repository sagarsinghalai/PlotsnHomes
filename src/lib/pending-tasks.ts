// Derived "pending tasks" — the records across the platform that await an admin
// action. Nothing is stored; actioning a record (approve/verify/confirm) changes
// its status so it drops out of these queries, which is how a notification
// "disappears" once completed.
import { prisma } from "@/lib/prisma";
import { getFormRegistrations } from "@/lib/form-registrations-store";

export type PendingSummary = {
  listings: number;
  kyc: number;
  loans: number;
  showings: number;
  registrations: number;
  total: number;
};

export type PendingItem = {
  type: "listing" | "kyc" | "loan" | "showing" | "registration";
  id: string;
  title: string;
  subtitle: string;
  href: string;
  createdAt: string;
};

function tScope(tenantId: string | null) {
  return tenantId ? { tenantId } : {};
}

export async function getPendingSummary(tenantId: string | null): Promise<PendingSummary> {
  const [listings, kyc, loans, showings, registrations] = await Promise.all([
    prisma.property.count({ where: { ...tScope(tenantId), status: "PENDING" } }),
    prisma.kycProfile.count({ where: { ...tScope(tenantId), status: "PENDING" } }),
    prisma.loanApplication.count({ where: { ...tScope(tenantId), status: { in: ["PENDING", "UNDER_REVIEW"] } } }),
    prisma.propertyShowing.count({ where: { ...tScope(tenantId), status: "REQUESTED" } }),
    getFormRegistrations().then((r) => r.filter((x) => x.status === "PENDING").length).catch(() => 0),
  ]);
  return { listings, kyc, loans, showings, registrations, total: listings + kyc + loans + showings + registrations };
}

export async function getPendingItems(tenantId: string | null): Promise<PendingItem[]> {
  const [props, kyc, loans, showings, regs] = await Promise.all([
    prisma.property.findMany({
      where: { ...tScope(tenantId), status: "PENDING" },
      orderBy: { createdAt: "desc" }, take: 50,
      select: { id: true, title: true, city: true, price: true, createdAt: true, submittedBy: { select: { name: true, email: true } } },
    }),
    prisma.kycProfile.findMany({
      where: { ...tScope(tenantId), status: "PENDING" },
      orderBy: { createdAt: "desc" }, take: 50,
      select: { id: true, fullName: true, createdAt: true, user: { select: { name: true, email: true } } },
    }),
    prisma.loanApplication.findMany({
      where: { ...tScope(tenantId), status: { in: ["PENDING", "UNDER_REVIEW"] } },
      orderBy: { createdAt: "desc" }, take: 50,
      select: { id: true, loanAmount: true, createdAt: true, user: { select: { name: true, email: true } } },
    }),
    prisma.propertyShowing.findMany({
      where: { ...tScope(tenantId), status: "REQUESTED" },
      orderBy: { createdAt: "desc" }, take: 50,
      select: { id: true, name: true, tourDate: true, createdAt: true, property: { select: { title: true } } },
    }),
    getFormRegistrations().then((r) => r.filter((x) => x.status === "PENDING")).catch(() => []),
  ]);

  const items: PendingItem[] = [];
  for (const p of props) {
    items.push({
      type: "listing", id: p.id, title: p.title,
      subtitle: `${p.submittedBy?.name || "Seller"} · ${p.city} · ₹${Number(p.price).toLocaleString("en-IN")}`,
      href: "/admin/properties/pending", createdAt: p.createdAt.toISOString(),
    });
  }
  for (const k of kyc) {
    items.push({
      type: "kyc", id: k.id, title: `KYC — ${k.user?.name || k.fullName || k.user?.email || "User"}`,
      subtitle: "Identity verification pending", href: "/admin/kyc", createdAt: k.createdAt.toISOString(),
    });
  }
  for (const l of loans) {
    items.push({
      type: "loan", id: l.id, title: `Loan — ${l.user?.name || "Applicant"}`,
      subtitle: `₹${Number(l.loanAmount).toLocaleString("en-IN")} · awaiting review`, href: "/admin/loans", createdAt: l.createdAt.toISOString(),
    });
  }
  for (const s of showings) {
    items.push({
      type: "showing", id: s.id, title: `Site visit — ${s.property?.title || "Property"}`,
      subtitle: `${s.name} · ${new Date(s.tourDate).toLocaleDateString()}`, href: "/admin/showings", createdAt: s.createdAt.toISOString(),
    });
  }
  for (const r of regs) {
    items.push({
      type: "registration", id: r.id, title: `${r.type === "SELLER" ? "Seller" : "Partner"} application — ${r.name}`,
      subtitle: r.email, href: "/admin/form-registrations", createdAt: r.createdAt || new Date().toISOString(),
    });
  }

  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
