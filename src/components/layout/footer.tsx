import { Building2 } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4 sm:px-6 lg:px-8">
        <div>
          <div className="flex items-center gap-2 font-display text-lg font-bold text-white">
            <Building2 className="h-6 w-6 text-gold" />
            PlotsnHomes
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Premium real estate investment platform. Verified listings, transparent calculations, secure transactions.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-white">Explore</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/properties" className="hover:text-gold">Properties</Link></li>
            <li><Link href="/calculators" className="hover:text-gold">Calculators</Link></li>
            <li><Link href="/register" className="hover:text-gold">Create account</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white">Account</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/login" className="hover:text-gold">Log in</Link></li>
            <li><Link href="/dashboard" className="hover:text-gold">Dashboard</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white">Legal</h4>
          <p className="mt-3 text-sm text-slate-400">
            Demo platform. Use Stripe test mode and Resend sandbox for development.
          </p>
        </div>
      </div>
      <div className="border-t border-slate-800 py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} PlotsnHomes. Built with Next.js.
      </div>
    </footer>
  );
}
