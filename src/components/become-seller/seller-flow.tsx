"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Home, Loader2, ShieldCheck, TrendingUp, FileCheck, Building } from "lucide-react";
import { AccountTypeSelect } from "./account-type-select";
import { SignupForm } from "./signup-form";
import { UserExistsModal } from "./user-exists-modal";
import { ListingWizard } from "./listing-wizard";

export type SellerKind = "INDIVIDUAL" | "DEVELOPER" | "AGENT";
type Phase = "loading" | "choose-type" | "signup" | "wizard";

const PERKS = [
  { icon: <TrendingUp className="h-5 w-5 text-amber-400" />, title: "Zero Listing Commission", desc: "Keep 100% of your asset value" },
  { icon: <ShieldCheck className="h-5 w-5 text-amber-400" />, title: "Verified Buyer Network", desc: "KYC-cleared investors" },
  { icon: <FileCheck className="h-5 w-5 text-amber-400" />, title: "Instant Legal Clearance", desc: "Automated title-search help" },
  { icon: <Building className="h-5 w-5 text-amber-400" />, title: "Rapid Liquidity", desc: "Fast-track syndication" },
];

export function SellerFlow() {
  const { status } = useSession();
  const [phase, setPhase] = useState<Phase>("loading");
  const [kind, setKind] = useState<SellerKind>("INDIVIDUAL");
  const [loginOpen, setLoginOpen] = useState(false);
  const [prefillIdentifier, setPrefillIdentifier] = useState("");

  // Once authenticated (fresh signup, OTP/password login, or returning user) the
  // flow jumps straight into the listing wizard.
  useEffect(() => {
    if (status === "loading") return;
    if (status === "authenticated") {
      setPhase("wizard");
      setLoginOpen(false);
    } else {
      setPhase((p) => (p === "loading" ? "choose-type" : p));
    }
  }, [status]);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-slate-900 py-14 sm:py-20">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-luminosity scale-105 pointer-events-none"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/60 to-slate-950 pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-5xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/30 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-amber-400 mb-5">
            <Home className="h-4 w-4" />
            <span>Verified Seller Network</span>
          </div>
          <h1
            className="text-3xl sm:text-5xl font-extrabold leading-tight"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Become a Seller
          </h1>
          <p className="mt-4 text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Create your account, then list your plots, homes, or projects to thousands of verified buyers &amp; investors.
          </p>

          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
            {PERKS.map((p, i) => (
              <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 backdrop-blur-xs">
                <div className="mb-1.5">{p.icon}</div>
                <div className="text-xs sm:text-sm font-bold text-white">{p.title}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BODY */}
      <section className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        {phase === "loading" && (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        {phase === "choose-type" && (
          <AccountTypeSelect
            selected={kind}
            onSelect={setKind}
            onContinue={() => setPhase("signup")}
            onLogin={() => {
              setPrefillIdentifier("");
              setLoginOpen(true);
            }}
          />
        )}

        {phase === "signup" && (
          <SignupForm
            kind={kind}
            onBack={() => setPhase("choose-type")}
            onExists={(identifier) => {
              setPrefillIdentifier(identifier);
              setLoginOpen(true);
            }}
            onLogin={() => {
              setPrefillIdentifier("");
              setLoginOpen(true);
            }}
          />
        )}

        {phase === "wizard" && <ListingWizard />}
      </section>

      <UserExistsModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        prefillIdentifier={prefillIdentifier}
      />
    </div>
  );
}
