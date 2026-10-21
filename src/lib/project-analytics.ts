import { SITE_SETTING_KEYS, getSiteSetting, type AnalyticsIntegration } from "@/lib/site-settings";

/**
 * Live Google Analytics (GA4) numbers for a project — DORMANT until an admin
 * adds the platform service-account key (Settings → Analytics Integration) and
 * the project has a GA4 Property ID. Returns null when not configured so the
 * caller falls back to the manually-entered metrics. Enabling live data needs
 * the `@google-analytics/data` package installed.
 */
export async function getLiveProjectMetrics(
  ga4PropertyId?: string | null
): Promise<{ views: number } | null> {
  if (!ga4PropertyId) return null;
  try {
    const integ = await getSiteSetting<AnalyticsIntegration>(SITE_SETTING_KEYS.ANALYTICS_INTEGRATION);
    if (!integ?.gaEnabled || !integ.gaServiceAccountJson) return null;

    const moduleName = "@google-analytics/data";
    const mod: any = await import(/* webpackIgnore: true */ moduleName).catch(() => null);
    if (!mod?.BetaAnalyticsDataClient) return null;

    const credentials = JSON.parse(integ.gaServiceAccountJson);
    const client = new mod.BetaAnalyticsDataClient({ credentials });
    const [resp] = await client.runReport({
      property: `properties/${ga4PropertyId}`,
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      metrics: [{ name: "screenPageViews" }],
    });
    const v = resp?.rows?.[0]?.metricValues?.[0]?.value;
    return { views: v ? Number(v) : 0 };
  } catch {
    return null;
  }
}
