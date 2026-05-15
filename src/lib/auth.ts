import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import type { Role } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/signin",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = String(credentials.email).toLowerCase().trim();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.isActive) return null;
        const ok = await bcrypt.compare(String(credentials.password), user.password);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          venueId: user.venueId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: Role }).role;
        token.venueId = (user as { venueId: string }).venueId;
      } else if (token.id || token.sub) {
        const id = String(token.id ?? token.sub);
        const dbUser = await prisma.user.findUnique({
          where: { id },
          select: { venueId: true, role: true },
        });
        if (dbUser) {
          token.id = id;
          token.role = dbUser.role;
          token.venueId = dbUser.venueId;
        }
      }
      if (trigger === "update" && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: String(token.id) },
          select: { venueId: true, role: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.venueId = dbUser.venueId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.venueId = token.venueId as string;
      }
      return session;
    },
  },
});
