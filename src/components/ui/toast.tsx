"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

type ToastKind = "success" | "error" | "info";
type ToastItem = { id: number; kind: ToastKind; text: string };

const ToastCtx = createContext<{ push: (kind: ToastKind, text: string) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((kind: ToastKind, text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  const styles: Record<ToastKind, string> = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    error: "border-rose-200 bg-rose-50 text-rose-900",
    info: "border-slate-200 bg-white text-slate-900",
  };
  const Icon = { success: CheckCircle2, error: AlertTriangle, info: Info };
  const iconColor: Record<ToastKind, string> = {
    success: "text-emerald-600",
    error: "text-rose-600",
    info: "text-slate-500",
  };

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[200] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => {
          const I = Icon[t.kind];
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg animate-in ${styles[t.kind]}`}
            >
              <I className={`mt-0.5 h-5 w-5 shrink-0 ${iconColor[t.kind]}`} />
              <p className="flex-1 text-sm font-medium leading-snug">{t.text}</p>
              <button onClick={() => dismiss(t.id)} className="shrink-0 rounded p-0.5 text-current/60 hover:bg-black/5" aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

/**
 * Popup notifications. Returns success/error/info helpers. Safe to call even
 * outside a ToastProvider (no-ops), so components never crash.
 */
export function useToast() {
  const ctx = useContext(ToastCtx);
  const push = ctx?.push ?? (() => {});
  return {
    success: (text: string) => push("success", text),
    error: (text: string) => push("error", text),
    info: (text: string) => push("info", text),
  };
}
