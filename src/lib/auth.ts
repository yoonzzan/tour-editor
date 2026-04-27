// src/lib/auth.ts — NextAuth v5 설정
// 개발용 Credentials provider (SHA-256, 프로덕션에서는 허브 계정 연동으로 교체)

import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { createHash } from "crypto";
import { db } from "@/lib/db";
import { Role } from "@/types";
import { getToken } from "next-auth/jwt";
import { config } from "@/lib/config";
import type { NextRequest } from "next/server";

// ── 타입 확장 ────────────────────────────────────────────

declare module "next-auth" {
  interface User {
    role: Role;
  }
  interface Session {
    user: {
      role: Role;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: Role;
  }
}

// ── 유틸 ────────────────────────────────────────────────

function hashPassword(plain: string): string {
  return createHash("sha256").update(plain).digest("hex");
}

// ── NextAuth 설정 ────────────────────────────────────────

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: config.auth.secret,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user) return null;

        const hashed = hashPassword(password);
        if (user.password !== hashed) return null;

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
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.role = token.role as Role;
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});

export async function getApiToken(req: NextRequest) {
  return getToken({ req, secret: config.auth.secret });
}
