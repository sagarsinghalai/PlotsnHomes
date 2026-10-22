import { Role } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      image?: string | null;
      // The tenant (Organization) this user belongs to. Null until assigned.
      tenantId?: string | null;
    };
    // True when a platform owner is currently impersonating this user.
    impersonating?: boolean;
    // The real platform-owner behind an impersonation session (for the banner/audit).
    impersonator?: {
      id: string;
      name?: string | null;
      email?: string | null;
      role?: Role;
    };
  }

  interface User {
    id: string;
    role: Role;
    tenantId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    tenantId?: string | null;
    stale?: boolean;
    // Impersonation state. When `impersonating` is true, `id`/`role` are the
    // impersonated user and the `actual*` fields hold the real platform owner.
    impersonating?: boolean;
    actualUserId?: string;
    actualRole?: Role;
    actualName?: string | null;
    actualEmail?: string | null;
    actualTenantId?: string | null;
  }
}
