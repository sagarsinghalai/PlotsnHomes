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
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900">
          Rates & interest
        </h1>
        <p className="mt-1 text-slate-600 mb-8">
          Platform defaults for yield, cap rate, and financing interest
        </p>
        <RatesSettings
          defaultInterestRate={rates.defaultInterestRate}
          defaultYieldRate={rates.defaultYieldRate}
          defaultCapRate={rates.defaultCapRate}
        />
      </div>

      <div className="border-t border-slate-200 pt-10">
        <Suspense fallback={<div className="text-center py-12 text-slate-400">Loading slabs…</div>}>
          <RatingSlabsManager />
        </Suspense>
      </div>
    </div>
  );
}
