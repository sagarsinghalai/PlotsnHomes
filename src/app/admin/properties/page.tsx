import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { PropertiesTable } from "@/components/admin/properties-table";
import { prisma } from "@/lib/prisma";

export default async function AdminPropertiesPage() {
  const [properties, total, active] = await Promise.all([
    prisma.property.findMany({
      orderBy: { createdAt: "desc" },
      take: 300,
      select: {
        id: true,
        symbol: true,
        title: true,
        slug: true,
        price: true,
        yieldRate: true,
        interestRate: true,
        change24h: true,
        changeYtd: true,
        marketRating: true,
        city: true,
        status: true,
      },
    }),
    prisma.property.count(),
    prisma.property.count({ where: { status: "ACTIVE" } }),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="Properties"
        description={`${active} active · ${total} total listings — edit prices, photos, and market data`}
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Properties" }]}
        actions={
          <Link
            href="/admin/properties/new"
            className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-gold-dark"
          >
            <Plus className="h-4 w-4" />
            Add property
          </Link>
        }
      />

      <PropertiesTable properties={properties} />
    </div>
  );
}
