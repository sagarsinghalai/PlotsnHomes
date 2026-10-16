"use client";

import React, { createContext, useContext, useEffect } from "react";
import { usePathname } from "next/navigation";
import { PERMISSIONS_SCHEMA, RolePermissionsConfig, PermissionGroup } from "@/lib/permissions";

type PermissionsContextType = {
  permissions: RolePermissionsConfig;
  userGroup: PermissionGroup;
  userRole: string;
  hasItemPermission: (href?: string) => boolean;
  hasAddPermission: (href?: string) => boolean;
  hasEditPermission: (href?: string) => boolean;
  hasDeletePermission: (href?: string) => boolean;
  hasSubPermission: (permissionKey: string, subKey: string) => boolean;
};

const PermissionsContext = createContext<PermissionsContextType | null>(null);

export function AdminPermissionsProvider({
  children,
  permissions,
  userGroup,
  userRole,
}: {
  children: React.ReactNode;
  permissions: RolePermissionsConfig;
  userGroup: PermissionGroup;
  userRole: string;
}) {
  const pathname = usePathname();

  const getPermissionKey = (href: string) => {
    let bestMatch: any = null;
    for (const head of PERMISSIONS_SCHEMA) {
      for (const subhead of head.subheads) {
        if (subhead.route === "/admin") {
          if (href === "/admin") {
            bestMatch = subhead;
          }
        } else if (href === subhead.route || href.startsWith(subhead.route + "/")) {
          if (!bestMatch || subhead.route.length > bestMatch.route.length) {
            bestMatch = subhead;
          }
        }
      }
    }
    return bestMatch ? bestMatch.key : null;
  };

  const hasItemPermission = (href?: string) => {
    if (userRole === "SUPERADMIN") return true;
    const targetHref = href || pathname;
    const permissionKey = getPermissionKey(targetHref);
    if (!permissionKey) return true;
    return permissions[userGroup]?.[permissionKey]?.view ?? false;
  };

  const hasAddPermission = (href?: string) => {
    if (userRole === "SUPERADMIN") return true;
    const targetHref = href || pathname;
    const permissionKey = getPermissionKey(targetHref);
    if (!permissionKey) return true;
    return permissions[userGroup]?.[permissionKey]?.add ?? false;
  };

  const hasEditPermission = (href?: string) => {
    if (userRole === "SUPERADMIN") return true;
    const targetHref = href || pathname;
    const permissionKey = getPermissionKey(targetHref);
    if (!permissionKey) return true;
    return permissions[userGroup]?.[permissionKey]?.edit ?? false;
  };

  const hasDeletePermission = (href?: string) => {
    if (userRole === "SUPERADMIN") return true;
    const targetHref = href || pathname;
    const permissionKey = getPermissionKey(targetHref);
    if (!permissionKey) return true;
    return permissions[userGroup]?.[permissionKey]?.delete ?? false;
  };

  const hasSubPermission = (permissionKey: string, subKey: string) => {
    if (userRole === "SUPERADMIN") return true;
    const subObj = (permissions[userGroup]?.[permissionKey] as Record<string, boolean>) || {};
    return subObj[subKey] ?? true;
  };

  // Client-side route guard to prevent accessing unauthorized links on transition
  useEffect(() => {
    if (userRole === "SUPERADMIN") return;
    const allowed = hasItemPermission(pathname);
    if (!allowed) {
      window.location.href = "/dashboard?error=Access+Denied";
    }
  }, [pathname, userRole, userGroup, permissions]);

  return (
    <PermissionsContext.Provider
      value={{
        permissions,
        userGroup,
        userRole,
        hasItemPermission,
        hasAddPermission,
        hasEditPermission,
        hasDeletePermission,
        hasSubPermission,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function useAdminPermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error("useAdminPermissions must be used within an AdminPermissionsProvider");
  }
  return context;
}
