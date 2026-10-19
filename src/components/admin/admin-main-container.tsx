"use client";

import { useEffect, useState } from "react";
import { AdminThemeToggle } from "@/components/admin/admin-theme-toggle";

export function AdminMainContainer({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"dark" | "light">("light");

  useEffect(() => {
    // v2 key: the redesign defaults the dashboard to light (toggle still available).
    const saved = localStorage.getItem("plotsnhomes-admin-dashboard-theme-v2") as "dark" | "light" | null;
    const activeTheme = saved === "light" || saved === "dark" ? saved : "light";
    setTheme(activeTheme);
    
    if (activeTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
  }, []);

  function handleThemeChange(newTheme: "dark" | "light") {
    setTheme(newTheme);
    localStorage.setItem("plotsnhomes-admin-dashboard-theme-v2", newTheme);
    
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
  }

  return (
    <div
      className={`admin-shell admin-main-container ${theme} flex-1 min-w-0 max-w-full md:ml-64 flex flex-col h-screen overflow-hidden transition-colors duration-300 ${
        theme === "light"
          ? "bg-slate-50 text-slate-900"
          : "bg-slate-950 text-slate-100"
      }`}
    >
      {/* Top Header Bar for Right Content Panel */}
      <div
        className={`px-6 py-3 border-b flex items-center justify-between transition-colors shrink-0 ${
          theme === "light" ? "bg-white border-slate-200" : "bg-slate-900/90 border-slate-800"
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand">
            Dashboard View
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold ${theme === "light" ? "text-slate-700" : "text-slate-300"}`}>
            {theme === "light" ? "Light Mode" : "Dark Mode"}
          </span>
          <AdminThemeToggle onThemeChange={handleThemeChange} initialTheme={theme} />
        </div>
      </div>

      {/* Main Page Content View - Dedicated Mouse Roller Scroll Container */}
      <div className="p-4 sm:p-6 lg:p-8 flex-1 min-w-0 min-h-0 max-w-full overflow-y-auto overflow-x-hidden">{children}</div>
    </div>
  );
}
