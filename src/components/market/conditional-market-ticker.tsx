"use client";

import { usePathname } from "next/navigation";

export function ConditionalMarketTicker({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Hide market ticker on admin routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/portal")) {
    return null;
  }

  return <>{children}</>;
}
