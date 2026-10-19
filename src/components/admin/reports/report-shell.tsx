import { AdminPageHeader } from "@/components/admin/admin-page-header";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function ReportShell({
  title,
  description,
  slug,
  children,
}: {
  title: string;
  description: string;
  slug: string;
  children: React.ReactNode;
}) {
  return (
    <div data-report={slug}>
      <AdminPageHeader
        title={title}
        description={description}
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Reports", href: "/admin/reports" },
          { label: title },
        ]}
        actions={
          <Link
            href="/admin/reports"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            All reports
          </Link>
        }
      />
      {children}
    </div>
  );
}

export const REPORT_CATALOG = [
  {
    href: "/admin/reports/funnel",
    title: "Lead funnel",
    description: "Stage-by-stage conversion from new lead to won deal",
    category: "Sales",
    color: "from-sky-500/10 to-indigo-500/10 border-sky-200",
  },
  {
    href: "/admin/reports/pipeline",
    title: "Pipeline health",
    description: "Active deals, overdue follow-ups, and stage distribution",
    category: "Sales",
    color: "from-violet-500/10 to-purple-500/10 border-violet-200",
  },
  {
    href: "/admin/reports/sources",
    title: "Lead sources",
    description: "Which channels bring the most and best-quality leads",
    category: "Sales",
    color: "from-brand/10 to-orange-500/10 border-amber-200",
  },
  {
    href: "/admin/reports/team",
    title: "Team performance",
    description: "Leads owned, wins, and workload by agent",
    category: "Sales",
    color: "from-emerald-500/10 to-teal-500/10 border-emerald-200",
  },
  {
    href: "/admin/reports/revenue",
    title: "Revenue analytics",
    description: "Completed payments, monthly trend, and transaction mix",
    category: "Finance",
    color: "from-brand/20 to-brand-hover/10 border-amber-300",
  },
  {
    href: "/admin/reports/properties",
    title: "Listings performance",
    description: "Top properties by yield, inquiries, and status mix",
    category: "Listings",
    color: "from-blue-500/10 to-cyan-500/10 border-blue-200",
  },
  {
    href: "/admin/reports/inquiries",
    title: "Inquiry trends",
    description: "Property inquiries over time and conversion to CRM",
    category: "Marketing",
    color: "from-pink-500/10 to-rose-500/10 border-pink-200",
  },
  {
    href: "/admin/reports/users",
    title: "User growth",
    description: "Registrations by role and monthly sign-up trend",
    category: "People",
    color: "from-indigo-500/10 to-blue-500/10 border-indigo-200",
  },
  {
    href: "/admin/reports/kyc",
    title: "KYC compliance",
    description: "Verification status breakdown and pending queue",
    category: "Compliance",
    color: "from-slate-500/10 to-slate-400/10 border-slate-300",
  },
] as const;
