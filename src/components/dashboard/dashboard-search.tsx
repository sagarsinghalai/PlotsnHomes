"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function DashboardSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/properties?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="mt-6 max-w-2xl">
      <div className="relative flex items-center">
        <input
          type="text"
          placeholder="Search verified properties by location, name, or symbol..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 pr-16 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand focus:ring-1 focus:ring-brand"
        />
        <button
          type="submit"
          className="absolute right-2 top-2 bottom-2 rounded-xl bg-brand hover:bg-brand-hover px-4 text-white transition flex items-center justify-center"
          aria-label="Search properties"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
