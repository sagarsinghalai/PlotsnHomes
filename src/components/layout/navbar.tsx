"use client";

import { Building2, Menu, X } from "lucide-react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/properties", label: "Properties" },
  { href: "/markets", label: "Markets" },
  { href: "/calculators", label: "Calculators" },
  { href: "/dashboard", label: "Dashboard" },
];

export function Navbar() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold text-slate-900">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-gold">
            <Building2 className="h-5 w-5" />
          </span>
          PlotsnHomes
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              {l.label}
            </Link>
          ))}
          {(session?.user?.role === "SUPERADMIN" || session?.user?.role === "EMPLOYEE") && (
            <Link href="/admin" className="text-sm font-medium text-gold-dark">
              Admin
            </Link>
          )}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {session ? (
            <>
              <span className="text-sm text-slate-500">{session.user.name}</span>
              <Button variant="ghost" onClick={() => signOut({ callbackUrl: "/" })}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link href="/register">
                <Button variant="gold">Get started</Button>
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="md:hidden rounded-lg p-2 text-slate-700"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 md:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block py-2 text-slate-700"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          {session ? (
            <Button variant="ghost" className="mt-2 w-full" onClick={() => signOut()}>
              Sign out
            </Button>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              <Link href="/login" onClick={() => setOpen(false)}>
                <Button variant="secondary" className="w-full">Log in</Button>
              </Link>
              <Link href="/register" onClick={() => setOpen(false)}>
                <Button variant="gold" className="w-full">Register</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
