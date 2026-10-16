import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

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
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.stale = false;
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
        session.user.role = (token.role as import("@prisma/client").Role) ?? "BUYER";
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
