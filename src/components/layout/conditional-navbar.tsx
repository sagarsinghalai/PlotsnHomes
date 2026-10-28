"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./navbar";

export function ConditionalNavbar({ brandName, logoUrl }: { brandName?: string; logoUrl?: string } = {}) {
  const pathname = usePathname();

  // Hide public site navbar on admin routes to prevent double-header glitches
  if (pathname.startsWith("/admin")) {
    return null;
  }

  return <Navbar brandName={brandName} logoUrl={logoUrl} />;
}
