import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { authOptions } from "./options";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/http";

/** Reads role/status from the DB each time, so a suspended user loses access immediately. */
export async function currentUser() {
  const s = await getServerSession(authOptions);
  const id = (s?.user as { id?: string } | undefined)?.id;
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
