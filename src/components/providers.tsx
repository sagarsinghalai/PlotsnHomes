"use client";

import { SessionProvider } from "next-auth/react";
import { SessionHeartbeat } from "@/components/admin/session-heartbeat";
import { ImpersonationBanner } from "@/components/impersonation-banner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionHeartbeat />
      {children}
      <ImpersonationBanner />
    </SessionProvider>
  );
}
