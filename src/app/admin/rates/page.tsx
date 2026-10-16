import { RatesSettings } from "@/components/admin/rates-settings";
import { RatingSlabsManager } from "@/components/admin/rating-slabs-manager";
import {
  getPlatformRates,
  seedDefaultSettings,
  seedDefaultRatingSlabs,
} from "@/lib/system-settings";
import { Suspense } from "react";

export default async function AdminRatesPage() {
  await seedDefaultSettings();
  await seedDefaultRatingSlabs();
  const rates = await getPlatformRates();

  return (
    <div className="space-y-12">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="font-display text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Rates & interest
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 mb-8">
          Platform defaults for yield, cap rate, and financing interest
        </p>
        <RatesSettings
          defaultInterestRate={rates.defaultInterestRate}
          defaultYieldRate={rates.defaultYieldRate}
          defaultCapRate={rates.defaultCapRate}
        />
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800 pt-10">
        <Suspense fallback={<div className="text-center py-12 text-slate-400">Loading slabs…</div>}>
          <RatingSlabsManager />
        </Suspense>
      </div>
    </div>
  );
}
