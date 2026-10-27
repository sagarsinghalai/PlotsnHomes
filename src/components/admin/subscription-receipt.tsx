"use client";

import { Download, Printer, Check } from "lucide-react";
import { useRef } from "react";
import type { InvoiceIssuer } from "@/lib/invoice";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type SubscriptionReceiptData = {
  invoiceNumber: string;
  planName: string;
  amount: number;
  currency: string;
  status: string;
  kind: string;
  periodStart: string;
  periodEnd: string | null;
  issuedAt: string;
  paymentRef: string | null;
  provider: string | null;
  issuer: InvoiceIssuer;
};

export function SubscriptionReceipt({ data }: { data: SubscriptionReceiptData }) {
  const printRef = useRef<HTMLDivElement>(null);
  const isPaid = data.status === "PAID";

  function handlePrint() {
    window.print();
  }

  function handleDownload() {
    const el = printRef.current;
    if (!el) return;
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>${data.invoiceNumber}</title>
<style>
  body { font-family: system-ui, sans-serif; padding: 40px; color: #0f172a; max-width: 760px; margin: 0 auto; }
  table { width: 100%; border-collapse: collapse; margin: 24px 0; }
  th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; }
  th { background: #f8fafc; font-size: 12px; text-transform: uppercase; }
</style></head><body>${el.innerHTML}</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.invoiceNumber}-receipt.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const period = `${new Date(data.periodStart).toLocaleDateString("en-US", { dateStyle: "medium" })} → ${
    data.periodEnd ? new Date(data.periodEnd).toLocaleDateString("en-US", { dateStyle: "medium" }) : "no expiry"
  }`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2 print:hidden">
        <Button variant="secondary" onClick={handlePrint}>
          <Printer className="h-4 w-4" /> Print / Save PDF
        </Button>
        <Button variant="gold" onClick={handleDownload}>
          <Download className="h-4 w-4" /> Download receipt
        </Button>
      </div>

      <div
        ref={printRef}
        className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm print:border-0 print:shadow-none"
      >
        <div className="flex flex-wrap justify-between gap-6 border-b-2 border-brand pb-6 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-hover">{data.issuer.companyName}</p>
            <h1 className="mt-1 font-display text-2xl font-bold text-slate-900">Subscription Receipt</h1>
            <p className="mt-1 text-sm text-slate-500 capitalize">{data.kind} · workspace subscription</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-mono text-lg font-bold text-slate-900">{data.invoiceNumber}</p>
            <p className="mt-2 text-slate-500">Issued: {new Date(data.issuedAt).toLocaleDateString("en-US", { dateStyle: "long" })}</p>
            <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${isPaid ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>
              {isPaid ? "PAID" : data.status}
            </span>
          </div>
        </div>

        <div className="mb-8 grid gap-8 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-slate-400">From (Merchant of record)</p>
            <p className="font-semibold text-slate-900">{data.issuer.companyName}</p>
            {data.issuer.email && <p className="mt-1 text-sm text-slate-600">{data.issuer.email}</p>}
            {data.issuer.website && <p className="text-sm text-slate-600">{data.issuer.website}</p>}
            {data.issuer.address && <p className="mt-1 text-sm text-slate-600">{data.issuer.address}</p>}
            {data.issuer.gstCin && <p className="mt-1 text-xs text-slate-500">{data.issuer.gstCin}</p>}
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Billed to (Partner)</p>
            <p className="font-semibold text-slate-900">{data.issuer.partnerName ?? data.issuer.companyName}</p>
            {data.issuer.partnerName && (
              <p className="mt-1 text-xs text-slate-500">{data.issuer.relationshipLabel} of {data.issuer.companyName}</p>
            )}
          </div>
        </div>

        <table className="mb-6 w-full text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Description</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Period</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600 w-32">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-100">
              <td className="px-4 py-3 text-slate-800">{data.planName} — workspace subscription</td>
              <td className="px-4 py-3 text-slate-600">{period}</td>
              <td className="px-4 py-3 text-right font-medium">{formatCurrency(data.amount)}</td>
            </tr>
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between border-t border-slate-200 pt-2 text-slate-900">
              <span className="font-semibold">Total</span>
              <span className="text-lg font-bold">{formatCurrency(data.amount)}</span>
            </div>
          </div>
        </div>

        {data.paymentRef && (
          <p className="mt-6 flex items-center gap-1.5 text-sm text-emerald-700">
            <Check className="h-4 w-4" /> Payment reference: <span className="font-mono">{data.paymentRef}</span>
            {data.provider ? ` (${data.provider})` : ""}
          </p>
        )}

        <p className="mt-10 text-center text-[10px] text-slate-400">
          Computer-generated receipt issued by {data.issuer.companyName}
          {data.issuer.partnerName ? `, operated by ${data.issuer.partnerName} (${data.issuer.relationshipLabel})` : ""}.
          {data.issuer.email ? ` For queries contact ${data.issuer.email}.` : ""}
          {data.issuer.copyright ? ` ${data.issuer.copyright}` : ""}
        </p>
      </div>
    </div>
  );
}
