"use client";

import { Download, Printer } from "lucide-react";
import { useRef, useState } from "react";
import type { InvoiceReceiptData } from "@/lib/invoice";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type ReceiptParty = "buyer" | "agent";

export function InvoiceReceipt({
  invoice,
  initialParty = "buyer",
}: {
  invoice: InvoiceReceiptData;
  initialParty?: ReceiptParty;
}) {
  const [party, setParty] = useState<ReceiptParty>(initialParty);
  const printRef = useRef<HTMLDivElement>(null);

  const isPaid = invoice.status.toLowerCase() === "paid" || !!invoice.paidAt;
  const lineItems =
    invoice.lineItems.length > 0
      ? invoice.lineItems
      : [
          {
            description: "Brokerage & booking services",
            qty: 1,
            rate: invoice.subtotal || invoice.totalAmount,
            amount: invoice.subtotal || invoice.totalAmount,
          },
        ];

  function partyLabel() {
    return party === "buyer" ? "Buyer copy" : "Agent copy";
  }

  function billTo() {
    if (party === "buyer") {
      return {
        title: "Bill to (Buyer)",
        name: invoice.buyerName ?? invoice.bookingName,
        email: invoice.buyerEmail ?? "—",
        phone: invoice.buyerPhone ?? "—",
        address: invoice.buyerAddress ?? "—",
      };
    }
    return {
      title: "Bill to (Agent / Brokerage)",
      name: invoice.agentName ?? invoice.brokerageName,
      email: invoice.agentEmail ?? "—",
      phone: invoice.agentPhone ?? "—",
      address: invoice.brokerageName,
    };
  }

  function issuedToNote() {
    if (party === "buyer") {
      return "Payment receipt for property booking. Retain for your records.";
    }
    return "Commission & brokerage statement for agent settlement.";
  }

  const bill = billTo();

  function handlePrint() {
    window.print();
  }

  function handleDownload() {
    const el = printRef.current;
    if (!el) return;
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>${invoice.invoiceNumber} - ${partyLabel()}</title>
<style>
  body { font-family: system-ui, sans-serif; padding: 40px; color: #0f172a; max-width: 800px; margin: 0 auto; }
  table { width: 100%; border-collapse: collapse; margin: 24px 0; }
  th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; }
  th { background: #f8fafc; font-size: 12px; text-transform: uppercase; }
  .header { border-bottom: 3px solid #c9a227; padding-bottom: 20px; margin-bottom: 24px; }
  .gold { color: #92700c; }
  .total { font-size: 1.25rem; font-weight: bold; }
</style></head><body>${el.innerHTML}</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoice.invoiceNumber}-${party}-receipt.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
          {(["buyer", "agent"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setParty(p)}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${
                party === p ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {p} receipt
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Print / Save PDF
          </Button>
          <Button variant="gold" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            Download receipt
          </Button>
        </div>
      </div>

      <div
        ref={printRef}
        id="invoice-receipt-print"
        className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm print:shadow-none print:border-0 print:rounded-none"
      >
        <div className="header flex flex-wrap justify-between gap-6 border-b-2 border-brand pb-6 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-hover">BrickVest</p>
            <h1 className="font-display text-2xl font-bold text-slate-900 mt-1">
              {party === "buyer" ? "Payment Receipt" : "Brokerage Invoice"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">{partyLabel()} · {issuedToNote()}</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-mono font-bold text-lg text-slate-900">{invoice.invoiceNumber}</p>
            <p className="text-slate-500 mt-2">
              Issued: {new Date(invoice.createdAt).toLocaleDateString("en-US", { dateStyle: "long" })}
            </p>
            {invoice.dueOn && (
              <p className="text-slate-500">Due: {new Date(invoice.dueOn).toLocaleDateString()}</p>
            )}
            <span
              className={`inline-block mt-2 rounded-full px-3 py-1 text-xs font-semibold ${
                isPaid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
              }`}
            >
              {isPaid ? "PAID" : invoice.status.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400 mb-2">From</p>
            <p className="font-semibold text-slate-900">BrickVest Realty Platform</p>
            <p className="text-sm text-slate-600 mt-1">support@brickvest.com</p>
            <p className="text-sm text-slate-600">www.brickvest.com</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400 mb-2">{bill.title}</p>
            <p className="font-semibold text-slate-900">{bill.name}</p>
            <p className="text-sm text-slate-600 mt-1">{bill.email}</p>
            <p className="text-sm text-slate-600">{bill.phone}</p>
            <p className="text-sm text-slate-600 mt-1">{bill.address}</p>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 mb-8 text-sm">
          <p className="text-xs font-semibold uppercase text-slate-400 mb-2">Booking & property</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <p>
              <span className="text-slate-500">Booking ref:</span>{" "}
              <span className="font-mono font-medium">{invoice.bookingId ?? "—"}</span>
            </p>
            <p>
              <span className="text-slate-500">Invoice type:</span>{" "}
              <span className="font-medium">{invoice.invoiceTo}</span>
            </p>
            {invoice.propertySymbol && (
              <p>
                <span className="text-slate-500">Property:</span>{" "}
                <span className="font-mono font-medium text-brand-hover">{invoice.propertySymbol}</span>
              </p>
            )}
            {invoice.propertyTitle && (
              <p className="sm:col-span-2">
                <span className="text-slate-500">Title:</span> {invoice.propertyTitle}
              </p>
            )}
            {invoice.propertyAddress && (
              <p className="sm:col-span-2">
                <span className="text-slate-500">Address:</span> {invoice.propertyAddress}
              </p>
            )}
            {party === "agent" && invoice.buyerName && (
              <p className="sm:col-span-2">
                <span className="text-slate-500">Buyer:</span> {invoice.buyerName}
              </p>
            )}
            {party === "buyer" && invoice.agentName && (
              <p className="sm:col-span-2">
                <span className="text-slate-500">Listing agent:</span> {invoice.agentName}
              </p>
            )}
          </div>
        </div>

        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Description</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600 w-16">Qty</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600 w-28">Rate</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600 w-28">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((row, i) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="px-4 py-3 text-slate-800">{row.description}</td>
                <td className="px-4 py-3 text-right text-slate-600">{row.qty}</td>
                <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(row.rate)}</td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(row.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatCurrency(invoice.subtotal || invoice.totalAmount - invoice.taxAmount)}</span>
            </div>
            {invoice.taxAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Tax ({invoice.taxRate}%)</span>
                <span>{formatCurrency(invoice.taxAmount)}</span>
              </div>
            )}
            {invoice.commissionPct != null && (
              <div className="flex justify-between text-slate-600">
                <span>Commission rate</span>
                <span>{invoice.commissionPct}%</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-2 total text-slate-900">
              <span className="font-semibold">Total due</span>
              <span className="font-bold text-lg">{formatCurrency(invoice.totalAmount)}</span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-8 pt-6 border-t border-slate-100 text-sm text-slate-600">
            <p className="font-semibold text-slate-800 mb-1">Notes</p>
            <p>{invoice.notes}</p>
          </div>
        )}

        {invoice.paidAt && (
          <p className="mt-6 text-sm text-emerald-700 font-medium">
            Paid on {new Date(invoice.paidAt).toLocaleDateString("en-US", { dateStyle: "long" })}
          </p>
        )}

        <p className="mt-10 text-[10px] text-slate-400 text-center">
          This is a computer-generated document from BrickVest. For queries contact support@brickvest.com
        </p>
      </div>

    </div>
  );
}
