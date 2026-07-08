import { CrmSettingsForm } from "@/components/admin/crm-settings-form";
import { getCrmSettings } from "@/lib/crm-settings";
import { prisma } from "@/lib/prisma";

export default async function AdminCrmSettingsPage() {
  const [settings, agents] = await Promise.all([
    getCrmSettings(),
    prisma.user.findMany({
      where: { role: { in: ["SUPERADMIN", "EMPLOYEE", "AGENT"] }, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-slate-900">CRM settings</h1>
      <p className="mt-1 text-slate-600">Lead routing, sources, and message templates</p>
      <div className="mt-8">
        <CrmSettingsForm settings={settings} agents={agents} />
      </div>
    </div>
  );
}
