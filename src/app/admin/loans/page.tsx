export const dynamic = "force-dynamic";

import { LoansManager } from "@/components/admin/loans-manager";
import { LoanRatesPanel, BankRate } from "@/components/admin/loan-rates-panel";
import { prisma } from "@/lib/prisma";
import { DEFAULT_BANKS } from "@/lib/loan-banks";
import { getServerTenantId } from "@/lib/tenant";

const RATE_PREFIX = "loan_rate_";
const BANKS_KEY = "loan_rate_banks_list";

async function getBankRates(): Promise<BankRate[]> {
  const [rateSettings, bankListSetting, nameSettings] = await Promise.all([
    prisma.systemSetting.findMany({ where: { key: { startsWith: RATE_PREFIX } } }),
    prisma.systemSetting.findUnique({ where: { key: BANKS_KEY } }),
    prisma.systemSetting.findMany({ where: { key: { startsWith: "loan_bank_name_" } } }),
  ]);

  const customSlugs: string[] = bankListSetting ? JSON.parse(bankListSetting.value) : [];
  const allSlugs = [
    ...DEFAULT_BANKS.map((b) => b.slug),
    ...customSlugs.filter((s) => !DEFAULT_BANKS.find((d) => d.slug === s)),
  ];

  const bankNamesMap: Record<string, string> = {};
  for (const b of DEFAULT_BANKS) bankNamesMap[b.slug] = b.bank;
  for (const s of nameSettings) {
    bankNamesMap[s.key.replace("loan_bank_name_", "")] = s.value;
  }

  const ratesMap: Record<string, number> = {};
  const updatedAtMap: Record<string, string> = {};
  for (const s of rateSettings) {
    const slug = s.key.replace(RATE_PREFIX, "");
    ratesMap[slug] = parseFloat(s.value);
    updatedAtMap[slug] = s.updatedAt.toISOString();
  }

  return allSlugs.map((slug) => {
    const def = DEFAULT_BANKS.find((b) => b.slug === slug);
    return {
      slug,
      bank: bankNamesMap[slug] ?? def?.bank ?? slug,
      rate: ratesMap[slug] ?? def?.rate ?? 8.5,
      isCustom: !def,
      updatedAt: updatedAtMap[slug] ?? null,
    };
  });
}

export default async function AdminLoansPage() {
  const tenantId = await getServerTenantId();
  const [loans, bankRates] = await Promise.all([
    prisma.loanApplication.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        property: { select: { title: true } },
      },
    }),
    getBankRates(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900">Loan Applications</h1>
        <p className="mt-1 text-slate-600">
          Manage interest rates per bank/branch and review financing requests.
        </p>
      </div>

      {/* Interest Rate Control Panel */}
      <LoanRatesPanel initialRates={bankRates} />

      {/* Loan Applications Table */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4">All Applications</h2>
        <LoansManager
          loans={loans.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() }))}
          bankRates={bankRates}
        />
      </div>
    </div>
  );
}
