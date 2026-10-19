import { Clock, Inbox, Target, TrendingUp, Users } from "lucide-react";
import Link from "next/link";

function buildLinks(agentMode: boolean, isAdmin: boolean) {
  if (agentMode) {
    const base = "/dashboard/crm";
    return {
      total: `${base}?view=list`,
      active: `${base}?active=1&view=list`,
      won: `${base}?stage=WON&view=list`,
      overdue: `${base}?overdue=1&view=list`,
      inquiries: isAdmin ? "/admin/inquiries" : undefined,
      showings: isAdmin ? "/admin/showings" : undefined,
    };
  }
  return {
    total: "/admin/leads",
    active: "/admin/leads?list=active_pipeline",
    won: "/admin/leads?list=won_deals",
    overdue: "/admin/leads?list=missed_followups",
    inquiries: "/admin/inquiries",
    showings: "/admin/showings",
  };
}

export function CrmKpiStrip({
  total,
  active,
  won,
  overdue,
  newInquiries,
  pendingShowings,
  agentMode = false,
  isAdmin = false,
}: {
  total: number;
  active: number;
  won: number;
  overdue: number;
  newInquiries: number;
  pendingShowings: number;
  agentMode?: boolean;
  isAdmin?: boolean;
}) {
  const conversion = total > 0 ? Math.round((won / total) * 100) : 0;
  const links = buildLinks(agentMode, isAdmin);

  const items = [
    { label: "Total leads", value: total, icon: Users, href: links.total },
    { label: "Active pipeline", value: active, icon: Target, href: links.active },
    {
      label: "Won deals",
      value: won,
      sub: `${conversion}% win rate`,
      icon: TrendingUp,
      href: links.won,
    },
    {
      label: "Overdue follow-ups",
      value: overdue,
      icon: Clock,
      href: links.overdue,
      alert: overdue > 0,
    },
    {
      label: "New inquiries",
      value: newInquiries,
      icon: Inbox,
      href: links.inquiries,
    },
    {
      label: "Site visits pending",
      value: pendingShowings,
      icon: Inbox,
      href: links.showings,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-6">
      {items.map((item) => {
        const Icon = item.icon;
        const inner = (
          <div
            className={`rounded-2xl border p-4 h-full transition group ${
              item.href ? "cursor-pointer hover:shadow-md hover:border-brand/50" : ""
            } ${item.alert ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-slate-500">{item.label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{item.value}</p>
                {item.sub && <p className="text-[11px] text-slate-500 mt-0.5">{item.sub}</p>}
                {item.href && (
                  <p className="mt-2 text-[11px] font-medium text-brand-hover opacity-0 group-hover:opacity-100 transition">
                    View {item.value} leads →
                  </p>
                )}
              </div>
              <div className={`rounded-lg p-2 ${item.alert ? "bg-red-100" : "bg-slate-100"}`}>
                <Icon className={`h-4 w-4 ${item.alert ? "text-red-600" : "text-brand-hover"}`} />
              </div>
            </div>
          </div>
        );
        return item.href ? (
          <Link key={item.label} href={item.href} className="block">
            {inner}
          </Link>
        ) : (
          <div key={item.label}>{inner}</div>
        );
      })}
    </div>
  );
}
