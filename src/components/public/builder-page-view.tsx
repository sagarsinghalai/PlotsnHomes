import Link from "next/link";
import { SectionRenderer } from "@/components/admin/webpage-editor/section-renderer";
import { PublicFooter } from "@/components/public/public-footer";
import type { CustomPage, NavSettings, FooterSettings } from "@/lib/webpage-editor-store";

/**
 * Renders a builder (CustomPage) as a full public page: top navbar, the page's
 * sections, and the customizable footer. Shared by /p/<slug> and by real routes
 * (home, pricing, …) that an admin has taken over with a published override.
 */
export function BuilderPageView({
  page,
  nav,
  footer,
}: {
  page: CustomPage;
  nav: NavSettings;
  footer: FooterSettings;
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col justify-between font-sans">
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-lg">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/20 text-brand-hover font-black border border-brand/40">
              P
            </div>
            <span className="font-extrabold tracking-tight">PlotsnHomes</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Link href="/" className="hover:text-brand-hover transition">Home</Link>
            <Link href="/admin/properties" className="hover:text-brand-hover transition">Properties</Link>
            <Link href="/admin/projects" className="hover:text-brand-hover transition">Projects</Link>
            {nav.headerLinks.map((item) => (
              <Link key={item.id} href={item.url} className="hover:text-brand-hover transition">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-extrabold shadow-sm transition"
            >
              Admin Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {page.sections.map((section) => (
          <SectionRenderer key={section.id} section={section} />
        ))}
      </main>

      <PublicFooter footer={footer} />
    </div>
  );
}
