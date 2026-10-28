"use client";

import { SessionProvider } from "next-auth/react";
import { SessionHeartbeat } from "@/components/admin/session-heartbeat";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import { ToastProvider } from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <SessionHeartbeat />
        {children}
        <ImpersonationBanner />
      </ToastProvider>
    </SessionProvider>
  );
}
