import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import type { Role } from "@prisma/client";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/roles";
import { writeAudit } from "@/lib/audit";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });
        if (!user) return null;
        // Only block when explicitly disabled (undefined = legacy row, still allow login)
        if (user.active === false) return null;

        const valid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!valid) return null;

        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { lastActiveAt: new Date(), active: true },
          });
        } catch (e) {
          console.warn("[BrickVest] activity update skipped:", e);
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.stale = false;
      }

      // --- Impersonation controls (platform-owner only) ---
      // Driven from the client via useSession().update({ impersonateUserId })
      // and update({ stopImpersonation: true }). Authorization is enforced here,
      // server-side, so a non-owner cannot impersonate by crafting an update.
      if (trigger === "update" && session && typeof session === "object") {
        const s = session as { impersonateUserId?: string; stopImpersonation?: boolean };

        if (s.impersonateUserId) {
          const actorId = (token.actualUserId ?? token.id) as string | undefined;
          const actorRole = (token.actualRole ?? token.role) as Role | undefined;
          if (actorId && actorRole && isSuperAdmin(actorRole)) {
            const target = await prisma.user.findUnique({
              where: { id: s.impersonateUserId },
              select: { id: true, role: true, email: true, active: true },
            });
            // Never impersonate another platform admin; never an inactive user.
            if (target && target.active !== false && !isSuperAdmin(target.role)) {
              if (!token.impersonating) {
                const actor = await prisma.user.findUnique({
                  where: { id: actorId },
                  select: { name: true, email: true },
                });
                token.actualUserId = actorId;
                token.actualRole = actorRole;
                token.actualName = actor?.name ?? null;
                token.actualEmail = actor?.email ?? null;
              }
              token.id = target.id;
              token.role = target.role;
              token.impersonating = true;
              await writeAudit({
                actorId,
                actorEmail: token.actualEmail ?? null,
                action: "IMPERSONATE_START",
                targetUserId: target.id,
                targetEmail: target.email,
              });
            }
          }
          return token;
        }

        if (s.stopImpersonation && token.impersonating) {
          const actorId = token.actualUserId as string;
          await writeAudit({
            actorId,
            actorEmail: token.actualEmail ?? null,
            action: "IMPERSONATE_STOP",
            targetUserId: token.id as string,
          });
          token.id = actorId;
          token.role = token.actualRole as Role;
          token.impersonating = false;
          delete token.actualUserId;
          delete token.actualRole;
          delete token.actualName;
          delete token.actualEmail;
          return token;
        }
      }

      // Validate token user on each callback so reseeded/deleted users are signed out cleanly.
      if (!user && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { id: true, role: true, active: true },
        });

        if (!dbUser || dbUser.active === false) {
          delete token.id;
          delete token.role;
          token.stale = true;
          return token;
        }

        token.role = dbUser.role;
      }

      if (trigger === "update" && token.id) {
        await prisma.user.updateMany({
          where: { id: token.id as string, active: true },
          data: { lastActiveAt: new Date() },
        });
      }
      return token;
    },
    async session({ session, token }) {
      if (!token.id || token.stale) {
        return null as unknown as typeof session;
      }
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as Role) ?? "BUYER";
      }
      session.impersonating = !!token.impersonating;
      if (token.impersonating) {
        session.impersonator = {
          id: token.actualUserId as string,
          name: token.actualName ?? null,
          email: token.actualEmail ?? null,
          role: token.actualRole as Role,
        };
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return url;
      try {
        if (new URL(url).origin === new URL(baseUrl).origin) return url;
      } catch {}
      return "/login";
    },
  },
};
