"use client";

import { useEffect, useState } from "react";
import { SalesAnalyticsSection } from "./sales-analytics-section";
import { LeadAnalyticsSection } from "./lead-analytics-section";
import { ProjectAnalyticsSection } from "./project-analytics-section";
import { PropertyAnalyticsSection } from "./property-analytics-section";
import { AgentAnalyticsSection } from "./agent-analytics-section";
import { CustomerAnalyticsSection } from "./customer-analytics-section";
import { SiteVisitAnalyticsSection } from "./site-visit-analytics-section";
import { BusinessPerformanceSection } from "./business-performance-section";
import { Loader2 } from "lucide-react";

interface ExtendedAnalyticsProps {
  range: string;
  fromDate?: string;
  toDate?: string;
}

export function AdminExtendedAnalytics({ range, fromDate, toDate }: ExtendedAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchAnalytics() {
      try {
        setLoading(true);
        setError(null);

        let url = `/api/admin/analytics?range=${encodeURIComponent(range)}`;
        if (range === "custom" && fromDate && toDate) {
          url += `&from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}`;
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load analytics data");
        const json = await res.json();

        if (isMounted) {
          setAnalyticsData(json);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Error fetching analytics:", err);
          setError(err.message || "Failed to load data");
          setLoading(false);
        }
      }
    }

    fetchAnalytics();
    return () => {
      isMounted = false;
    };
  }, [range, fromDate, toDate]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-12 text-center flex flex-col items-center justify-center my-6 shadow-sm">
        <Loader2 className="h-8 w-8 text-brand animate-spin mb-3" />
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Updating Analytics Engine...</p>
        <p className="text-xs text-slate-500 mt-1">Filtering live database metrics for period: {range.toUpperCase()}</p>
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 p-6 text-center text-xs text-rose-600 dark:text-rose-400 my-6">
        <p className="font-bold">Unable to load extended analytics.</p>
        <p className="mt-1 text-slate-500">{error || "Please refresh or select a different date range."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 my-6">
      {/* 1. Sales Analytics */}
      <SalesAnalyticsSection data={analyticsData.salesAnalytics} />

      {/* 2. Lead Analytics */}
      <LeadAnalyticsSection data={analyticsData.leadAnalytics} />

      {/* 3. Project Analytics */}
      <ProjectAnalyticsSection data={analyticsData.projectAnalytics} />

      {/* 4. Property Analytics */}
      <PropertyAnalyticsSection data={analyticsData.propertyAnalytics} />

      {/* 5. Agent Analytics */}
      <AgentAnalyticsSection data={analyticsData.agentAnalytics} />

      {/* 6. Customer Analytics */}
      <CustomerAnalyticsSection data={analyticsData.customerAnalytics} />

      {/* 7. Site Visit Analytics */}
      <SiteVisitAnalyticsSection data={analyticsData.siteVisitAnalytics} />

      {/* 8. Business Performance */}
      <BusinessPerformanceSection data={analyticsData.businessPerformance} />
    </div>
  );
}
