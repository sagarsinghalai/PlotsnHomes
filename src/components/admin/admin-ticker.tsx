"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export type TickerItem = {
  symbol: string;
  title: string;
  price: number;
  change24h: number;
};

interface AdminTickerProps {
  data: TickerItem[];
}

export function AdminTicker({ data }: AdminTickerProps) {
  // Duplicate list to make scrolling loop seamless
  const scrollItems = [...data, ...data, ...data, ...data];

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="a-ticker-rail">
      <div className="a-ticker-label">🏠 Live</div>
      <div className="a-ticker-overflow">
        <div className="a-ticker-track">
          {scrollItems.map((item, idx) => {
            const isUp = item.change24h >= 0;
            return (
              <div key={idx} className="a-ti">
                <span className="a-ti-name">{item.symbol}</span>
                <span className="a-ti-price">{formatCurrency(item.price)}</span>
                <span className={`a-ti-chg ${isUp ? "up" : "dn"}`}>
                  {isUp ? "▲" : "▼"} {Math.abs(item.change24h).toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
