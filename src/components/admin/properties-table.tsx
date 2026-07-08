"use client";

import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { changeColor } from "@/lib/market";
import { formatCurrency } from "@/lib/utils";

type Row = {
  id: string;
  symbol: string;
  title: string;
  slug: string;
  price: number;
  yieldRate: number;
  interestRate: number;
  change24h: number;
  changeYtd: number;
  marketRating: string;
  city: string;
  status: string;
};

export function PropertiesTable({ properties }: { properties: Row[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function remove(id: string, symbol: string) {
    if (!confirm(`Delete property ${symbol}? All inquiries and transactions for it will be removed.`)) {
      return;
    }
    setBusy(id);
    const res = await fetch(`/api/admin/properties/${id}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) router.refresh();
    else alert("Delete failed");
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full text-sm min-w-[1000px]">
        <thead className="bg-slate-50 text-left text-slate-500">
          <tr>
            <th className="px-4 py-3">Symbol</th>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Price</th>
            <th className="px-4 py-3">Yield</th>
            <th className="px-4 py-3">Interest</th>
            <th className="px-4 py-3">24h</th>
            <th className="px-4 py-3">YTD</th>
            <th className="px-4 py-3">Rating</th>
            <th className="px-4 py-3">City</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {properties.map((p) => (
            <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-3 font-mono font-bold text-gold-dark">{p.symbol}</td>
              <td className="px-4 py-3 max-w-[160px] truncate">{p.title}</td>
              <td className="px-4 py-3 font-medium">{formatCurrency(p.price)}</td>
              <td className="px-4 py-3 font-mono text-emerald-600">{p.yieldRate.toFixed(2)}%</td>
              <td className="px-4 py-3 font-mono">{p.interestRate.toFixed(2)}%</td>
              <td className={`px-4 py-3 font-mono ${changeColor(p.change24h)}`}>
                {p.change24h.toFixed(2)}%
              </td>
              <td className={`px-4 py-3 font-mono ${changeColor(p.changeYtd)}`}>
                {p.changeYtd.toFixed(2)}%
              </td>
              <td className="px-4 py-3 font-bold">{p.marketRating}</td>
              <td className="px-4 py-3">{p.city}</td>
              <td className="px-4 py-3">{p.status}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Link
                    href={`/admin/properties/${p.id}/edit`}
                    className="inline-flex items-center gap-1 text-gold-dark hover:underline text-xs font-medium"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Link>
                  <Link href={`/properties/${p.slug}`} className="text-xs text-slate-500 hover:underline">
                    View
                  </Link>
                  <Button
                    variant="danger"
                    className="!px-2 !py-1"
                    disabled={busy === p.id}
                    onClick={() => remove(p.id, p.symbol)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
