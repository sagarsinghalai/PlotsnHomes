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

function isCurrent(pathname: string, href: string) {
  if (href.includes("#")) return false;
  if (href === "/calculators") return pathname === "/calculators";
  if (href === "/dashboard") return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  return pathname === href || pathname.startsWith(`${href}/`);
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
        if (el) el.scrollIntoView({ behavior: "smooth" });
      } else {
        router.push(link.href);
      }
    } else {
      router.push(link.href);
    }
    setOpen(false);
  }

  const navLinks = links;

  return (
    <header className="sticky top-0 z-50 w-full shrink-0 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="relative mx-auto flex h-[4.25rem] w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <BrandLogo
          href="/"
          brandName={brandName}
          logoUrl={logoUrl}
          showIcon
          iconClassName="border-transparent bg-[#2563EB] text-white shadow-none"
          textClassName="font-sans text-[1.35rem] font-extrabold tracking-tight text-slate-950"
        />

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 lg:flex">
          {navLinks.map((l) => {
            const active = isCurrent(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={(e) => handleNavClick(e, l)}
                className={`whitespace-nowrap rounded-full px-3 py-2 text-sm transition ${
                  active
                    ? "bg-[#E8F0FE] font-semibold text-[#2563EB]"
                    : "font-medium text-slate-700 hover:bg-slate-50 hover:text-[#2563EB]"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          {session?.user && (
            <Link
              href={
                session.user.role === "SUPERADMIN" || session.user.role === "EMPLOYEE"
                  ? "/admin"
                  : "/dashboard"
              }
              className="whitespace-nowrap rounded-full bg-[#2563EB] px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
            >
              {getRoleLabel(session.user.role)}
            </Link>
          )}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          {session ? (
            <>
              <Link
                href="/dashboard/profile"
                title="Profile & account settings"
                className="max-w-[160px] truncate rounded-full px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-[#2563EB]"
              >
                {session.user.name}
              </Link>
              <Button
                variant="ghost"
                className="rounded-full px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#2563EB]"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-400"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center rounded-full bg-[#2563EB] px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="shrink-0 rounded-lg p-2 text-slate-700 lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
          aria-expanded={open}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 shadow-lg lg:hidden">
          {navLinks.map((l) => {
            const active = isCurrent(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`block rounded-xl px-3 py-2.5 text-sm font-medium ${
                  active ? "bg-[#E8F0FE] text-[#2563EB]" : "text-slate-800 hover:bg-slate-50"
                }`}
                onClick={(e) => handleNavClick(e, l)}
              >
                {l.label}
              </Link>
            );
          })}
          {(session?.user?.role === "SUPERADMIN" || session?.user?.role === "EMPLOYEE") && (
            <Link
              href="/admin"
              className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-[#2563EB]"
              onClick={() => setOpen(false)}
            >
              Admin Panel
            </Link>
          )}
          {session ? (
            <div className="mt-2 border-t border-slate-100 pt-2">
              <Link
                href="/dashboard/profile"
                className="block rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
                onClick={() => setOpen(false)}
              >
                Profile &amp; settings
              </Link>
              <Button
                variant="ghost"
                className="mt-1 w-full justify-start rounded-xl px-3 text-slate-800 hover:bg-slate-50"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Sign out
              </Button>
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white"
              >
                Get started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
