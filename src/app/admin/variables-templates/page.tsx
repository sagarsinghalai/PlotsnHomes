import { getGlobalCustomVariables, getSystemVariables } from "@/lib/variables-store";
import { getCrmSettings } from "@/lib/crm-settings";
import { VariablesTemplatesClient } from "@/components/admin/variables-templates-client";

export const metadata = {
  title: "System Variables & Templates — Admin",
};

export default async function VariablesTemplatesPage() {
  const [systemVars, globalVars, crmSettings] = await Promise.all([
    getSystemVariables(),
    getGlobalCustomVariables(),
    getCrmSettings(),
  ]);

  return (
    <VariablesTemplatesClient
      initialSystemVariables={systemVars}
      initialGlobalCustomVariables={globalVars}
      initialTemplates={crmSettings.messageTemplates || []}
    />
  );
}
