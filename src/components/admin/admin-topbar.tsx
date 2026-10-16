"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminPermissions } from "@/components/admin/admin-permissions-context";

interface AdminTopbarProps {
  onMenuClick: () => void;
}

export function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { hasAddPermission } = useAdminPermissions();
  const canAddProperty = hasAddPermission("/admin/properties");

  function handleSignOut() {
    router.push("/api/auth/signout");
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;

    if (q.toUpperCase().startsWith("USR-") || q.match(/^\d+$/)) {
      router.push(`/admin/users?search=${encodeURIComponent(q)}`);
    } else {
      router.push(`/admin/users?search=${encodeURIComponent(q)}`);
    }
  }

  return (
    <div className="a-topbar">
      <button className="a-mob-menu-btn" onClick={onMenuClick} aria-label="Menu">
        ☰
      </button>
      <div className="a-tb-title">Dashboard</div>
      <form onSubmit={handleSearchSubmit} className="a-tb-search">
        <span>⌕</span>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by User ID (e.g. USR-10001), name, or email..."
        />
      </form>
      <Link href="/admin/communications" className="a-btn a-btn-ghost">
        🔔
      </Link>
      {canAddProperty && (
        <Link href="/admin/properties/new" className="a-btn a-btn-acc">
          + Add Property
        </Link>
      )}
      <button
        className="a-btn a-btn-ghost"
        onClick={handleSignOut}
        style={{ color: "#f87171", borderColor: "rgba(220,38,38,.2)" }}
        title="Sign Out"
      >
        Sign Out
      </button>
    </div>
  );
}
