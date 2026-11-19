"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

import { BrandLogo } from "@/components/ui/brand-logo";

const links = [
  { href: "/properties", label: "Properties" },
  { href: "/#how-it-works", label: "How it works", scrollTarget: "how-it-works" },
  { href: "/#trading", label: "Trading", scrollTarget: "trading" },
  { href: "/markets", label: "Markets" },
  { href: "/calculators", label: "Insights" },
  { href: "/calculators/area-value-calculator", label: "Area Calculator" },
  { href: "/dashboard", label: "Dashboard" },
] as const;

const homeNav = [
  { href: "/properties", label: "Properties" },
  { href: "/#how-it-works", label: "How it works", scrollTarget: "how-it-works" },
  { href: "/markets", label: "Markets" },
  { href: "/calculators", label: "Insights" },
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

export function Navbar({ brandName, logoUrl }: { brandName?: string; logoUrl?: string } = {}) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  function handleNavClick(e: React.MouseEvent, link: { href: string; scrollTarget?: string }) {
    if ("scrollTarget" in link && link.scrollTarget) {
      e.preventDefault();
      if (pathname === "/") {
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
  const linkCls = isHome
    ? "px-3 py-2 text-sm font-medium text-slate-700 transition hover:text-[#2563EB]"
    : "text-pine-800 hover:text-pine-950";

  return (
    <header
      className={`sticky top-0 z-50 w-full shrink-0 ${
        isHome
          ? "border-b border-slate-200/80 bg-white/90 backdrop-blur-md"
          : "border-b border-pine-900/10 bg-cream-white shadow-sm"
      }`}
    >
      <div className="relative mx-auto flex h-[4.25rem] w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <BrandLogo
          href="/"
          brandName={brandName}
          logoUrl={logoUrl}
          showIcon
          iconClassName={isHome ? "border-transparent bg-[#2563EB] text-white shadow-none" : undefined}
          textClassName={isHome ? "font-sans text-[1.35rem] font-extrabold tracking-tight text-slate-950" : "text-pine-950"}
        />

        {/* Center: Navigation Links */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex">
          {(isHome ? homeNav : links).map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={(e) => handleNavClick(e, l)}
              className={`text-xs xl:text-sm font-medium whitespace-nowrap transition ${linkCls}`}
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
              className={`text-xs xl:text-sm font-semibold whitespace-nowrap rounded-xl px-3 py-1.5 transition shadow-sm ${
                isHome
                  ? "border border-[#2563EB] bg-[#2563EB] text-white hover:brightness-110"
                  : "text-gold-dark hover:text-gold border border-gold/40 bg-gold/10 hover:bg-gold/20"
              }`}
            >
              {getRoleLabel(session.user.role)}
            </Link>
          )}
        </nav>

        {/* Right: User Session Controls */}
        <div className="hidden items-center gap-1 lg:flex shrink-0">
          {session ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/profile"
                title="Profile & account settings"
                className={`text-xs xl:text-sm font-medium whitespace-nowrap max-w-[160px] truncate ${linkCls}`}
              >
                {session.user.name}
              </Link>
              <Button
                variant="ghost"
                className={`text-xs xl:text-sm whitespace-nowrap ${linkCls} hover:bg-pine-900/5`}
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Sign out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Link
                href="/login"
                className={
                  isHome
                    ? "inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-400"
                    : "rounded-full px-3 py-2 text-sm font-medium text-pine-800"
                }
              >
                {isHome ? "Sign in" : "Log in"}
              </Link>
              {!isHome && (
              <Link
                href="/register"
                className="inline-flex items-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
              >
                Get started
              </Link>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          className={`lg:hidden rounded-lg p-2 shrink-0 ${isHome ? "text-slate-700" : "text-pine-800"}`}
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="border-t border-pine-900/10 bg-cream-white px-4 py-4 md:hidden shadow-lg">
          {(isHome ? homeNav : links).map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block py-2 text-pine-800 hover:text-pine-950"
              onClick={(e) => handleNavClick(e, l)}
            >
              {l.label}
            </Link>
          ))}
          {(session?.user?.role === "SUPERADMIN" || session?.user?.role === "EMPLOYEE") && (
            <Link
              href="/admin"
              className="block py-2 font-semibold text-gold-dark"
              onClick={() => setOpen(false)}
            >
              Admin Panel
            </Link>
          )}
          {session ? (
            <>
              <Link href="/dashboard/profile" className="block py-2 font-medium text-pine-800 hover:text-pine-950" onClick={() => setOpen(false)}>
                Profile &amp; settings
              </Link>
              <Button variant="ghost" className="mt-2 w-full text-pine-800 hover:text-pine-950 hover:bg-pine-900/5" onClick={() => signOut({ callbackUrl: "/login" })}>
                Sign out
              </Button>
            </>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              <Link href="/login" onClick={() => setOpen(false)}>
                <Button variant="secondary" className="w-full border-pine-900/15 bg-cream-100 text-pine-900 hover:bg-pine-100">Log in</Button>
              </Link>
              <Link href="/register" onClick={() => setOpen(false)}>
                <Button
                  variant="gold"
                  className={`w-full rounded-full ${isHome ? "bg-[#2563EB] text-white hover:bg-[#1d4ed8] shadow-none" : ""}`}
                >
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
