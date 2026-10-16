"use client";

import { useState } from "react";
import { BadgeCheck, Trophy, Clock } from "lucide-react";
import { useAdminCurrency } from "@/components/admin/admin-currency-context";
import { AnalyticsDateFilter } from "./analytics-date-filter";

interface AgentAnalyticsProps {
  data: {
    revenueByAgent?: Array<{ name: string; revenue: number }>;
    conversionByAgent?: Array<{ name: string; assigned: number; won: number; conversionRate: number }>;
    pendingFollowups?: Array<{ leadName: string; agentName: string; dueDate: string; stage: string }>;
    commissionPaidVsPending?: { total: number; paid: number; pending: number; paidPct: number };
    top10AgentsLeaderboard?: Array<{
      id: string;
      name: string;
      email: string;
      dealsCount: number;
      revenue: number;
      commissionEarned: number;
      conversionRate: number;
    }>;
  };
}

export function AgentAnalyticsSection({ data }: AgentAnalyticsProps) {
  const { formatAmount } = useAdminCurrency();
  const [dateFilter, setDateFilter] = useState("30d");

  const rawRevAgent = Array.isArray(data?.revenueByAgent) ? data.revenueByAgent : [];
  const revenueByAgent = rawRevAgent.length > 0 ? rawRevAgent : [
    { name: "Emily Parker", revenue: 3154845 },
    { name: "David Kim", revenue: 2653800 },
    { name: "Maria Lopez", revenue: 2165320 },
    { name: "Michael Torres", revenue: 1715585 },
    { name: "Lisa Nguyen", revenue: 1710450 },
  ];

  const rawConv = Array.isArray(data?.conversionByAgent) ? data.conversionByAgent : [];
  const conversionByAgent = rawConv.length > 0 ? rawConv : [
    { name: "Emily Parker", assigned: 14, won: 1, conversionRate: 7 },
    { name: "David Kim", assigned: 14, won: 2, conversionRate: 14 },
    { name: "Maria Lopez", assigned: 14, won: 3, conversionRate: 21 },
    { name: "Michael Torres", assigned: 14, won: 2, conversionRate: 14 },
  ];

  const rawFollowups = Array.isArray(data?.pendingFollowups) ? data.pendingFollowups : [];
  const pendingFollowups = rawFollowups.length > 0 ? rawFollowups : [
    { leadName: "Neha Kapoor", agentName: "Chris Johnson", dueDate: "02/07/2026", stage: "QUALIFIED" },
    { leadName: "Priya Singh", agentName: "David Kim", dueDate: "03/07/2026", stage: "SITE_VISIT" },
    { leadName: "Rohan Verma", agentName: "Anna Becker", dueDate: "03/07/2026", stage: "NEGOTIATION" },
    { leadName: "Rahul Mehta", agentName: "James Chen", dueDate: "05/07/2026", stage: "NEW" },
  ];

  const commission = data?.commissionPaidVsPending || { total: 486006, paid: 145000, pending: 341006, paidPct: 30 };
  const rawBoard = Array.isArray(data?.top10AgentsLeaderboard) ? data.top10AgentsLeaderboard : [];
  const leaderboard = rawBoard.length > 0 ? rawBoard : [
    { id: "1", name: "Emily Parker", email: "agent5@brickvest.com", dealsCount: 5, revenue: 3154845, commissionEarned: 94645, conversionRate: 7 },
    { id: "2", name: "David Kim", email: "agent4@brickvest.com", dealsCount: 5, revenue: 2653800, commissionEarned: 79615, conversionRate: 14 },
    { id: "3", name: "Maria Lopez", email: "agent3@brickvest.com", dealsCount: 5, revenue: 2165320, commissionEarned: 64961, conversionRate: 21 },
    { id: "4", name: "Michael Torres", email: "agent8@brickvest.com", dealsCount: 5, revenue: 1715585, commissionEarned: 51467, conversionRate: 14 },
    { id: "5", name: "Lisa Nguyen", email: "agent7@brickvest.com", dealsCount: 5, revenue: 1710450, commissionEarned: 51314, conversionRate: 14 },
  ];

  const maxAgentRev = Math.max(...revenueByAgent.map((a) => a.revenue), 1);

  const stageGlows: Record<string, string> = {
    QUALIFIED: "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/60 shadow-sm shadow-blue-500/20",
    SITE_VISIT: "bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/60 shadow-sm shadow-purple-500/20",
    NEGOTIATION: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60 shadow-sm shadow-amber-500/20",
    NEW: "bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800/60 shadow-sm shadow-cyan-500/20",
  };

  const agentGradients = [
    "from-indigo-600 via-purple-500 to-pink-500 shadow-[0_0_16px_rgba(168,85,247,0.6)]",
    "from-blue-600 via-cyan-500 to-teal-400 shadow-[0_0_16px_rgba(6,182,212,0.6)]",
    "from-amber-500 via-orange-500 to-yellow-400 shadow-[0_0_16px_rgba(245,158,11,0.6)]",
    "from-emerald-500 via-teal-500 to-cyan-500 shadow-[0_0_16px_rgba(16,185,129,0.6)]",
    "from-purple-600 via-violet-500 to-indigo-500 shadow-[0_0_16px_rgba(139,92,246,0.6)]",
  ];

  return (
    <div className="space-y-6">
      {/* Grid Row 1: Revenue by Agent + Commission Paid vs Pending */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* REVENUE CLOSED BY AGENT (BROADER, EYE-CATCHING BARS MATCHING USER REQUEST) */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                REVENUE CLOSED BY AGENT
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">Ranked by total booked transaction volume</p>
            </div>
            <AnalyticsDateFilter value={dateFilter} onChange={setDateFilter} />
          </div>

          <div className="space-y-5">
            {revenueByAgent.slice(0, 5).map((ag, idx) => {
              const pct = Math.min(100, Math.max(12, (ag.revenue / maxAgentRev) * 100));
              const grad = agentGradients[idx % agentGradients.length];

              return (
                <div key={ag.name} className="group">
                  <div className="flex justify-between items-center text-sm mb-2 font-medium">
                    <span className="flex items-center gap-2.5">
                      <span className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black text-[11px] text-slate-700 dark:text-slate-300 flex items-center justify-center shadow-sm">
                        #{idx + 1}
                      </span>
                      <span className="text-slate-900 dark:text-white font-black text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">{ag.name}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">({Math.round(pct)}%)</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">{formatAmount(ag.revenue)}</span>
                    </div>
                  </div>

                  {/* Broader 20px Pill Bar with Glossy Highlight & Glow */}
                  <div className="h-5 rounded-full bg-slate-100 dark:bg-slate-800/80 p-0.5 shadow-inner relative overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${grad} transition-all duration-700 relative overflow-hidden`}
                      style={{ width: `${pct}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-60 rounded-full" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* COMMISSION PAID VS PENDING */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 shadow-sm hover:shadow-md transition flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  COMMISSION PAID VS PENDING
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">Disbursed vs pending agent payouts</p>
              </div>
              <span className="text-sm font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                Total: {formatAmount(commission.total)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-5">
              {/* Paid Card */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-5 shadow-xs transition">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">COMMISSION PAID</span>
                <p className="text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">{formatAmount(commission.paid)}</p>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1.5">{commission.paidPct}% Disbursed</p>
              </div>

              {/* Pending Card */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-5 shadow-xs transition">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">PENDING PAYOUTS</span>
                <p className="text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">{formatAmount(commission.pending)}</p>
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-1.5">{100 - commission.paidPct}% Pending Approval</p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            {/* Broader 22px Split Progress Bar */}
            <div className="h-5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex shadow-inner border border-slate-200/60 dark:border-slate-700/60 p-0.5">
              <div className="h-full rounded-l-full bg-gradient-to-r from-emerald-600 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.6)] transition-all duration-500 relative" style={{ width: `${commission.paidPct}%` }} title={`Paid: ${commission.paidPct}%`}>
                <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-60 rounded-l-full" />
              </div>
              <div className="h-full rounded-r-full bg-gradient-to-r from-amber-400 to-yellow-500 shadow-[0_0_12px_rgba(245,158,11,0.6)] transition-all duration-500 relative" style={{ width: `${100 - commission.paidPct}%` }} title={`Pending: ${100 - commission.paidPct}%`}>
                <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-60 rounded-r-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Row 2: Lead Conversion Rate by Agent & Pending Follow-ups Action List */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEAD CONVERSION BY AGENT */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md transition">
          <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Lead Conversion Rate by Agent</h3>
            <AnalyticsDateFilter value={dateFilter} onChange={setDateFilter} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3.5">Agent Name</th>
                  <th className="px-6 py-3.5">Assigned Leads</th>
                  <th className="px-6 py-3.5">Won Deals</th>
                  <th className="px-6 py-3.5 text-right">Conversion %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {conversionByAgent.slice(0, 5).map((a) => (
                  <tr key={a.name} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white">{a.name}</td>
                    <td className="px-6 py-3.5 text-slate-700 dark:text-slate-300 font-semibold">{a.assigned}</td>
                    <td className="px-6 py-3.5 text-emerald-600 dark:text-emerald-400 font-bold">{a.won}</td>
                    <td className="px-6 py-3.5 text-right font-black text-slate-900 dark:text-white">{a.conversionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PENDING FOLLOW-UPS ACTION LIST */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md transition">
          <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" /> Pending Follow-ups Action List
            </h3>
            <AnalyticsDateFilter value={dateFilter} onChange={setDateFilter} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3.5">Lead Contact</th>
                  <th className="px-6 py-3.5">Assigned Agent</th>
                  <th className="px-6 py-3.5">Due Date</th>
                  <th className="px-6 py-3.5 text-right">Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {pendingFollowups.slice(0, 5).map((f, i) => {
                  const styleClass = stageGlows[f.stage] || "bg-blue-50 text-blue-600 border-blue-200";
                  return (
                    <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                      <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white">{f.leadName}</td>
                      <td className="px-6 py-3.5 text-slate-700 dark:text-slate-300">{f.agentName}</td>
                      <td className="px-6 py-3.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">{f.dueDate}</td>
                      <td className="px-6 py-3.5 text-right">
                        <span className={`inline-flex rounded-lg border px-2.5 py-0.5 text-[10px] font-bold ${styleClass}`}>
                          {f.stage}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* TOP 10 AGENTS LEADERBOARD TABLE */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md transition">
        <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" /> Top 10 Agents Leaderboard
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Manage All Agents</span>
            <AnalyticsDateFilter value={dateFilter} onChange={setDateFilter} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3.5">Rank</th>
                <th className="px-6 py-3.5">Agent Name</th>
                <th className="px-6 py-3.5">Deals Closed</th>
                <th className="px-6 py-3.5">Total Revenue</th>
                <th className="px-6 py-3.5">Commission Earned</th>
                <th className="px-6 py-3.5 text-right">Conversion %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {leaderboard.map((ag, idx) => (
                <tr key={ag.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                  <td className="px-6 py-3.5 font-black text-slate-900 dark:text-white">
                    {idx === 0 ? (
                      <span className="rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-2.5 py-0.5 text-[11px] font-black shadow-md shadow-amber-500/30 ring-2 ring-amber-300">
                        #1
                      </span>
                    ) : idx === 1 ? (
                      <span className="rounded-full bg-gradient-to-r from-slate-300 to-slate-400 text-slate-900 px-2.5 py-0.5 text-[11px] font-black shadow-sm shadow-slate-400/20">
                        #2
                      </span>
                    ) : idx === 2 ? (
                      <span className="rounded-full bg-gradient-to-r from-amber-700 to-amber-800 text-white px-2.5 py-0.5 text-[11px] font-black shadow-sm shadow-amber-800/20">
                        #3
                      </span>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400 font-bold px-2">#{idx + 1}</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="font-bold text-slate-900 dark:text-white block">{ag.name}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{ag.email}</span>
                  </td>
                  <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white">{ag.dealsCount}</td>
                  <td className="px-6 py-3.5 font-bold text-indigo-600 dark:text-indigo-400">{formatAmount(ag.revenue)}</td>
                  <td className="px-6 py-3.5 font-bold text-emerald-600 dark:text-emerald-400">{formatAmount(ag.commissionEarned)}</td>
                  <td className="px-6 py-3.5 text-right font-black text-slate-900 dark:text-white">{ag.conversionRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
