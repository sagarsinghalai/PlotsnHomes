import { ReportShell } from "@/components/admin/reports/report-shell";
import {
  DataTable,
  DonutChart,
  HorizontalBarChart,
  ReportKpiGrid,
} from "@/components/admin/reports/charts";
import { groupCountByMonth } from "@/lib/admin-reports";
import { AreaLineChart } from "@/components/admin/reports/charts";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getServerTenantId } from "@/lib/tenant";

export default async function KycComplianceReportPage() {
  const tenantId = await getServerTenantId();
  const [profiles, totalUsers] = await Promise.all([
    prisma.kycProfile.findMany({
      where: { tenantId },
      select: { status: true, createdAt: true, fullName: true, user: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where: { tenantId } }),
  ]);

  const byStatus = new Map<string, number>();
  for (const p of profiles) {
    byStatus.set(p.status, (byStatus.get(p.status) ?? 0) + 1);
  }

  const statusData = ["PENDING", "APPROVED", "REJECTED"].map((s) => ({
    label: s,
    value: byStatus.get(s) ?? 0,
    color: s === "APPROVED" ? "#10B981" : s === "REJECTED" ? "#EF4444" : "#F59E0B",
  }));

  const trend = groupCountByMonth(profiles.map((p) => p.createdAt));
  const pending = byStatus.get("PENDING") ?? 0;
  const notSubmitted = totalUsers - profiles.length;

  return (
    <ReportShell
      title="KYC compliance"
      description="Identity verification status and submission trends"
      slug="kyc"
    >
      <ReportKpiGrid
        items={[
          { label: "KYC submitted", value: profiles.length },
          { label: "Pending review", value: pending, highlight: pending > 0 },
          { label: "Approved", value: byStatus.get("APPROVED") ?? 0 },
          { label: "Not submitted", value: notSubmitted },
        ]}
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Status distribution</h3>
          <DonutChart data={statusData} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Status breakdown</h3>
          <HorizontalBarChart data={statusData} />
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Submissions per month</h3>
        <AreaLineChart data={trend} />
      </div>

      <div className="mt-8 flex justify-end">
        <Link href="/admin/kyc" className="text-sm font-medium text-brand-hover hover:underline">
          Open KYC review queue →
        </Link>
      </div>

      <div className="mt-4">
        <DataTable
          title="Recent submissions"
          columns={["Name", "Email", "Status", "Submitted"]}
          rows={profiles.slice(0, 15).map((p) => [
            p.fullName,
            p.user.email,
            p.status,
            new Date(p.createdAt).toLocaleDateString(),
          ])}
        />
      </div>
    </ReportShell>
  );
}
