import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { loginSchema } from "@/lib/validators/auth";

const providers: NextAuthConfig["providers"] = [
  Credentials({
    credentials: {
      email: {},
      password: {},
    },
    async authorize(rawCredentials) {
      const parsed = loginSchema.safeParse(rawCredentials);

      if (!parsed.success) {
        return null;
      }

      const user = await db.user.findUnique({
        where: { email: parsed.data.email.toLowerCase() },
        include: {
          memberships: {
            where: { active: true },
          },
        },
      });

      if (!user?.passwordHash || user.memberships.length === 0) {
        return null;
      }

      const passwordMatches = await compare(parsed.data.password, user.passwordHash);

      if (!passwordMatches) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      };
    },
  }),
];

if (env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: env.AUTH_GITHUB_ID,
      clientSecret: env.AUTH_GITHUB_SECRET,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 12,
  },
  secret: env.AUTH_SECRET,
  trustHost: env.AUTH_TRUST_HOST === "true",
  useSecureCookies: env.NODE_ENV === "production",
  pages: {
    signIn: "/login",
  },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }

      return token;
    },
    async signIn({ user, account }) {
      if (account?.provider !== "github") {
        return true;
      }

      if (!user.email) {
        return false;
      }

      const existingUser = await db.user.findUnique({
        where: { email: user.email.toLowerCase() },
        include: {
          memberships: {
            where: { active: true },
          },
        },
      });

      return Boolean(existingUser && existingUser.memberships.length > 0);
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      return session;
    },
  },
});
