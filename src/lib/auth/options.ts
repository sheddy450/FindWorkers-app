import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verify } from "@node-rs/argon2";
import { db } from "@/lib/db";
import { loginSchema, toE164NG } from "@/lib/validation/auth";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 14 },
  pages: { signIn: "/login" },
  providers: [Credentials({
    credentials: { identifier: {}, password: {} },
    async authorize(raw) {
      const p = loginSchema.safeParse(raw);
      if (!p.success) return null;
      const id = p.data.identifier.trim();
      const user = await db.user.findFirst({
        where: id.includes("@") ? { email: id.toLowerCase() } : { phoneE164: toE164NG(id) ?? "none" },
      }).catch((err: unknown) => {
        // Log the real cause (e.g. a bad DATABASE_URL) so it shows in the Vercel logs, and send the
        // client a generic code so it can say "try again" instead of "wrong password".
        console.error("[auth] database error during login", err);
        throw new Error("ServerError");
      });
      if (!user || user.status !== "ACTIVE") return null;
      if (!(await verify(user.passwordHash, p.data.password))) return null;
      return { id: user.id, name: user.name, role: user.role } as never;
    },
  })],
  callbacks: {
    jwt({ token, user }) { if (user) { token.uid = user.id; token.role = (user as any).role; } return token; },
    session({ session, token }) {
      (session.user as any).id = token.uid; (session.user as any).role = token.role; return session;
    },
  },
};
