import { cookies } from "next/headers";
import { decode } from "next-auth/jwt";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/http";
import { readSessionCookie } from "./session-cookie";

/**
 * The signed-in user's id, read straight from NextAuth's session cookie.
 *
 * This deliberately doesn't use next-auth v4's getServerSession(): that reads Next's cookies() and
 * headers() through code written before Next.js 15/16 made them async, and if it misreads them,
 * every server page thinks you're logged out and requirePageRole() sends you back to /login right
 * after a successful sign-in. `await cookies()` + next-auth's public decode() works on any version.
 */
async function sessionUserId(): Promise<string | null> {
  // Read cookies first, unconditionally: that's what tells Next.js these pages are per-user and
  // must be rendered on each request. Bailing out earlier (e.g. no secret in the build environment)
  // let Next pre-build pages like "/" as static HTML at build time, which skips role redirects and
  // queries the database during the build.
  const raw = readSessionCookie((await cookies()).getAll());
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    console.error("[auth] NEXTAUTH_SECRET is not set; nobody can stay logged in.");
    return null;
  }
  if (!raw) return null;
  try {
    const token = await decode({ token: raw, secret });
    return typeof token?.uid === "string" ? token.uid : null;
  } catch {
    return null; // expired, tampered with, or signed with an old secret: treat as logged out
  }
}

/** Reads role/status from the DB each time, so a suspended user loses access immediately. */
export async function currentUser() {
  const id = await sessionUserId();
  if (!id) return null;
  const u = await db.user.findUnique({ where: { id }, select: { id: true, role: true, status: true, name: true, phoneE164: true } });
  return u && u.status === "ACTIVE" ? u : null;
}
export async function requireRole(...roles: Role[]) {
  const u = await currentUser();
  if (!u) throw new HttpError(401, "Log in to continue.");
  if (!roles.includes(u.role)) throw new HttpError(403, "You don't have access to this.");
  return u;
}
export async function requirePageRole(...roles: Role[]) {
  const u = await currentUser();
  if (!u) redirect("/login");
  if (!roles.includes(u.role)) redirect("/");
  return u;
}
