"use client";

import { Building2, User, Briefcase, ArrowRight, Check } from "lucide-react";
import type { SellerKind } from "./seller-flow";

const TYPES: { kind: SellerKind; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    kind: "INDIVIDUAL",
    label: "Individual Seller",
    desc: "I want to sell or rent my own property.",
    icon: <User className="h-6 w-6" />,
  },
  {
    kind: "DEVELOPER",
    label: "Developer / Builder",
    desc: "I build and sell projects or multiple units.",
    icon: <Building2 className="h-6 w-6" />,
  },
  {
    kind: "AGENT",
    label: "Agent / Broker",
    desc: "I list properties on behalf of owners.",
    icon: <Briefcase className="h-6 w-6" />,
  },
];

export function AccountTypeSelect({
  selected,
  onSelect,
  onContinue,
  onLogin,
}: {
  selected: SellerKind;
  onSelect: (k: SellerKind) => void;
  onContinue: () => void;
  onLogin: () => void;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-10 shadow-2xl">
      <h2 className="text-xl sm:text-2xl font-extrabold text-white">Who are you?</h2>
      <p className="text-sm text-slate-400 mt-1">Choose the account type that fits you — you can list right after.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {TYPES.map((t) => {
          const active = selected === t.kind;
          return (
            <button
              key={t.kind}
              type="button"
              onClick={() => onSelect(t.kind)}
              className={`relative text-left rounded-2xl border p-5 transition ${
                active
                  ? "border-amber-400 bg-amber-500/10 ring-2 ring-amber-400/30"
                  : "border-slate-800 bg-slate-950 hover:border-slate-600"
              }`}
            >
              {active && (
                <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-slate-950">
                  <Check className="h-3.5 w-3.5" />
                </span>
              )}
              <div className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl ${active ? "bg-amber-400 text-slate-950" : "bg-slate-900 text-amber-400 border border-slate-800"}`}>
                {t.icon}
              </div>
              <div className="font-bold text-white">{t.label}</div>
              <div className="text-xs text-slate-400 mt-1 leading-relaxed">{t.desc}</div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="mt-8 w-full flex items-center justify-center gap-2 rounded-2xl bg-brand hover:bg-brand-hover py-4 font-extrabold text-sm text-white shadow-xl shadow-brand/20 transition"
      >
        Continue <ArrowRight className="h-5 w-5" />
      </button>

      <p className="mt-4 text-center text-xs text-slate-400">
        Already have an account?{" "}
        <button type="button" onClick={onLogin} className="font-bold text-amber-400 hover:underline">
          Log in
        </button>
      </p>
    </div>
  );
}
