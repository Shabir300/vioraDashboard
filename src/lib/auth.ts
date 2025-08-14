import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name ?? undefined,
          email: user.email,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      // On initial sign in, attach user id
      if (user?.id) {
        token.userId = user.id;
      }

      // Attach membership context (first org membership)
      if (typeof token.userId === "string") {
        const userId = token.userId;
        const membership = await prisma.organizationMembership.findFirst({
          where: { userId },
          include: { organization: true },
        });
        if (membership) {
          token.organizationId = membership.organizationId;
          token.orgRole = membership.role;
        }
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true },
        });
        if (dbUser) token.userRole = dbUser.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-expect-error custom
        session.user.id = token.userId as string | undefined;
        // @ts-expect-error custom
        session.user.userRole = token.userRole;
        // @ts-expect-error custom
        session.user.orgRole = token.orgRole;
        // @ts-expect-error custom
        session.organizationId = token.organizationId as string | undefined;
      }
      return session;
    },
  },
  cookies: {
    // Use secure cookies in production
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export type AppSession = {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    userRole?: string;
    orgRole?: string;
  };
  organizationId?: string;
} & Record<string, unknown>;


