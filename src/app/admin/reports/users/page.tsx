import { ReportShell } from "@/components/admin/reports/report-shell";
import {
  AreaLineChart,
  DataTable,
  DonutChart,
  ReportKpiGrid,
  VerticalBarChart,
} from "@/components/admin/reports/charts";
import { CHART_COLORS, groupCountByMonth } from "@/lib/admin-reports";
import { prisma } from "@/lib/prisma";

export default async function UserGrowthReportPage() {
  const users = await prisma.user.findMany({
    select: { role: true, createdAt: true, active: true },
  });

  const byRole = new Map<string, number>();
  let active = 0;
  for (const u of users) {
    byRole.set(u.role, (byRole.get(u.role) ?? 0) + 1);
    if (u.active) active++;
  }

  const roleData = Array.from(byRole.entries()).map(([role, value], i) => ({
    label: role,
    value,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const trend = groupCountByMonth(users.map((u) => u.createdAt));
  const customers =
    (byRole.get("BUYER") ?? 0) + (byRole.get("SELLER") ?? 0) + (byRole.get("DEMO") ?? 0);
  const staff =
    (byRole.get("SUPERADMIN") ?? 0) +
    (byRole.get("EMPLOYEE") ?? 0) +
    (byRole.get("AGENT") ?? 0);

  return (
    <ReportShell
      title="User growth"
      description="Registration trends and account type distribution"
      slug="users"
    >
      <ReportKpiGrid
        items={[
          { label: "Total users", value: users.length },
          { label: "Active accounts", value: active },
          { label: "Customers", value: customers },
          { label: "Staff", value: staff },
        ]}
      />

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">New sign-ups per month</h3>
        <AreaLineChart data={trend} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Users by role</h3>
          <VerticalBarChart data={roleData} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Role distribution</h3>
          <DonutChart data={roleData} />
        </div>
      </div>

      <div className="mt-8">
        <DataTable
          title="Role breakdown"
          columns={["Role", "Count", "% of users"]}
          rows={roleData.map((r) => [
            r.label,
            r.value,
            users.length ? `${Math.round((r.value / users.length) * 100)}%` : "0%",
          ])}
        />
      </div>
    </ReportShell>
  );
}
