import { Users, TrendingUp, Clock, Inbox } from "lucide-react";
import Link from "next/link";

export function CrmDashboardStats({
  total,
  active,
  won,
  overdue,
  newInquiries,
  pendingShowings,
}: {
  total: number;
  active: number;
  won: number;
  overdue: number;
  newInquiries: number;
  pendingShowings: number;
}) {
  const conversion = total > 0 ? Math.round((won / total) * 100) : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
      <Stat icon={Users} label="Total leads" value={String(total)} />
      <Stat icon={TrendingUp} label="Active pipeline" value={String(active)} />
      <Stat icon={TrendingUp} label="Won" value={String(won)} sub={`${conversion}% conv.`} />
      <Stat icon={Clock} label="Overdue" value={String(overdue)} alert={overdue > 0} />
      <Link href="/admin/inquiries" className="block">
        <Stat icon={Inbox} label="New inquiries" value={String(newInquiries)} href />
      </Link>
      <Link href="/admin/showings" className="block">
        <Stat icon={Inbox} label="Site visits" value={String(pendingShowings)} href />
      </Link>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  alert,
  href,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  sub?: string;
  alert?: boolean;
  href?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${alert ? "border-red-200 bg-red-50" : "bg-white"} ${href ? "hover:border-brand transition" : ""}`}
    >
      <Icon className={`h-5 w-5 ${alert ? "text-red-600" : "text-brand-hover"}`} />
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}
