"use client";

import {
  BarChart3,
  Building2,
  Building,
  Calendar,
  CalendarCheck,
  CreditCard,
  ClipboardList,
  Crown,
  CircleDollarSign,
  FileCheck,
  GitFork,
  KanbanSquare,
  Landmark,
  LayoutDashboard,
  LineChart,
  List,
  ListFilter,
  Mail,
  MessageCircle,
  MessageSquare,
  Package,
  Percent,
  Plug,
  Send,
  Settings,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Tag,
  TrendingUp,
  UserCheck,
  Users,
  Users2,
  Workflow,
  Menu,
  X,
  FolderTree,
  FolderKanban,
  Palette,
  GripVertical,
  RotateCcw,
  History,
  Globe,
  Layout,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { PERMISSIONS_SCHEMA, RolePermissionsConfig, PermissionGroup } from "@/lib/permissions";
import { AdminCurrencySelector } from "@/components/admin/admin-currency-context";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };
type NavGroup = { title: string; items: NavItem[] };

const DEFAULT_NAV: NavGroup[] = [
  {
    title: "Dashboard",
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard },
      { href: "/admin/logs", label: "Logs", icon: History },
    ],
  },
  {
    title: "People",
    items: [
      { href: "/admin/users", label: "Users & accounts", icon: Users },
      { href: "/admin/platform/users", label: "Platform users", icon: Users },
      { href: "/admin/whatsapp/settings", label: "WhatsApp settings", icon: MessageSquare },
      { href: "/admin/teams", label: "Teams", icon: Users2 },
      { href: "/admin/hierarchy", label: "Team hierarchy", icon: GitFork },
      { href: "/admin/organization", label: "Organizations & Franchises", icon: Building2 },
      { href: "/admin/developers", label: "Developers", icon: Package },
      { href: "/admin/kyc", label: "KYC verification", icon: FileCheck },
    ],
  },
  {
    title: "Listings",
    items: [
      { href: "/admin/projects", label: "Projects", icon: FolderKanban },
      { href: "/admin/properties", label: "Properties", icon: Building2 },
      { href: "/admin/price-history", label: "Price History", icon: TrendingUp },
      { href: "/admin/categories", label: "Categories", icon: FolderTree },
    ],
  },
  {
    title: "Sales & CRM",
    items: [
      { href: "/admin/leads", label: "All leads", icon: List },
      { href: "/admin/whatsapp/inbox", label: "WhatsApp inbox", icon: MessageSquare },
      { href: "/admin/crm", label: "Pipeline", icon: KanbanSquare },
      { href: "/admin/inquiries", label: "Inquiries", icon: MessageSquare },
      { href: "/admin/showings", label: "Site visits", icon: CalendarCheck },
      { href: "/admin/reports", label: "Reports", icon: BarChart3 },
      { href: "/admin/form-registrations", label: "Form Registrations", icon: ClipboardList },
    ],
  },
  {
    title: "Finance",
    items: [
      { href: "/admin/pricing", label: "Pricing & Shares", icon: CircleDollarSign },
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
      { href: "/admin/variables-templates", label: "Variables & Templates", icon: SlidersHorizontal },
      { href: "/admin/messages", label: "Send message", icon: Send },
      { href: "/admin/meetings", label: "Meetings", icon: Calendar },
      { href: "/admin/emails", label: "Email log", icon: Mail },
      { href: "/admin/emails/hub", label: "Email Hub", icon: Mail },
    ],
  },
  {
    title: "Settings",
    items: [
      { href: "/admin/settings/frontend", label: "Frontend Settings", icon: Palette },
      { href: "/admin/platform", label: "Platform", icon: Settings },
      { href: "/admin/integrations", label: "Integrations", icon: Plug },
      { href: "/admin/integrations/lead-channels", label: "Lead Channels", icon: Workflow },
    ],
  },
  {
    title: "Other settings",
    items: [
      { href: "/admin/settings/roles", label: "Roles & permissions", icon: ShieldCheck },
      { href: "/admin/settings/dropdowns", label: "Dropdown options", icon: ListFilter },
      { href: "/admin/settings/project-defaults", label: "Project Defaults", icon: SlidersHorizontal },
      { href: "/admin/settings/analytics-integration", label: "Analytics Integration", icon: Plug },
      { href: "/admin/settings/webpage-editor", label: "Webpage Editor", icon: Globe },
      { href: "/admin/settings/footer", label: "Footer", icon: Layout },
      { href: "/admin/variables-templates", label: "Variables & Templates", icon: SlidersHorizontal },
      { href: "/admin/settings/white-label", label: "White-Label & Subscription Hub", icon: Crown },
      { href: "/admin/settings", label: "System status", icon: Settings },
      { href: "/markets", label: "Live markets", icon: LineChart },
    ],
  },
];

// Helper to look up icon components by href
const ALL_NAV_ITEMS: Record<string, { label: string; icon: typeof LayoutDashboard }> = {};
DEFAULT_NAV.forEach((g) => {
  g.items.forEach((item) => {
    ALL_NAV_ITEMS[item.href] = { label: item.label, icon: item.icon };
  });
});

const STORAGE_KEY = "plotsnhomes_admin_sidebar_layout_v12";

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  if (href === "/markets") return pathname.startsWith("/markets");
  if (href === "/admin/reports") return pathname.startsWith("/admin/reports");
  
  if (href === "/admin/settings") return pathname === "/admin/settings";
  if (href === "/admin/emails") return pathname === "/admin/emails";
  
  return pathname === href || pathname.startsWith(href + "/");
}

export function AdminSidebar({
  permissions,
  userGroup,
  userRole,
}: {
  permissions: RolePermissionsConfig;
  userGroup: PermissionGroup;
  userRole: string;
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [navState, setNavState] = useState<NavGroup[]>(DEFAULT_NAV);

  // Drag & Drop State
  const [draggedItem, setDraggedItem] = useState<{ groupTitle: string; itemHref: string } | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{ groupTitle: string; itemIndex?: number } | null>(null);

  // Load layout from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: { title: string; itemHrefs: string[] }[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validGroupTitles = new Set(DEFAULT_NAV.map((g) => g.title));
          const seenHrefs = new Set<string>();

          const reconstructed: NavGroup[] = parsed
            .filter((grp) => validGroupTitles.has(grp.title))
            .map((grp) => ({
              title: grp.title,
              items: grp.itemHrefs
                .filter((href) => {
                  if (grp.title !== "Dashboard" && href === "/admin/logs") return false;
                  if (seenHrefs.has(href)) return false;
                  seenHrefs.add(href);
                  return true;
                })
                .map((href) => (ALL_NAV_ITEMS[href] ? { href, ...ALL_NAV_ITEMS[href] } : null))
                .filter(Boolean) as NavItem[],
            }));

          // Catch any missing items from default NAV and append to original group
          DEFAULT_NAV.forEach((defGrp) => {
            let targetGroup = reconstructed.find((g) => g.title === defGrp.title);
            if (!targetGroup) {
              targetGroup = { title: defGrp.title, items: [] };
              reconstructed.push(targetGroup);
            }
            defGrp.items.forEach((defItem) => {
              if (!seenHrefs.has(defItem.href)) {
                seenHrefs.add(defItem.href);
                targetGroup!.items.push(defItem);
              }
            });
          });

          // Ensure /admin/logs is in Dashboard group
          const dashGroup = reconstructed.find((g) => g.title === "Dashboard");
          if (dashGroup && !dashGroup.items.some((i) => i.href === "/admin/logs")) {
            dashGroup.items.push({ href: "/admin/logs", label: "Logs", icon: History });
          }

          setNavState(reconstructed);
        }
      } catch (e) {}
    }
  }, []);

  // Save layout state helper
  const saveLayout = (newLayout: NavGroup[]) => {
    setNavState(newLayout);
    try {
      const serializable = newLayout.map((grp) => ({
        title: grp.title,
        itemHrefs: grp.items.map((i) => i.href),
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
    } catch (e) {}
  };

  const handleResetLayout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setNavState(DEFAULT_NAV);
  };

  const hasItemPermission = (href: string) => {
    if (userRole === "SUPERADMIN") return true;

    let bestMatch: any = null;
    for (const head of PERMISSIONS_SCHEMA) {
      for (const subhead of head.subheads) {
        if (subhead.route === "/admin") {
          if (href === "/admin") {
            bestMatch = subhead;
          }
        } else if (href === subhead.route || href.startsWith(subhead.route + "/")) {
          if (!bestMatch || subhead.route.length > bestMatch.route.length) {
            bestMatch = subhead;
          }
        }
      }
    }

    const permissionKey = bestMatch ? bestMatch.key : null;
    if (!permissionKey) return true;
    const perm = permissions[userGroup]?.[permissionKey];
    if (typeof perm === "object" && perm !== null) {
      return perm.view;
    }
    return Boolean(perm);
  };

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, groupTitle: string, itemHref: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", JSON.stringify({ groupTitle, itemHref }));
    setDraggedItem({ groupTitle, itemHref });
  };

  const handleDragOverGroup = (e: React.DragEvent, groupTitle: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverTarget?.groupTitle !== groupTitle || dragOverTarget?.itemIndex !== undefined) {
      setDragOverTarget({ groupTitle });
    }
  };

  const handleDragOverItem = (e: React.DragEvent, groupTitle: string, itemIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    if (dragOverTarget?.groupTitle !== groupTitle || dragOverTarget?.itemIndex !== itemIndex) {
      setDragOverTarget({ groupTitle, itemIndex });
    }
  };

  const handleDrop = (e: React.DragEvent, targetGroupTitle: string, targetItemIndex?: number) => {
    e.preventDefault();
    e.stopPropagation();

    let fromGroupTitle = draggedItem?.groupTitle;
    let itemHref = draggedItem?.itemHref;

    if (!itemHref) {
      try {
        const raw = e.dataTransfer.getData("text/plain");
        if (raw) {
          const parsed = JSON.parse(raw);
          fromGroupTitle = parsed.groupTitle;
          itemHref = parsed.itemHref;
        }
      } catch (err) {}
    }

    if (!itemHref || !fromGroupTitle) {
      setDraggedItem(null);
      setDragOverTarget(null);
      return;
    }

    // Clone navState
    const updatedNav: NavGroup[] = navState.map((g) => ({
      title: g.title,
      items: [...g.items],
    }));

    // Find source group & item
    const sourceGroup = updatedNav.find((g) => g.title === fromGroupTitle);
    if (!sourceGroup) return;

    const sourceItemIndex = sourceGroup.items.findIndex((i) => i.href === itemHref);
    if (sourceItemIndex < 0) return;

    const [draggedNavItem] = sourceGroup.items.splice(sourceItemIndex, 1);

    // Find target group
    const targetGroup = updatedNav.find((g) => g.title === targetGroupTitle);
    if (targetGroup) {
      if (targetItemIndex !== undefined && targetItemIndex >= 0) {
        targetGroup.items.splice(targetItemIndex, 0, draggedNavItem);
      } else {
        targetGroup.items.push(draggedNavItem);
      }
    }

    saveLayout(updatedNav);
    setDraggedItem(null);
    setDragOverTarget(null);
  };

  const filteredNav = navState.map((group) => {
    const items = group.items
      .filter((item) => hasItemPermission(item.href))
      .filter((item) => item.label.toLowerCase().includes(searchQuery.toLowerCase()));
    return { ...group, items };
  }).filter((group) => group.items.length > 0 || searchQuery.length === 0);

  return (
    <>
      {/* Mobile Floating Hamburger Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-brand shadow-lg text-white md:hidden hover:bg-brand-hover transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        aria-label={isOpen ? "Close admin menu" : "Open admin menu"}
        aria-expanded={isOpen}
        title="Toggle Admin Menu"
      >
        {isOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
      </button>

      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-screen w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950 text-white transition-transform duration-300 ease-in-out",
          "md:fixed md:top-0 md:bottom-0 md:left-0 md:z-40 md:h-screen md:w-64 md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="border-b border-slate-800 p-5 shrink-0 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-300">PlotsnHomes</p>
            <p className="font-display text-lg font-bold mt-0.5 text-white">Admin Console</p>
          </div>
          <button
            type="button"
            onClick={handleResetLayout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-900 transition flex items-center gap-1 text-[10px] font-medium"
            aria-label="Reset menu order"
            title="Reset menu order"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="px-3 pt-4 pb-2 shrink-0 flex items-center gap-2">
          <input
            type="text"
            placeholder="Search settings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition focus:border-brand"
          />
        </div>

        <nav aria-label="Admin navigation" className="flex-1 min-h-0 overflow-y-auto p-3 space-y-6">
          {filteredNav.length === 0 && (
            <p className="px-3 text-xs text-slate-500">No settings found.</p>
          )}

          {filteredNav.map((group) => {
            const isGroupDragOver = dragOverTarget?.groupTitle === group.title && dragOverTarget?.itemIndex === undefined;

            return (
              <div
                key={group.title}
                onDragOver={(e) => handleDragOverGroup(e, group.title)}
                onDrop={(e) => handleDrop(e, group.title)}
                className={cn(
                  "rounded-xl p-1.5 transition-all duration-150 border border-transparent",
                  isGroupDragOver && "border-dashed border-brand/80 bg-brand/20 shadow-sm"
                )}
              >
                <div className="flex items-center justify-between px-2 mb-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {group.title}
                  </p>
                  <span className="text-[9px] font-mono text-slate-600 font-normal">
                    {group.items.length}
                  </span>
                </div>

                <div className="space-y-1 min-h-[32px]">
                  {group.items.length === 0 && (
                    <div className="h-8 rounded-lg border border-dashed border-slate-800/80 flex items-center justify-center text-[10px] text-slate-600 italic">
                      Drop menu items here
                    </div>
                  )}

                  {group.items.map((item, idx) => {
                    const active = isActive(pathname, item.href);
                    const Icon = item.icon;
                    const isDraggingThis = draggedItem?.itemHref === item.href;
                    const isItemDragOver = dragOverTarget?.groupTitle === group.title && dragOverTarget?.itemIndex === idx;

                    return (
                      <div
                        key={item.href}
                        draggable
                        onDragStart={(e) => handleDragStart(e, group.title, item.href)}
                        onDragOver={(e) => handleDragOverItem(e, group.title, idx)}
                        onDrop={(e) => handleDrop(e, group.title, idx)}
                        className={cn(
                          "group relative transition-all rounded-lg",
                          isDraggingThis && "opacity-40 scale-95 border border-dashed border-amber-500",
                          isItemDragOver && "ring-2 ring-brand/80 bg-brand/20"
                        )}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition cursor-grab active:cursor-grabbing",
                            active
                              ? "bg-brand text-white"
                              : "text-slate-400 hover:bg-slate-800 hover:text-white"
                          )}
                        >
                          <GripVertical className="h-3.5 w-3.5 text-slate-600 group-hover:text-slate-400 shrink-0 transition" />
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-4 space-y-3 shrink-0">
          <Link
            href="/dashboard"
            onClick={() => setIsOpen(false)}
            className="text-xs text-slate-500 hover:text-indigo-300 block"
          >
            ← Exit admin
          </Link>
          <AdminCurrencySelector />
        </div>
      </aside>
    </>
  );
}
