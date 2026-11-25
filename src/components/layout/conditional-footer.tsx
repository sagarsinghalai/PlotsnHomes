"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./footer";

export function ConditionalFooter() {
  const pathname = usePathname();

  // Hide footer on admin and dashboard routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/dashboard") || pathname.startsWith("/portal")) {
    return null;
  }

  return <Footer />;
}
