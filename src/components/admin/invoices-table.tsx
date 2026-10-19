"use client";

import { useState } from "react";
import { Eye, Plus } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { TableToolbarManager } from "@/components/ui/table-toolbar-manager";
import { useTableColumns, useCustomCellData } from "@/hooks/use-table-columns";
import { EditableCell } from "@/components/ui/editable-cell";
import { useHorizontalScroll } from "@/hooks/use-horizontal-scroll";
import { TableScrollButtons } from "@/components/ui/table-scroll-buttons";

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  bookingId: string | null;
  invoiceTo: string;
  bookingName: string;
  brokerageName: string;
  status: string;
  totalAmount: number;
  dueOn: string | null;
  buyerName: string | null;
  agentName: string | null;
  propertySymbol: string | null;
};

export function InvoicesTable({ invoices }: { invoices: InvoiceRow[] }) {
  const [items, setItems] = useState<InvoiceRow[]>(invoices);
  const { getCellValue, updateCell } = useCustomCellData("invoices_table");
  const {
    columns,
    visibleColumnIds,
    toggleColumn,
    addCustomColumn,
    updateCustomColumn,
    removeCustomColumn,
    resetColumns,
    isColumnVisible,
  } = useTableColumns("invoices_table", [
    { id: "number", label: "Invoice #", defaultVisible: true },
    { id: "booking", label: "Booking", defaultVisible: true },
    { id: "buyer", label: "Buyer", defaultVisible: true },
    { id: "agent", label: "Agent", defaultVisible: true },
    { id: "property", label: "Property", defaultVisible: true },
    { id: "type", label: "Type", defaultVisible: true },
    { id: "status", label: "Status", defaultVisible: true },
    { id: "total", label: "Total", defaultVisible: true },
    { id: "due", label: "Due", defaultVisible: true },
    { id: "actions", label: "Actions", defaultVisible: true },
  ]);

  const handleAddRow = () => {
    const num = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
    const newInv: InvoiceRow = {
      id: `inv_${Date.now()}`,
      invoiceNumber: num,
      bookingId: `BKG-${Math.floor(100 + Math.random() * 900)}`,
      invoiceTo: "BUYER",
      bookingName: "New Booking Invoice",
      brokerageName: "PlotsnHomes Direct",
      status: "UNPAID",
      totalAmount: 150000,
      dueOn: new Date().toISOString(),
      buyerName: "New Client",
      agentName: "Bhavya Pandey",
      propertySymbol: "BKV-PROP-001",
    };
    setItems((prev) => [newInv, ...prev]);
  };

  const { ref: tableScrollRef, canScrollLeft, canScrollRight, scroll } = useHorizontalScroll([items, visibleColumnIds]);

  return (
    <div className="space-y-4">
      <TableToolbarManager
        tableTitle="Invoices Database"
        addRowLabel="Add Invoice"
        onAddRow={handleAddRow}
        columns={columns}
        visibleColumnIds={visibleColumnIds}
        onToggleColumn={toggleColumn}
        onAddCustomColumn={addCustomColumn}
        onUpdateCustomColumn={updateCustomColumn}
        onRemoveCustomColumn={removeCustomColumn}
        onResetColumns={resetColumns}
      />

      <div className="flex justify-end">
        <TableScrollButtons canScrollLeft={canScrollLeft} canScrollRight={canScrollRight} onScroll={scroll} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div ref={tableScrollRef} className="overflow-x-auto">
          <table className="w-full text-sm min-w-[960px]">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {isColumnVisible("number") && <th className="px-5 py-3.5">Invoice #</th>}
                {isColumnVisible("booking") && <th className="px-5 py-3.5">Booking</th>}
                {isColumnVisible("buyer") && <th className="px-5 py-3.5">Buyer</th>}
                {isColumnVisible("agent") && <th className="px-5 py-3.5">Agent</th>}
                {isColumnVisible("property") && <th className="px-5 py-3.5">Property</th>}
                {isColumnVisible("type") && <th className="px-5 py-3.5">Type</th>}
                {isColumnVisible("status") && <th className="px-5 py-3.5">Status</th>}
                {isColumnVisible("total") && <th className="px-5 py-3.5">Total</th>}
                {isColumnVisible("due") && <th className="px-5 py-3.5">Due</th>}
                {columns.filter((c) => c.isCustom && isColumnVisible(c.id)).map((c) => (
                  <th key={c.id} className="px-5 py-3.5 text-amber-700 font-mono">{c.label}</th>
                ))}
                {isColumnVisible("actions") && <th className="px-5 py-3.5 text-right">Actions</th>}
                <th className="px-3 py-3.5 text-center w-12 border-l border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      const btn = document.querySelector('[data-column-manager-btn]') as HTMLButtonElement;
                      if (btn) btn.click();
                    }}
                    className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-slate-300 bg-white text-slate-900 font-bold hover:bg-slate-100 shadow-xs transition"
                    title="Add / Customize Columns & Fields"
                  >
                    <Plus className="h-4 w-4 stroke-[2.5]" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((inv) => {
                const isPaid = inv.status.toLowerCase() === "paid";
                return (
                  <tr key={inv.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                    {isColumnVisible("number") && (
                      <td className="px-5 py-4 font-mono text-xs font-semibold text-brand-hover">
                        {inv.invoiceNumber}
                      </td>
                    )}
                    {isColumnVisible("booking") && (
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-900">{inv.bookingName}</p>
                        <p className="text-xs text-slate-400 font-mono">{inv.bookingId ?? "—"}</p>
                      </td>
                    )}
                    {isColumnVisible("buyer") && <td className="px-5 py-4 text-slate-700">{inv.buyerName ?? inv.bookingName}</td>}
                    {isColumnVisible("agent") && <td className="px-5 py-4 text-slate-700">{inv.agentName ?? inv.brokerageName}</td>}
                    {isColumnVisible("property") && (
                      <td className="px-5 py-4 font-mono text-xs text-brand-hover">
                        {inv.propertySymbol ?? "—"}
                      </td>
                    )}
                    {isColumnVisible("type") && (
                      <td className="px-5 py-4">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs">{inv.invoiceTo}</span>
                      </td>
                    )}
                    {isColumnVisible("status") && (
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            isPaid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                    )}
                    {isColumnVisible("total") && <td className="px-5 py-4 font-semibold" suppressHydrationWarning>{formatCurrency(inv.totalAmount)}</td>}
                    {isColumnVisible("due") && (
                      <td className="px-5 py-4 text-slate-600 whitespace-nowrap" suppressHydrationWarning>
                        {inv.dueOn ? new Date(inv.dueOn).toLocaleDateString("en-IN") : "—"}
                      </td>
                    )}
                    {columns.filter((c) => c.isCustom && isColumnVisible(c.id)).map((c) => (
                      <td key={c.id} className="px-4 py-3 min-w-[140px]" onClick={(e) => e.stopPropagation()}>
                        <EditableCell
                          value={getCellValue(inv.id, c.id)}
                          fieldType={c.fieldType}
                          options={c.options}
                          placeholder={`+ Enter ${c.label}...`}
                          onChange={(val) => updateCell(inv.id, c.id, val)}
                        />
                      </td>
                    ))}
                    {isColumnVisible("actions") && (
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/bookings/invoices/${inv.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Link>
                          <Link
                            href={`/admin/bookings/invoices/${inv.id}?copy=buyer`}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50"
                            title="Buyer receipt"
                          >
                            Buyer
                          </Link>
                        </div>
                      </td>
                    )}
                    <td className="px-3 py-3.5 text-center border-l border-slate-100"></td>
                  </tr>
                );
              })}

              <tr className="bg-slate-50/50 hover:bg-slate-50 transition">
                <td colSpan={15} className="px-5 py-3 text-left">
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 transition"
                  >
                    <Plus className="h-4 w-4 text-amber-600 stroke-[2.5]" />
                    <span>+ Add New Invoice Row</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
