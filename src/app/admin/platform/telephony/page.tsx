import { PlatformSettingsNav } from "@/components/admin/platform-settings-nav";
import Link from "next/link";
import { getCompanySettings } from "@/lib/company-settings";
import { getCountryByCode } from "@/lib/locale-defaults";
import { prisma } from "@/lib/prisma";
import { TelephonySimulator } from "@/components/admin/telephony-simulator";
import { getMessagingIntegrations } from "@/lib/messaging-settings";
import { getServerTenantId } from "@/lib/tenant";

export default async function TelephonyPage() {
  const tenantId = await getServerTenantId();
  const company = await getCompanySettings();
  const country = getCountryByCode(company.country);
  const integrations = await getMessagingIntegrations(tenantId);

  const leads = await prisma.lead.findMany({
    where: { tenantId },
    select: { id: true, name: true, phone: true },
    orderBy: { name: "asc" }
  });

  return (
    <div className="flex gap-8">
      <PlatformSettingsNav />
      <div className="flex-1 max-w-4xl">
        <h1 className="font-display text-3xl font-bold">Telephony &amp; messaging</h1>
        <p className="mt-1 text-slate-600">
          Voice, SMS, and WhatsApp — configured for {country.name} ({country.dial}) by default
        </p>

        <div className="mt-8 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border bg-white p-6 space-y-3">
              <h2 className="font-semibold text-slate-900">Default region</h2>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-slate-500">Country</dt>
                  <dd className="font-medium">{country.flag} {country.name}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Dial code</dt>
                  <dd className="font-medium">{country.dial}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Company phone</dt>
                  <dd className="font-medium">{company.phone || "Not set"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Currency</dt>
                  <dd className="font-medium">{company.currency}</dd>
                </div>
              </dl>
              <Link href="/admin/platform/company" className="text-sm text-brand-hover underline">
                Edit company defaults →
              </Link>
            </div>

            <div className="rounded-2xl border bg-white p-6 space-y-3">
              <h2 className="font-semibold text-slate-900">WhatsApp &amp; SMS</h2>
              <p className="text-sm text-slate-600">
                Connect Twilio for SMS and voice, WhatsApp Business API or Web mode for chat.
                Use the QR scanner in{" "}
                <Link href="/admin/integrations" className="text-brand-hover underline">
                  Integrations
                </Link>{" "}
                or{" "}
                <Link href="/admin/messages" className="text-brand-hover underline">
                  Messages
                </Link>{" "}
                to capture phone numbers.
              </p>
              <ul className="text-sm text-slate-650 list-disc list-inside space-y-1">
                <li>Default outbound format: E.164 dial formatting</li>
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6">
            <p className="text-sm text-slate-500">
              Virtual numbers, IVR trees, and call logging are fully integrated via Twilio voice.
              Incoming calls automatically forward to the lead's owner, and outbound bridging is active.
            </p>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-xl font-bold font-display text-slate-900">Telephony &amp; Call Simulators</h2>
            <p className="text-xs text-slate-500 mt-1">Test outbound click-to-call bridging, inbound call routing TwiML, and status callback logging.</p>
            <TelephonySimulator
              companyPhone={company.phone || ""}
              twilioFromPhone={integrations.twilioFromPhone}
              leads={leads}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
