"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./navbar";

export function ConditionalNavbar() {
  const pathname = usePathname();

  // Hide public site navbar on admin routes to prevent double-header glitches
  if (pathname.startsWith("/admin")) {
    return null;
  }

  return <Navbar />;
}
