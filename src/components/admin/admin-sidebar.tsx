"use client";

import {
  BarChart3,
  Building2,
  Calendar,
  CalendarCheck,
  CreditCard,
  CircleDollarSign,
  FileCheck,
  KanbanSquare,
  Landmark,
  LayoutDashboard,
  LineChart,
  List,
  Mail,
  MessageCircle,
  MessageSquare,
  Package,
  Percent,
  Plug,
  Send,
  Settings,
  Users,
  Workflow,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };
type NavGroup = { title: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    title: "Dashboard",
    items: [{ href: "/admin", label: "Overview", icon: LayoutDashboard }],
  },
  {
    title: "People",
    items: [
      { href: "/admin/users", label: "Users & accounts", icon: Users },
      { href: "/admin/developers", label: "Developers", icon: Package },
      { href: "/admin/kyc", label: "KYC verification", icon: FileCheck },
    ],
  },
  {
    title: "Listings",
    items: [
      { href: "/admin/properties", label: "Properties", icon: Building2 },
    ],
  },
  {
    title: "Sales & CRM",
    items: [
      { href: "/admin/leads", label: "All leads", icon: List },
      { href: "/admin/crm", label: "Pipeline", icon: KanbanSquare },
      { href: "/admin/inquiries", label: "Inquiries", icon: MessageSquare },
      { href: "/admin/showings", label: "Site visits", icon: CalendarCheck },
      { href: "/admin/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    title: "Finance",
    items: [
      { href: "/admin/billing", label: "Billing & subscriptions", icon: CircleDollarSign },
      { href: "/admin/transactions", label: "Transactions", icon: CreditCard },
      { href: "/admin/wallets", label: "Wallets", icon: Landmark },
      { href: "/admin/trades", label: "Trade History", icon: LineChart },
      { href: "/admin/payouts", label: "Payouts", icon: CircleDollarSign },
      { href: "/admin/payments", label: "Payment Methods", icon: CreditCard },
      { href: "/admin/loans", label: "Loans", icon: Landmark },
      { href: "/admin/bookings/invoices", label: "Invoices", icon: Workflow },
      { href: "/admin/rates", label: "Rates", icon: Percent },
    ],
  },
  {
    title: "Communications",
    items: [
      { href: "/admin/communications", label: "Hub", icon: MessageSquare },
      { href: "/admin/whatsapp", label: "WhatsApp Hub", icon: MessageCircle },
      { href: "/admin/messages", label: "Send message", icon: Send },
      { href: "/admin/meetings", label: "Meetings", icon: Calendar },
      { href: "/admin/emails", label: "Email log", icon: Mail },
    ],
  },
  {
    title: "Settings",
    items: [
      { href: "/admin/platform", label: "Platform", icon: Settings },
      { href: "/admin/integrations", label: "Integrations", icon: Plug },
      { href: "/admin/settings", label: "System status", icon: Settings },
      { href: "/markets", label: "Live markets", icon: LineChart },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  if (href === "/markets") return pathname.startsWith("/markets");
  if (href === "/admin/reports") return pathname.startsWith("/admin/reports");
  return pathname === href || pathname.startsWith(href + "/");
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Floating Hamburger Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gold shadow-lg text-slate-900 md:hidden hover:bg-gold-dark transition focus:outline-none"
        title="Toggle Admin Menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-full w-64 flex-col border-r border-slate-800 bg-slate-950 text-white transition-transform duration-300 ease-in-out",
          "md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="border-b border-slate-800 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gold">PlotsnHomes</p>
          <p className="font-display text-lg font-bold mt-0.5">Admin Console</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-6">
          {NAV.map((group) => (
            <div key={group.title}>
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
                        active
                          ? "bg-gold text-slate-900"
                          : "text-slate-400 hover:bg-slate-800 hover:text-white"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-4">
          <Link
            href="/dashboard"
            onClick={() => setIsOpen(false)}
            className="text-xs text-slate-500 hover:text-gold"
          >
            ← Exit admin
          </Link>
        </div>
      </aside>
    </>
  );
}
