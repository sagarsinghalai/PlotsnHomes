"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

interface AdminThemeToggleProps {
  onThemeChange?: (theme: "dark" | "light") => void;
  initialTheme?: "dark" | "light";
}

export function AdminThemeToggle({ onThemeChange, initialTheme = "dark" }: AdminThemeToggleProps) {
  const [theme, setTheme] = useState<"dark" | "light">(initialTheme);

  useEffect(() => {
    const saved = localStorage.getItem("plotsnhomes-admin-dashboard-theme");
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
      onThemeChange?.(saved);
    }
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("plotsnhomes-admin-dashboard-theme", nextTheme);
    onThemeChange?.(nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative flex h-8 w-14 items-center rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-gold ${
        theme === "light"
          ? "bg-amber-100 border border-amber-300"
          : "bg-slate-800 border border-slate-700"
      }`}
      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle Theme"
    >
      <div
        className={`flex h-6 w-6 items-center justify-center rounded-full shadow-md transition-transform duration-300 transform ${
          theme === "light"
            ? "translate-x-6 bg-gold text-slate-950"
            : "translate-x-0 bg-slate-900 text-gold"
        }`}
      >
        {theme === "light" ? (
          <Sun className="h-3.5 w-3.5 text-slate-950 stroke-[2.5]" />
        ) : (
          <Moon className="h-3.5 w-3.5 text-gold stroke-[2.5]" />
        )}
      </div>
    </button>
  );
}
