"use client";

import { Building2, Menu, X } from "lucide-react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

import { BrandLogo } from "@/components/ui/brand-logo";

const links = [
  { href: "/#featured-listings", label: "Properties", scrollTarget: "featured-listings" },
  { href: "/#how-it-works", label: "How it Works", scrollTarget: "how-it-works" },
  { href: "/#payments", label: "Payments", scrollTarget: "payments" },
  { href: "/#trading", label: "Trading", scrollTarget: "trading" },
  { href: "/markets", label: "Markets" },
  { href: "/calculators", label: "Calculators" },
  { href: "/calculators/area-value-calculator", label: "Area Calculator" },
  { href: "/dashboard", label: "Dashboard" },
] as const;

function getRoleLabel(role?: string) {
  switch (role) {
    case "SUPERADMIN":
      return "Super Admin";
    case "EMPLOYEE":
      return "Admin Staff";
    case "AGENT":
      return "Agent";
    case "SELLER":
      return "Seller";
    case "BUYER":
      return "Customer";
    case "DEMO":
      return "Demo User";
    default:
      return role || "User";
  }
}

export function Navbar() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  function handleNavClick(e: React.MouseEvent, link: typeof links[number]) {
    if ("scrollTarget" in link && link.scrollTarget) {
      e.preventDefault();
      if (pathname === "/") {
        // Already on home page – smooth-scroll
        const el = document.getElementById(link.scrollTarget);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      } else {
        router.push(link.href);
      }
    } else {
      router.push(link.href);
    }
    setOpen(false);
  }

  const isHome = pathname === "/";

  return (
    <header
      className={`h-16 w-full shrink-0 ${
        isHome
          ? "absolute left-0 right-0 z-50 border-b border-white/5 bg-transparent"
          : "relative z-50 border-b border-slate-800 bg-slate-950"
      }`}
    >
      <div className="mx-auto flex h-full w-full max-w-[1536px] items-center justify-between px-4 sm:px-6 lg:px-8 flex-nowrap">
        {/* Utmost Left: Logo & Title */}
        <BrandLogo href="/" />

        {/* Center: Navigation Links */}
        <nav className="hidden items-center gap-2 sm:gap-3 lg:gap-4 xl:gap-6 md:flex shrink-0 flex-nowrap">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={(e) => handleNavClick(e, l)}
              className="text-xs xl:text-sm font-medium whitespace-nowrap text-slate-300 transition hover:text-white"
            >
              {l.label}
            </Link>
          ))}
          {session?.user && (
            <Link
              href={
                session.user.role === "SUPERADMIN" || session.user.role === "EMPLOYEE"
                  ? "/admin"
                  : "/dashboard"
              }
              className="text-xs xl:text-sm font-semibold whitespace-nowrap text-gold hover:text-gold-dark border border-gold/40 rounded-xl px-3 py-1.5 bg-gold/10 hover:bg-gold/20 transition shadow-sm"
            >
              {getRoleLabel(session.user.role)}
            </Link>
          )}
        </nav>

        {/* Utmost Right: User Session Controls */}
        <div className="hidden items-center gap-3 md:flex shrink-0">
          {session ? (
            <div className="flex items-center gap-3">
              <span className="text-xs xl:text-sm font-medium whitespace-nowrap text-slate-400 max-w-[160px] truncate">
                {session.user.name}
              </span>
              <Button
                variant="ghost"
                className="text-xs xl:text-sm whitespace-nowrap text-slate-300 hover:text-white hover:bg-slate-800"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Sign out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" className="text-xs xl:text-sm whitespace-nowrap text-slate-300 hover:text-white hover:bg-slate-800/40">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="gold" className="text-xs xl:text-sm whitespace-nowrap">
                  Get started
                </Button>
              </Link>
            </div>
          )}
        </div>

        <button
          type="button"
          className="md:hidden rounded-lg p-2 text-slate-300 hover:text-white shrink-0"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-800 bg-slate-950 px-4 py-4 md:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block py-2 text-slate-300 hover:text-white"
              onClick={(e) => handleNavClick(e, l)}
            >
              {l.label}
            </Link>
          ))}
          {(session?.user?.role === "SUPERADMIN" || session?.user?.role === "EMPLOYEE") && (
            <Link
              href="/admin"
              className="block py-2 font-semibold text-gold"
              onClick={() => setOpen(false)}
            >
              Admin Panel
            </Link>
          )}
          {session ? (
            <Button variant="ghost" className="mt-2 w-full text-slate-300 hover:text-white" onClick={() => signOut({ callbackUrl: "/login" })}>
              Sign out
            </Button>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              <Link href="/login" onClick={() => setOpen(false)}>
                <Button variant="secondary" className="w-full bg-slate-800 text-white border-slate-700 hover:bg-slate-700">Log in</Button>
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
