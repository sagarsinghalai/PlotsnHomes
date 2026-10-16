import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Download,
  ExternalLink,
  Globe,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  Send,
  Share2,
} from "lucide-react";
import { FooterSettings, NavItemLink } from "@/lib/webpage-editor-store";

const ICON_MAP: Record<string, any> = {
  ArrowRight,
  Phone,
  Mail,
  MessageSquare,
  Download,
  Calendar,
  ExternalLink,
  Globe,
  Share2,
  Send,
  MessageCircle,
};

export function PublicFooter({ footer }: { footer: FooterSettings }) {
  return (
    <footer className="bg-slate-900 text-white border-t border-slate-800 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand & Boilerplate */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-bold text-white text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold text-slate-950 font-black">
              P
            </div>
            <span className="font-extrabold tracking-tight">{footer.brandName || "PlotsnHomes"}</span>
          </div>
          {footer.brandTagline && (
            <p className="text-xs font-semibold text-gold">{footer.brandTagline}</p>
          )}
          <p className="text-xs text-slate-400 leading-relaxed">{footer.boilerplateText}</p>

          {/* Social Links */}
          {footer.socialLinks && footer.socialLinks.length > 0 && (
            <div className="flex items-center gap-2 pt-2">
              {footer.socialLinks.map((s) => {
                const IconComp = ICON_MAP[s.icon] || Globe;
                return (
                  <a
                    key={s.id}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-slate-800 hover:bg-gold hover:text-slate-950 text-slate-300 transition"
                    title={s.platform}
                  >
                    <IconComp className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Dynamic Columns */}
        {footer.columns.map((col) => (
          <div key={col.id} className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-gold">{col.columnTitle}</h4>
            <ul className="space-y-2 text-xs text-slate-400 font-medium">
              {col.links.map((link: NavItemLink) => (
                <li key={link.id}>
                  <Link href={link.url} className="hover:text-white transition">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Custom Buttons */}
        {footer.customButtons && footer.customButtons.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-gold">Actions</h4>
            <div className="space-y-2.5">
              {footer.customButtons.map((btn) => {
                const IconComp = (btn.icon && ICON_MAP[btn.icon]) || ArrowRight;
                const padClass =
                  btn.paddingSize === "compact"
                    ? "px-3 py-1.5"
                    : btn.paddingSize === "large"
                    ? "px-6 py-3.5"
                    : "px-4 py-2.5";

                const fontW =
                  btn.fontWeight === "normal"
                    ? "font-normal"
                    : btn.fontWeight === "medium"
                    ? "font-medium"
                    : btn.fontWeight === "semibold"
                    ? "font-semibold"
                    : btn.fontWeight === "extrabold"
                    ? "font-extrabold"
                    : "font-bold";

                const fontS =
                  btn.fontSize === "xs"
                    ? "text-xs"
                    : btn.fontSize === "sm"
                    ? "text-sm"
                    : btn.fontSize === "lg"
                    ? "text-lg"
                    : "text-base";

                return (
                  <Link
                    key={btn.id}
                    href={btn.url}
                    className={`inline-flex items-center justify-center gap-2 ${padClass} ${fontW} ${fontS} transition shadow-md block w-full text-center`}
                    style={{
                      fontFamily: btn.fontFamily || "inherit",
                      fontStyle: btn.fontStyle || "normal",
                      color: btn.textColor || "#ffffff",
                      background: btn.bgColor || "#0f172a",
                      borderColor: btn.borderColor || "transparent",
                      borderWidth: `${btn.borderWidth ?? 0}px`,
                      borderStyle: btn.borderWidth ? "solid" : "none",
                      borderRadius: `${btn.borderRadius ?? 12}px`,
                    }}
                  >
                    <span>{btn.label}</span>
                    <IconComp className="h-3.5 w-3.5" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
        <p>{footer.copyrightText}</p>
        {footer.poweredByText && <p>{footer.poweredByText}</p>}
      </div>
    </footer>
  );
}
