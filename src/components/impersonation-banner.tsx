"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { Loader2, LogOut, Eye } from "lucide-react";

/**
 * Shown app-wide whenever a platform owner is impersonating another user, so it
 * is always obvious and one click to leave. Exiting is audited server-side.
 */
export function ImpersonationBanner() {
  const { data: session, update } = useSession();
  const [busy, setBusy] = useState(false);

  if (!session?.impersonating) return null;

  const who = session.user?.name || session.user?.email || "user";
  const owner = session.impersonator?.email;

  async function exit() {
    setBusy(true);
    try {
      await update({ stopImpersonation: true });
      window.location.href = "/admin/platform/users";
    } catch {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[9999] flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-amber-500 px-4 py-2 text-sm font-medium text-amber-950 shadow-[0_-2px_12px_rgba(0,0,0,0.15)]">
      <Eye className="h-4 w-4 shrink-0" />
      <span>
        Viewing as <strong>{who}</strong>
        {owner ? <span className="opacity-80"> — signed in as platform owner {owner}</span> : null}
      </span>
      <button
        onClick={exit}
        disabled={busy}
        className="inline-flex items-center gap-1 rounded-md bg-amber-950 px-2.5 py-1 text-xs font-semibold text-amber-50 hover:bg-black disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />} Exit
      </button>
    </div>
  );
}
