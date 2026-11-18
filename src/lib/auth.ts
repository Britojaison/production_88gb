import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getDbUserByEmail } from "@/lib/user-lookup";
import type { Role } from "@/lib/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user) {
          return null;
        }

        const valid = await compare(credentials.password, user.passwordHash);
        if (!valid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as Role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
        token.name = user.name;
      }

      // Keep id/role in sync with DB (seed/reset creates new user ids).
      // Only a user that is *confirmed missing* logs the session out. If the database
      // is unreachable (e.g. pooler out of connections) keep the existing token —
      // otherwise one DB hiccup signs out every device at once.
      const email = typeof token.email === "string" ? token.email : undefined;
      if (email) {
        let dbUser: Awaited<ReturnType<typeof getDbUserByEmail>> | undefined;
        try {
          dbUser = await getDbUserByEmail(email);
        } catch (err) {
          console.error("[auth] user lookup failed; keeping existing session", err);
          return token;
        }
        if (!dbUser) {
          delete token.id;
          delete token.role;
          return token;
        }
        token.id = dbUser.id;
        token.role = dbUser.role as Role;
        token.name = dbUser.name;
      }

      return token;
    },
    async session({ session, token }) {
      if (!token.id || !token.role) {
        return { ...session, user: undefined as never };
      }
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        if (typeof token.name === "string") {
          session.user.name = token.name;
        }
      }
      return session;
    },
  },
};
