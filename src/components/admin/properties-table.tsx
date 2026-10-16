"use client";

import { Pencil, Trash2, Search, Filter, LayoutGrid, List, ChevronDown, ChevronUp, Eye, Building2, MapPin, TrendingUp, Percent, Plus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { changeColor } from "@/lib/market";
import { formatCurrency } from "@/lib/utils";
import { TableToolbarManager } from "@/components/ui/table-toolbar-manager";
import { useHorizontalScroll } from "@/hooks/use-horizontal-scroll";
import { TableScrollButtons } from "@/components/ui/table-scroll-buttons";
import { useTableColumns, useCustomCellData } from "@/hooks/use-table-columns";
import { EditableCell } from "@/components/ui/editable-cell";

import { useAdminPermissions } from "@/components/admin/admin-permissions-context";

type Row = {
  id: string;
  symbol: string;
  title: string;
  slug: string;
  price: number;
  yieldRate: number;
  interestRate: number;
  change24h: number;
  change7d?: number;
  change1m?: number;
  change6m?: number;
  changeYtd: number;
  marketRating: string;
  city: string;
  status: string;
  images?: string;
};

export function PropertiesTable({ properties }: { properties: Row[] }) {
  const router = useRouter();
  const { hasAddPermission, hasEditPermission, hasDeletePermission } = useAdminPermissions();
  const canAdd = hasAddPermission("/admin/properties");
  const canEdit = hasEditPermission("/admin/properties");
  const canDelete = hasDeletePermission("/admin/properties");

  const [busy, setBusy] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [cityFilter, setCityFilter] = useState("ALL");
  const [showAllTable, setShowAllTable] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const { getCellValue, updateCell } = useCustomCellData("properties_table");
  const {
    columns,
    visibleColumnIds,
    toggleColumn,
    addCustomColumn,
    updateCustomColumn,
    removeCustomColumn,
    resetColumns,
    isColumnVisible,
  } = useTableColumns("properties_table", [
    { id: "symbol", label: "Symbol", defaultVisible: true },
    { id: "title", label: "Title", defaultVisible: true },
    { id: "price", label: "Price", defaultVisible: true },
    { id: "yield", label: "Yield", defaultVisible: true },
    { id: "interest", label: "Interest", defaultVisible: true },
    { id: "24h", label: "24h", defaultVisible: true },
    { id: "ytd", label: "YTD", defaultVisible: true },
    { id: "rating", label: "Rating", defaultVisible: true },
    { id: "city", label: "City", defaultVisible: true },
    { id: "status", label: "Status", defaultVisible: true },
    { id: "actions", label: "Actions", defaultVisible: true },
  ]);

  // Get unique cities for filter dropdown
  const cities = useMemo(() => {
    const set = new Set(properties.map((p) => p.city).filter(Boolean));
    return Array.from(set).sort();
  }, [properties]);

  // Filtered properties based on search and filters
  const filtered = useMemo(() => {
    return properties.filter((p) => {
      const matchSearch =
        search === "" ||
        p.symbol.toLowerCase().includes(search.toLowerCase()) ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.city.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
      const matchCity = cityFilter === "ALL" || p.city === cityFilter;

      return matchSearch && matchStatus && matchCity;
    });
  }, [properties, search, statusFilter, cityFilter]);

  // First 6 featured cards
  const firstSix = filtered.slice(0, 6);

  const { ref: tableScrollRef, canScrollLeft, canScrollRight, scroll } = useHorizontalScroll([
    filtered,
    visibleColumnIds,
    viewMode,
  ]);

  const hasActiveFilters = search !== "" || statusFilter !== "ALL" || cityFilter !== "ALL";
  const clearAllFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setCityFilter("ALL");
  };

  async function remove(id: string, symbol: string) {
    if (!confirm(`Delete property ${symbol}? All inquiries and transactions for it will be removed.`)) {
      return;
    }
    setBusy(id);
    const res = await fetch(`/api/admin/properties/${id}`, { method: "DELETE" });
    setBusy(null);
    if (!res.ok) {
      alert("Failed to delete property.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <TableToolbarManager
        tableTitle="Properties Directory"
        addRowLabel={canAdd ? "Add Property" : undefined}
        onAddRow={canAdd ? () => router.push("/admin/properties/new") : undefined}
        columns={columns}
        visibleColumnIds={visibleColumnIds}
        onToggleColumn={toggleColumn}
        onAddCustomColumn={addCustomColumn}
        onRemoveCustomColumn={removeCustomColumn}
        onResetColumns={resetColumns}
      />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search by Symbol (e.g. LON-001), Title, City..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-gold"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={clearAllFilters}
            disabled={!hasActiveFilters}
            title={hasActiveFilters ? "Clear all filters" : "No filters applied"}
            className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl border text-xs font-bold transition shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed ${
              hasActiveFilters
                ? "border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
                : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
            }`}
          >
            <X className="h-4 w-4 stroke-[2.5]" /> Clear All
          </button>

          {viewMode === "table" && (
            <TableScrollButtons
              canScrollLeft={canScrollLeft}
              canScrollRight={canScrollRight}
              onScroll={scroll}
            />
          )}

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("cards")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                viewMode === "cards" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5 inline mr-1" /> Cards View
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                viewMode === "table" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <List className="h-3.5 w-3.5 inline mr-1" /> Table View
            </button>
          </div>
        </div>
      </div>

      {/* Cards View */}
      {viewMode === "cards" && (
        <div className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {firstSix.map((p) => {
              let imgUrl = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80";
              try {
                const parsed = typeof p.images === "string" ? JSON.parse(p.images) : p.images;
                if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "string" && parsed[0]) {
                  imgUrl = parsed[0];
                }
              } catch (e) {}

              return (
                <div
                  key={p.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:border-amber-500/50 hover:shadow-md transition duration-200"
                >
                  <div>
                    {/* Property Cover Image Header */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img
                        src={imgUrl}
                        alt={p.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

                      {/* Badges on Image */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-slate-900/90 text-white border border-white/20 backdrop-blur-md shadow-xs">
                          {p.symbol}
                        </span>
                        <span className="inline-flex rounded-full bg-emerald-500/90 text-white backdrop-blur-xs px-2.5 py-0.5 text-xs font-bold shadow-xs">
                          {p.status}
                        </span>
                      </div>
                    </div>

                    {/* Details Section */}
                    <div className="p-5">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                        {p.title}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {p.city}
                      </p>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Price</p>
                          <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5" suppressHydrationWarning>
                            {formatCurrency(p.price)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Yield</p>
                          <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                            {(() => {
                              const preRate = (p as any).preLaunchRate;
                              const cRate = (p as any).pricePerSqft || ((p as any).sqft ? p.price / (p as any).sqft : 0);
                              const calculated = preRate && cRate > 0 ? ((cRate - preRate) / preRate) * 100 : p.yieldRate;
                              return calculated.toFixed(2);
                            })()}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {canEdit && (
                          <Link
                            href={`/admin/properties/${p.id}/edit`}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white hover:bg-slate-100 transition"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </Link>
                        )}
                        <Link
                          href={`/properties/${p.slug}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 px-2 py-1"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </Link>
                      </div>
                      {canDelete && (
                        <Button
                          variant="danger"
                          className="!px-2.5 !py-1.5 text-xs font-bold"
                          disabled={busy === p.id}
                          onClick={() => remove(p.id, p.symbol)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length > 6 && (
            <div className="text-center pt-2">
              <Button
                variant="secondary"
                onClick={() => setViewMode("table")}
                className="gap-2 text-xs font-bold border-slate-300"
              >
                <span>View All {filtered.length} Properties in Table</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div ref={tableScrollRef} className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-left text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                {isColumnVisible("symbol") && <th className="px-4 py-3.5">Symbol</th>}
                {isColumnVisible("title") && <th className="px-4 py-3.5">Title</th>}
                {isColumnVisible("price") && <th className="px-4 py-3.5">Price</th>}
                {isColumnVisible("yield") && <th className="px-4 py-3.5">Yield</th>}
                {isColumnVisible("interest") && <th className="px-4 py-3.5">Interest</th>}
                {isColumnVisible("24h") && <th className="px-4 py-3.5">24h</th>}
                {isColumnVisible("ytd") && <th className="px-4 py-3.5">YTD</th>}
                {isColumnVisible("rating") && <th className="px-4 py-3.5">Rating</th>}
                {isColumnVisible("city") && <th className="px-4 py-3.5">City</th>}
                {isColumnVisible("status") && <th className="px-4 py-3.5">Status</th>}
                {columns.filter((c) => c.isCustom && isColumnVisible(c.id)).map((c) => (
                  <th key={c.id} className="px-4 py-3.5 text-amber-700 font-mono">{c.label}</th>
                ))}
                {isColumnVisible("actions") && <th className="px-4 py-3.5 text-right">Actions</th>}
                <th className="px-3 py-3.5 text-center w-12 border-l border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      const btn = document.querySelector('[data-column-manager-btn]') as HTMLButtonElement;
                      if (btn) btn.click();
                    }}
                    className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold hover:bg-slate-100 dark:hover:bg-slate-700 shadow-xs transition"
                    title="Add / Customize Columns & Fields"
                  >
                    <Plus className="h-4 w-4 stroke-[2.5]" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                  {isColumnVisible("symbol") && <td className="px-4 py-3 font-mono font-bold text-gold-dark dark:text-gold">{p.symbol}</td>}
                  {isColumnVisible("title") && <td className="px-4 py-3 max-w-[200px] truncate font-medium text-slate-900 dark:text-white">{p.title}</td>}
                  {isColumnVisible("price") && <td className="px-4 py-3" suppressHydrationWarning>{formatCurrency(p.price)}</td>}
                  {isColumnVisible("yield") && <td className="px-4 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{p.yieldRate.toFixed(2)}%</td>}
                  {isColumnVisible("interest") && <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">{p.interestRate.toFixed(2)}%</td>}
                  {isColumnVisible("24h") && (
                    <td className={`px-4 py-3 font-mono font-medium ${changeColor(p.change24h)}`}>
                      {p.change24h > 0 ? `+${p.change24h.toFixed(2)}%` : `${p.change24h.toFixed(2)}%`}
                    </td>
                  )}
                  {isColumnVisible("ytd") && (
                    <td className={`px-4 py-3 font-mono font-medium ${changeColor(p.changeYtd)}`}>
                      {p.changeYtd > 0 ? `+${p.changeYtd.toFixed(2)}%` : `${p.changeYtd.toFixed(2)}%`}
                    </td>
                  )}
                  {isColumnVisible("rating") && <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{p.marketRating}</td>}
                  {isColumnVisible("city") && <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{p.city}</td>}
                  {isColumnVisible("status") && (
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        {p.status}
                      </span>
                    </td>
                  )}
                  {columns.filter((c) => c.isCustom && isColumnVisible(c.id)).map((c) => (
                    <td key={c.id} className="px-4 py-3 min-w-[140px]" onClick={(e) => e.stopPropagation()}>
                      <EditableCell
                        value={getCellValue(p.id, c.id)}
                        fieldType={c.fieldType}
                        options={c.options}
                        placeholder={`+ Enter ${c.label}...`}
                        onChange={(val) => updateCell(p.id, c.id, val)}
                      />
                    </td>
                  ))}
                  {isColumnVisible("actions") && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canEdit && (
                          <Link
                            href={`/admin/properties/${p.id}/edit`}
                            className="inline-flex items-center gap-1 text-gold-dark dark:text-gold hover:underline text-xs font-bold"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Link>
                        )}
                        <Link href={`/properties/${p.slug}`} className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white hover:underline">
                          View
                        </Link>
                        {canDelete && (
                          <Button
                            variant="danger"
                            className="!px-2 !py-1 text-xs"
                            disabled={busy === p.id}
                            onClick={() => remove(p.id, p.symbol)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                  <td className="px-3 py-3.5 text-center border-l border-slate-100 dark:border-slate-800"></td>
                </tr>
              ))}

              {canAdd && (
                <tr className="bg-slate-50/50 hover:bg-slate-50 transition">
                  <td colSpan={15} className="px-5 py-3 text-left">
                    <button
                      type="button"
                      onClick={() => router.push("/admin/properties/new")}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
                    >
                      <Plus className="h-4 w-4 text-amber-600 stroke-[2.5]" />
                      <span>+ Add New Property Row</span>
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
