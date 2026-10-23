import { prisma } from "@/lib/prisma";
import { isEmailConfigured } from "@/lib/email";
import { getCrmSettings } from "@/lib/crm-settings";
import { EmailHubComposer } from "@/components/admin/email-hub-composer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export const dynamic = "force-dynamic";

export default async function EmailHubPage() {
  const session = await getServerSession(authOptions);
  const tenantId = session?.user?.tenantId || "__no_tenant__";
  const [users, leads, crmSettings] = await Promise.all([
    prisma.user.findMany({
      where: { tenantId },
      select: { name: true, email: true, role: true },
    }),
    prisma.lead.findMany({
      where: { tenantId },
      select: { name: true, email: true },
    }),
    getCrmSettings(tenantId),
  ]);

  const contactsMap = new Map<string, { name: string; email: string; source: string }>();

  users.forEach((u) => {
    if (u.email) {
      contactsMap.set(u.email.toLowerCase().trim(), {
        name: u.name ?? "User",
        email: u.email.trim(),
        source: `User (${u.role})`,
      });
    }
  });

  leads.forEach((l) => {
    if (l.email) {
      contactsMap.set(l.email.toLowerCase().trim(), {
        name: l.name ?? "Lead Prospect",
        email: l.email.trim(),
        source: "Lead Prospect",
      });
    }
  });

  const contacts = Array.from(contactsMap.values());
  const resendOn = isEmailConfigured();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900">Email Hub</h1>
        <p className="mt-1 text-slate-600">
          Send direct communications to database contacts ·{" "}
          <span className={resendOn ? "text-emerald-600 font-medium" : "text-amber-600 font-medium"}>
            {resendOn ? "Resend LIVE" : "Dev mode (logged to DB only)"}
          </span>
        </p>
      </div>

      {!resendOn && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Add <code className="bg-white px-1 rounded">RESEND_API_KEY</code> to .env for real delivery.
          Until then, sent emails will be stored under the Email Log so you can verify.
        </div>
      )}

      <EmailHubComposer contacts={contacts} templates={crmSettings.messageTemplates} />
    </div>
  );
}
